/**
 * Module de rendu des tables
 */

var currentTableFilter = 'all';

// Fonction utilitaire pour calculer le temps d'occupation
function getOccupationTime(table) {
  if (!table.occupiedAt) return null;
  var occupiedAt = new Date(table.occupiedAt);
  var now = new Date();
  var diffMinutes = Math.floor((now - occupiedAt) / 1000 / 60);
  
  if (diffMinutes < 60) {
    return diffMinutes + ' min';
  } else {
    var hours = Math.floor(diffMinutes / 60);
    var minutes = diffMinutes % 60;
    return hours + 'h' + (minutes > 0 ? minutes.toString().padStart(2, '0') : '');
  }
}


function setTableFilter(filterStr) {
  currentTableFilter = filterStr;
  UI.showPage('tables');
  renderTables();
}


function renderTables() {
  // Pre-fetch all necessary data in parallel to avoid N+1 queries
  Promise.all([
    Tables.getAll(),
    Orders.getAll(),
    CafeDB.getAll(CafeDB.STORES.orderItems)
  ]).then(function (results) {
    var tables = results[0];
    var allOrders = results[1];
    var allItems = results[2];

    // Build Maps for O(1) lookup
    var activeOrdersByTableId = {};
    var itemsCountByOrderId = {};

    // Process items count per order
    allItems.forEach(function (item) {
      if (!itemsCountByOrderId[item.orderId]) {
        itemsCountByOrderId[item.orderId] = 0;
      }
      itemsCountByOrderId[item.orderId]++;
    });

    // Map pending orders to tables
    allOrders.forEach(function (o) {
      if (o.status === Orders.ORDER_STATUS.PENDING) {
        activeOrdersByTableId[o.tableId] = o;
      }
    });

    // Organiser les tables par catégories
    var categorizedTables = {
      'C': [],
      'Salon': [],
      'Table': [],
      'Autres': []
    };

    tables.forEach(function (table) {
      var name = table.name || table.id;
      if (name.toLowerCase().startsWith('c')) {
        categorizedTables['C'].push(table);
      } else if (name.toLowerCase().startsWith('salon')) {
        categorizedTables['Salon'].push(table);
      } else if (name.toLowerCase().startsWith('table')) {
        categorizedTables['Table'].push(table);
      } else {
        categorizedTables['Autres'].push(table);
      }
    });

    // Trier chaque catégorie naturellement
    Object.keys(categorizedTables).forEach(function (category) {
      categorizedTables[category].sort(function (a, b) {
        return (a.name || a.id).localeCompare((b.name || b.id), undefined, { numeric: true, sensitivity: 'base' });
      });
    });

    // Filtrer selon l'état actuel
    if (currentTableFilter !== 'all') {
      Object.keys(categorizedTables).forEach(function (category) {
        if (currentTableFilter === 'free') {
          categorizedTables[category] = categorizedTables[category].filter(function (t) { return t.status === Tables.STATUS.FREE; });
        } else if (currentTableFilter === 'occupied') {
          categorizedTables[category] = categorizedTables[category].filter(function (t) { return t.status === Tables.STATUS.OCCUPIED; });
        }
      });
    }

    // Detect groups (tables sharing the same activeOrderId)
    var ordersToTables = {};
    tables.forEach(function (t) {
      if (t.activeOrderId) {
        if (!ordersToTables[t.activeOrderId]) ordersToTables[t.activeOrderId] = [];
        ordersToTables[t.activeOrderId].push(t);
      }
    });

    var groupedOrderIds = Object.keys(ordersToTables).filter(function (oid) {
      return ordersToTables[oid].length > 1;
    });

    // Render Grouped Tables Section
    var mergedSection = document.getElementById('mergedTablesSection');
    var mergedGrid = document.getElementById('mergedTablesGrid');
    if (groupedOrderIds.length > 0) {
      mergedSection.style.display = 'block';
      var mergedHtml = '';
      groupedOrderIds.forEach(function (oid) {
        var groupTables = ordersToTables[oid];
        var groupNames = groupTables.map(function (t) { return t.name || t.id; }).join(' + ');
        var activeOrder = activeOrdersByTableId[groupTables[0].id];
        var info = activeOrder ? (itemsCountByOrderId[activeOrder.id] || 0) + ' articles · ' + UI.formatPrice(activeOrder.total) : '—';
        
        var occupationTime = getOccupationTime(groupTables[0]);
        var timeInfo = occupationTime ? '⏱️ ' + occupationTime : '';

        mergedHtml += '<div class="group-container" style="grid-column: 1 / -1; margin-bottom: 1rem; border: 1px solid var(--accent); border-radius: var(--radius); padding: 1rem; background: var(--bg-body);">';
        mergedHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">';
        mergedHtml += '<div style="font-weight:700; color:var(--accent);">🔗 Groupe: ' + groupNames + '</div>';
        mergedHtml += '<div style="font-size:0.9rem; color:var(--text-secondary);">' + info + '</div>';
        mergedHtml += '</div>';
        if (timeInfo) {
          mergedHtml += '<div style="text-align:center; font-size:0.85rem; color:var(--accent); font-weight:600; margin-bottom:1rem;">' + timeInfo + '</div>';
        }
        mergedHtml += '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:1rem;">';

        groupTables.forEach(function (t) {
          mergedHtml += '<div class="table-card status-occupied" data-table-id="' + t.id + '" data-table-name="' + (t.name || '').replace(/"/g, '&quot;') + '">';
          mergedHtml += '<div class="table-header" style="display:flex; justify-content:space-between; align-items:center;">';
          mergedHtml += '<div class="table-name">' + (t.name || t.id) + '</div>';
          mergedHtml += '<button type="button" class="btn-separate-table" title="Dissocier cette table" data-table-id="' + t.id + '" style="background:var(--accent); border:none; color:#fff; border-radius:4px; padding:2px 6px; font-size:0.75rem; cursor:pointer;">✂️ Séparer</button>';
          mergedHtml += '</div>';
          mergedHtml += '<div class="table-info">Fait partie du groupe</div>';
          mergedHtml += '</div>';
        });

        mergedHtml += '</div></div>';
      });
      mergedGrid.innerHTML = mergedHtml;
    } else {
      mergedSection.style.display = 'none';
      mergedGrid.innerHTML = '';
    }

    // Build the categorized tables UI
    var html = '<div class="table-filters" style="display:flex; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap;">';
    html += '<button class="filter-btn ' + (currentTableFilter === 'all' ? 'active' : '') + '" onclick="window.setTableFilter(\'all\')" style="padding:0.4rem 1rem; border-radius:20px; border:1px solid var(--border); background:' + (currentTableFilter === 'all' ? 'var(--accent)' : 'transparent') + '; color:' + (currentTableFilter === 'all' ? '#fff' : 'var(--text-primary)') + '; cursor:pointer; font-weight:500;">Toutes</button>';
    html += '<button class="filter-btn ' + (currentTableFilter === 'free' ? 'active' : '') + '" onclick="window.setTableFilter(\'free\')" style="padding:0.4rem 1rem; border-radius:20px; border:1px solid var(--status-free); background:' + (currentTableFilter === 'free' ? 'var(--status-free)' : 'transparent') + '; color:' + (currentTableFilter === 'free' ? '#fff' : 'var(--status-free)') + '; cursor:pointer; font-weight:500;">Libres (' + tables.filter((function (t) { return t.status === Tables.STATUS.FREE })).length + ')</button>';
    html += '<button class="filter-btn ' + (currentTableFilter === 'occupied' ? 'active' : '') + '" onclick="window.setTableFilter(\'occupied\')" style="padding:0.4rem 1rem; border-radius:20px; border:1px solid var(--status-occupied); background:' + (currentTableFilter === 'occupied' ? 'var(--status-occupied)' : 'transparent') + '; color:' + (currentTableFilter === 'occupied' ? '#fff' : 'var(--status-occupied)') + '; cursor:pointer; font-weight:500;">Occupées (' + tables.filter((function (t) { return t.status === Tables.STATUS.OCCUPIED })).length + ')</button>';
    html += '</div>';

    var isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';

    // Filter out tables that are already shown in the merged section
    var shownGroupedIds = [];
    groupedOrderIds.forEach(function (oid) {
      ordersToTables[oid].forEach(function (t) { shownGroupedIds.push(t.id); });
    });

    // Render each category
    var categoryOrder = ['C', 'Salon', 'Table', 'Autres'];
    var categoryIcons = {
      'C': '☕',
      'Salon': '🛋️',
      'Table': '🪑',
      'Autres': '📋'
    };

    categoryOrder.forEach(function (category) {
      var categoryTables = categorizedTables[category].filter(function (t) {
        return shownGroupedIds.indexOf(t.id) === -1; // Skip if in group section
      });

      if (categoryTables.length === 0) return;

      html += '<div class="category-section" style="margin-bottom: 2rem;">';
      html += '<h3 style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">';
      html += '<span style="font-size: 1.3rem;">' + categoryIcons[category] + '</span>';
      html += category + ' (' + categoryTables.length + ')';
      html += '</h3>';
      html += '<div class="tables-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:1rem; width:100%;">';

      categoryTables.forEach(function (t) {
        var statusClass = 'status-' + t.status;
        var statusLabel = Tables.STATUS_LABELS[t.status] || t.status;
        var infoText = 'Aucune commande';

        var activeOrder = t.activeOrderId ? activeOrdersByTableId[t.id] : null;
        if (t.activeOrderId && activeOrder) {
          var count = itemsCountByOrderId[activeOrder.id] || 0;
          infoText = count + ' article(s) · ' + UI.formatPrice(activeOrder.total);
        }

        html += '<div class="table-card ' + statusClass + '" data-table-id="' + t.id + '" data-table-name="' + (t.name || '').replace(/"/g, '&quot;') + '" data-occupied-at="' + (t.occupiedAt || '') + '">';
        html += '<div class="table-header" style="display:flex; justify-content:space-between; align-items:center;">';
        html += '<div class="table-name">' + (t.name || t.id) + '</div>';
        if (isAdmin) {
          html += '<button type="button" class="btn-edit-table" style="background:transparent; border:none; cursor:pointer; color:var(--text-secondary); opacity:0.6; padding:4px; border-radius:4px;" title="Modifier la table" data-table-id="' + t.id + '" data-table-name="' + (t.name || '').replace(/"/g, '&quot;') + '" data-table-status="' + t.status + '">✏️</button>';
        }
        html += '</div>';
        html += '<div class="table-status">' + statusLabel + '</div>';
        html += '<div class="table-info" data-info-for="' + t.id + '">' + infoText + '</div>';
        
        // Ajouter le temps d'occupation sur une ligne séparée
        var occupationTime = getOccupationTime(t);
        if (occupationTime) {
          html += '<div class="table-occupation-time" data-time-for="' + t.id + '" style="font-size: 0.85rem; color: var(--accent); font-weight: 600; margin-top: 0.25rem; text-align: center;">⏱️ ' + occupationTime + '</div>';
        }
        
        html += '</div>';
      });

      html += '</div></div>';
    });

    var container = document.getElementById('tablesGrid');
    container.innerHTML = html;

    // Attach events for both grids
    document.querySelectorAll('.table-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.btn-edit-table') || e.target.closest('.btn-separate-table')) return;
        UI.openOrderForTable(card.getAttribute('data-table-id'), card.getAttribute('data-table-name'));
      });
    });

    document.querySelectorAll('.btn-edit-table').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('tableEditId').value = this.getAttribute('data-table-id');
        document.getElementById('tableEditName').value = this.getAttribute('data-table-name');
        document.getElementById('tableEditStatus').value = this.getAttribute('data-table-status');
        UI.openModal('tableEditModal');
      });
    });

    document.querySelectorAll('.btn-separate-table').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var tid = this.getAttribute('data-table-id');
        UI.showConfirm('Séparer la table', 'Voulez-vous vraiment séparer cette table du groupe ? Elle aura une commande indépendante vide.', function () {
          Tables.separate(tid).then(function () {
            renderTables();
          }).catch(function (err) {
            alert(err.message);
          });
        });
      });
    });
    
    // Démarrer le timer pour les compteurs de temps
    startOccupationTimer();
  });
}

// Fonction pour mettre à jour les compteurs de temps en temps réel
function updateOccupationTimers() {
  document.querySelectorAll('.table-card[data-occupied-at]').forEach(function(card) {
    var occupiedAt = card.getAttribute('data-occupied-at');
    var tableId = card.getAttribute('data-table-id');
    var timeElement = card.querySelector('[data-time-for="' + tableId + '"]');
    
    if (occupiedAt && timeElement) {
      var occupiedTime = new Date(occupiedAt);
      var now = new Date();
      var diffMinutes = Math.floor((now - occupiedTime) / 1000 / 60);
      
      var timeDisplay;
      if (diffMinutes < 60) {
        timeDisplay = diffMinutes + ' min';
      } else {
        var hours = Math.floor(diffMinutes / 60);
        var minutes = diffMinutes % 60;
        timeDisplay = hours + 'h' + (minutes > 0 ? minutes.toString().padStart(2, '0') : '');
      }
      
      timeElement.textContent = '⏱️ ' + timeDisplay;
    }
  });
}

// Démarrer le timer pour mettre à jour les compteurs chaque seconde
var occupationTimer;
function startOccupationTimer() {
  // Nettoyer le timer existant s'il y en a un
  if (occupationTimer) {
    clearInterval(occupationTimer);
  }
  
  // Mettre à jour immédiatement puis chaque seconde
  updateOccupationTimers();
  occupationTimer = setInterval(updateOccupationTimers, 1000); // 1 seconde
}

// Arrêter le timer
function stopOccupationTimer() {
  if (occupationTimer) {
    clearInterval(occupationTimer);
    occupationTimer = null;
  }
}

// Exposer les fonctions globalement
window.setTableFilter = setTableFilter;

// Export du module
window.UITables = {
  renderTables: renderTables,
  setTableFilter: setTableFilter,
  updateOccupationTimers: updateOccupationTimers,
  startOccupationTimer: startOccupationTimer,
  stopOccupationTimer: stopOccupationTimer
};