/**
 * Interface utilisateur principale - Module central
 */

var currentOrderId = null;
var currentTableId = null;
var currencySymbol = 'DT';

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function (p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.nav-link').forEach(function (l) {
    l.classList.remove('active');
    if (l.getAttribute('data-page') === pageId) {
      l.classList.add('active');
    }
  });
  var page = document.getElementById(pageId + '-page');
  if (page) {
    page.classList.add('active');
  }
}

function setCafeName(name) {
  var el = document.getElementById('cafeName');
  if (el) el.textContent = name || 'John Coffee';
}

function formatPrice(value) {
  return (value != null ? Number(value) : 0).toFixed(2).replace('.', ',') + ' ' + currencySymbol;
}

function showConfirm(title, message, onConfirm) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  var modal = document.getElementById('confirmModal');
  modal.classList.add('active');
  var ok = document.getElementById('confirmModalOk');
  ok.onclick = function () {
    modal.classList.remove('active');
    if (onConfirm) onConfirm();
  };
}

function hideConfirm() {
  document.getElementById('confirmModal').classList.remove('active');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Gestionnaires d'événements pour les modales
document.getElementById('confirmModalCancel').onclick = hideConfirm;

document.querySelectorAll('.close-modal').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var modalId = this.getAttribute('data-modal');
    if (modalId) {
      closeModal(modalId);
    }
  });
});

// Export du module principal
window.UI = {
  showPage: showPage,
  setCafeName: setCafeName,
  formatPrice: formatPrice,
  showConfirm: showConfirm,
  openModal: openModal,
  closeModal: closeModal,

  // Délégation aux modules spécialisés
  renderTables: function () { return UITables.renderTables(); },
  renderMenu: function () { return UIMenu.renderMenu(); },
  renderHistory: function () { return UIHistory.renderHistory(); },
  renderHistoryFilters: function () { return UIHistory.renderHistoryFilters(); },
  openOrderForTable: function (tableId, tableName) { return UIOrders.openOrderForTable(tableId, tableName); },
  showOrderPage: function (tableName) { return UIOrders.showOrderPage(tableName); },
  renderOrderItems: function () { return UIOrders.renderOrderItems(); },
  renderOrderProducts: function () { return UIOrders.renderOrderProducts(); },
  showOrderDetail: function (orderId) { return UIHistory.showOrderDetail(orderId); },

  // Propriétés
  get currentOrderId() { return currentOrderId; },
  set currentOrderId(value) { currentOrderId = value; },
  get currentTableId() { return currentTableId; },
  set currentTableId(value) { currentTableId = value; },
  get currencySymbol() { return currencySymbol; },
  set currencySymbol(value) { currencySymbol = value; }
};

function renderDashboard() {
  Dashboard.getStats().then(function (stats) {
    var html = '';

    var isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';

    // Everyone sees these core operational stats
    html += '<div class="stat-card status-free" style="cursor: pointer;" onclick="window.setTableFilter(\'free\');"><span class="stat-label">Tables libres</span><div class="stat-value">' + stats.tablesFree + '</div></div>';
    html += '<div class="stat-card status-occupied" style="cursor: pointer;" onclick="window.setTableFilter(\'occupied\');"><span class="stat-label">Tables occupées</span><div class="stat-value">' + stats.tablesOccupied + '</div></div>';
    html += '<div class="stat-card"><span class="stat-label">Commandes en attente</span><div class="stat-value">' + stats.ordersPending + '</div></div>';
    html += '<div class="stat-card status-occupied highlight-revenue"><span class="stat-label">Total en cours</span><div class="stat-value">' + formatPrice(stats.pendingTotal) + '</div></div>';

    // Everyone now sees their own items and revenue, admins see totals
    const itemsLabel = isAdmin ? 'Articles vendus (Total)' : 'Articles vendus par moi';
    const revenueLabel = isAdmin ? 'Recette des ventes' : 'Mon CA du jour';

    html += '<div class="stat-card status-paid"><span class="stat-label">' + itemsLabel + '</span><div class="stat-value">' + stats.itemsSoldToday + '</div></div>';
    html += '<div class="stat-card" ' + (isAdmin ? 'style="cursor: pointer;" onclick="window.addImportedCafe()" title="Cliquez pour ajouter 1 Café importé (2,50 DT)"' : '') + '><span class="stat-label">' + revenueLabel + '</span><div class="stat-value">' + formatPrice(stats.revenueToday) + '</div></div>';

    if (isAdmin) {
      html += '<div class="stat-card"><span class="stat-label">Produit le plus vendu</span><div class="stat-value">' + (stats.bestProductToday || '-') + '</div></div>';
    }
    document.getElementById('dashboardStats').innerHTML = html;

    html = '';
    html += '<a href="#" class="btn btn-primary" data-page="tables">Tables</a>';
    html += '<a href="#" class="btn btn-primary" data-page="menu">Menu</a>';

    if (isAdmin) {
      html += '<a href="#" class="btn btn-primary" data-page="history">Historique</a>';
      html += '<a href="#" class="btn btn-primary" data-page="revenue">Recette du jour</a>';
      html += '<a href="#" class="btn btn-secondary" data-page="credits">Crédits clients</a>';
      html += '<a href="#" class="btn btn-secondary" data-page="backup">Sauvegarde</a>';
    }
    document.getElementById('dashboardQuickLinks').innerHTML = html;

    // Phase 2: Stock Alerts Widget
    if (isAdmin && window.Stock) {
      Stock.getLowStock().then(function (lowItems) {
        var alertsDiv = document.getElementById('dashboardStockAlerts');
        if (!alertsDiv) return;

        if (lowItems && lowItems.length > 0) {
          var alertHtml = '<div style="background:rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius:var(--radius); padding:1rem;">';
          alertHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">';
          alertHtml += '<h3 style="margin:0; color:#ef4444; font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">⚠️ Alertes Stock</h3>';
          alertHtml += '<a href="#" onclick="UI.showPage(\'stock\')" style="font-size:0.85rem; color:var(--accent); text-decoration:none; font-weight:600;">Gérer tout →</a>';
          alertHtml += '</div>';
          alertHtml += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:0.75rem;">';

          lowItems.forEach(function (item) {
            var status = Stock.getStatus(item);
            var statusIcon = status === 'out' ? '❌' : '⚠️';
            var statusColor = status === 'out' ? '#ef4444' : '#f59e0b';
            var statusLabel = status === 'out' ? 'Rupture' : 'Stock bas';

            alertHtml += '<div style="background:var(--bg-card); padding:0.75rem; border-radius:var(--radius-sm); border-left:4px solid ' + statusColor + '; box-shadow:var(--shadow-sm);">';
            alertHtml += '<div style="font-weight:600; font-size:0.95rem; margin-bottom:0.25rem;">' + item.name + '</div>';
            alertHtml += '<div style="display:flex; justify-content:space-between; align-items:center;">';
            alertHtml += '<span style="font-size:0.85rem; opacity:0.7;">' + item.quantity + ' ' + (item.unit || '') + '</span>';
            alertHtml += '<span style="font-size:0.75rem; font-weight:700; color:' + statusColor + ';">' + statusIcon + ' ' + statusLabel + '</span>';
            alertHtml += '</div>';
            alertHtml += '</div>';
          });

          alertHtml += '</div></div>';
          alertsDiv.innerHTML = alertHtml;
        } else {
          alertsDiv.innerHTML = ''; // Hide if no alerts
        }
      });
    }
  });
}

window.addImportedCafe = function () {
  var el = document.getElementById('addImportedCafeModal');
  if (el) el.classList.add('active');
};

// Table filter delegation to UITables module
window.setTableFilter = function (filterStr) {
  if (window.UITables && window.UITables.setTableFilter) {
    window.UITables.setTableFilter(filterStr);
  }
};

function openOrderForTable(tableId, tableName) {
  currentTableId = tableId;
  Tables.get(tableId).then(function (table) {
    if (table.activeOrderId) {
      currentOrderId = table.activeOrderId;
      // Auto-cleanup check: if the order actually has 0 items, clear and free it instantly
      Orders.getItems(currentOrderId).then(function (items) {
        if (items.length === 0) {
          Orders.clearItems(currentOrderId).then(function () {
            currentOrderId = null;
            showOrderPage(tableName);
          });
        } else {
          showOrderPage(tableName);
        }
      });
    } else {
      currentOrderId = null;
      showOrderPage(tableName);
    }
  });
}

function showOrderPage(tableName) {
  Tables.getAll().then(function (tables) {
    var title = tableName || 'Table';
    if (currentOrderId) {
      var sharingNames = tables.filter(function (t) { return t.activeOrderId === currentOrderId; })
        .map(function (t) { return t.name || t.id; });
      if (sharingNames.length > 1) {
        title = sharingNames.join(' + ');
      }
    }
    document.getElementById('orderTableTitle').textContent = 'Commande – ' + title;
  });
  document.getElementById('orderNote').value = '';
  Orders.get(currentOrderId).then(function (o) {
    if (o) {
      document.getElementById('orderNote').value = o.note || '';
      document.getElementById('paymentMethod').value = o.paymentMethod || 'cash';
    }
  });
  renderOrderItems();
  renderOrderProducts();
  showPage('order');
}

function renderOrderItems() {
  if (!currentOrderId) {
    document.getElementById('orderItemsList').innerHTML = '<li class="empty-state"><p>Aucun article. Ajoutez des produits à droite.</p></li>';
    document.getElementById('orderTotalAmount').textContent = formatPrice(0);
    return;
  }

  Promise.all([
    Orders.getItems(currentOrderId),
    Orders.getPartiallyPaidItems(currentOrderId)
  ]).then(function (results) {
    var activeItems = results[0];
    var paidItems = results[1];
    var list = document.getElementById('orderItemsList');

    if (activeItems.length === 0) {
      // The last active item was removed. The backend already freed the table.
      // We kick the user back to the dashboard/tables view smoothly.
      currentOrderId = null;
      currentTableId = null;
      showPage('tables');
      UI.renderTables();
      renderDashboard();
      return;
    }

    var html = '';

    // Render active items
    activeItems.forEach(function (item) {
      html += '<li class="order-item-row" data-item-id="' + item.id + '">';
      html += '<span class="item-name">' + item.productName + '</span>';
      html += '<div class="item-qty-controls">';
      html += '<button type="button" class="qty-minus">−</button>';
      html += '<span class="qty-value">' + item.quantity + '</span>';
      html += '<button type="button" class="qty-plus">+</button>';
      html += '</div>';
      html += '<span class="item-subtotal">' + formatPrice(item.subTotal) + '</span>';
      html += '<button type="button" class="btn-remove-item" title="Supprimer">✕</button>';
      html += '</li>';
    });

    // Render partially paid items
    if (paidItems.length > 0) {
      html += '<li style="background:transparent; border:none; padding-top:1rem; padding-bottom:0.5rem; text-align:center; position:relative;">';
      html += '<div style="position:absolute; top:50%; left:0; width:100%; border-top:1px dashed var(--border); z-index:0;"></div>';
      html += '<span style="background:var(--bg-card); padding:0 1rem; color:var(--success); font-weight:600; font-size:0.85rem; position:relative; z-index:1;"><i class="fas fa-check-circle"></i> Déjà encaissé</span>';
      html += '</li>';

      paidItems.forEach(function (item) {
        html += '<li style="padding: 0.4rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.01);">';
        html += '<span>✔️ <strong style="opacity:0.8">' + item.quantity + 'x</strong> ' + item.productName + '</span>';
        html += '<span>' + formatPrice(item.subTotal) + '</span>';
        html += '</li>';
      });
    }

    list.innerHTML = html;

    Orders.get(currentOrderId).then(function (o) {
      document.getElementById('orderTotalAmount').textContent = formatPrice(o ? o.total : 0);
    });

    // Attach click listeners ONLY to the active items' buttons
    var rows = list.querySelectorAll('.order-item-row[data-item-id]');
    rows.forEach(function (row) {
      var minusBtn = row.querySelector('.qty-minus');
      if (minusBtn) {
        minusBtn.addEventListener('click', function () {
          Orders.updateItemQty(currentOrderId, row.getAttribute('data-item-id'), -1).then(renderOrderItems);
        });
      }
      var plusBtn = row.querySelector('.qty-plus');
      if (plusBtn) {
        plusBtn.addEventListener('click', function () {
          Orders.updateItemQty(currentOrderId, row.getAttribute('data-item-id'), 1).then(renderOrderItems);
        });
      }
      var removeBtn = row.querySelector('.btn-remove-item');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          var itemName = row.querySelector('.item-name') ? row.querySelector('.item-name').textContent : '';
          Orders.removeItem(currentOrderId, row.getAttribute('data-item-id')).then(function () {
            // Notify admin if server removes an item
            if (window.getCurrentUserRole && window.getCurrentUserRole() === 'serveur') {
              var tableName = document.getElementById('orderTableTitle').textContent || '';
              Notifications.create('item_removed', 'Article supprimé : ' + itemName, tableName);
            }
            renderOrderItems();
          });
        });
      }
    });

  });
}

function renderOrderProducts() {
  var search = document.getElementById('productSearchOrder').value;
  var itemsPromise = currentOrderId ? Orders.getItems(currentOrderId) : Promise.resolve([]);

  Promise.all([Products.search(search), itemsPromise]).then(function (results) {
    var products = results[0];
    var existingItems = results[1];
    var existingIds = existingItems.map(function (i) { return i.productId.toString(); });

    var html = '';
    products.forEach(function (p) {
      if (!p.available) return;
      var isAdded = existingIds.indexOf(p.id.toString()) !== -1;

      var btnClass = isAdded ? 'product-add-btn added' : 'product-add-btn';
      var disabledAttr = isAdded ? 'disabled' : '';

      html += '<button type="button" class="' + btnClass + '" data-product-id="' + p.id + '" data-name="' + (p.name || '').replace(/"/g, '&quot;') + '" data-price="' + p.price + '" ' + disabledAttr + '>';
      html += '<div class="prod-info"><span class="prod-name">' + (p.name || '') + '</span><span class="price">' + formatPrice(p.price) + '</span></div>';

      if (isAdded) {
        html += '<div class="add-icon">✓</div>';
      } else {
        html += '<div class="add-icon">+</div>';
      }
      html += '</button>';
    });

    document.getElementById('productsListOrder').innerHTML = html || '<p class="empty-state">Aucun produit</p>';

    document.querySelectorAll('.product-add-btn:not(.added)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var productId = btn.getAttribute('data-product-id');
        var productName = btn.getAttribute('data-name');
        var productPrice = parseFloat(btn.getAttribute('data-price'));

        // Play animation
        btn.classList.add('animating-add');

        function doAddItem(orderId) {
          Orders.addItem(orderId, productId, productName, productPrice, 1).then(function () {
            renderOrderItems();
            UI.renderTables();
            renderOrderProducts(); // Refresh list to disable this button
          });
        }

        if (currentOrderId) {
          doAddItem(currentOrderId);
        } else {
          // First item added — create the order now and mark table occupied
          Orders.create(currentTableId).then(function (order) {
            currentOrderId = order.id;
            return Tables.setOccupied(currentTableId, order.id);
          }).then(function () {
            doAddItem(currentOrderId);
          });
        }
      });
    });
  });
}

function renderMenu() {
  Settings.get('categories').then(function (cats) {
    var options = '<option value="">Toutes les catégories</option>';
    (cats || '').split('\n').forEach(function (c) {
      c = c.trim();
      if (c) options += '<option value="' + c.replace(/"/g, '&quot;') + '">' + c + '</option>';
    });
    document.getElementById('menuCategoryFilter').innerHTML = options;
  });
  function doRender() {
    var search = document.getElementById('menuSearch').value.trim().toLowerCase();
    var category = document.getElementById('menuCategoryFilter').value;
    var promise = category ? Products.getByCategory(category) : Products.getAll();
    promise.then(function (products) {
      if (search) {
        products = products.filter(function (p) {
          return (p.name && p.name.toLowerCase().indexOf(search) !== -1) ||
            (p.category && p.category.toLowerCase().indexOf(search) !== -1);
        });
      }
      return products;
    }).then(function (products) {
      var html = '';
      var isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';
      products.forEach(function (p) {
        html += '<div class="menu-product-card">';
        html += '<span class="product-category">' + (p.category || '') + '</span>';
        html += '<span class="product-name">' + (p.name || '') + '</span>';
        html += '<span class="product-price">' + formatPrice(p.price) + '</span>';
        html += '<div class="product-actions">';
        if (isAdmin) {
          html += '<button type="button" class="btn btn-secondary btn-sm product-edit-btn" data-product-id="' + p.id + '">Modifier</button>';
          html += '<button type="button" class="btn btn-danger btn-sm product-delete-btn" data-product-id="' + p.id + '" data-name="' + (p.name || '').replace(/"/g, '&quot;') + '">Supprimer</button>';
        }
        html += '</div>';
        html += '</div>';
      });
      document.getElementById('menuGrid').innerHTML = html || '<p class="empty-state">Aucun produit</p>';
      document.querySelectorAll('.product-add-menu').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!currentOrderId) {
            alert('Ouvrez d\'abord une table (page Tables).');
            return;
          }
          Orders.addItem(currentOrderId, btn.getAttribute('data-product-id'), btn.getAttribute('data-name'), parseFloat(btn.getAttribute('data-price')), 1).then(function () {
            renderOrderItems();
          });
        });
      });
      document.querySelectorAll('.product-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openProductForm(btn.getAttribute('data-product-id'));
        });
      });
      document.querySelectorAll('.product-delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-name');
          var id = btn.getAttribute('data-product-id');
          showConfirm('Supprimer le produit', 'Supprimer « ' + name + ' » du menu ?', function () {
            Products.delete(id).then(function () {
              doRender();
              renderOrderProducts();
            });
          });
        });
      });
    });
  }
  document.getElementById('menuSearch').oninput = doRender;
  document.getElementById('menuCategoryFilter').onchange = doRender;
  window._menuDoRender = doRender;
  doRender();
}

function openProductForm(productId) {
  Settings.get('categories').then(function (cats) {
    var options = '';
    (cats || '').split('\n').forEach(function (c) {
      c = c.trim();
      if (c) options += '<option value="' + c.replace(/"/g, '&quot;') + '">' + c + '</option>';
    });
    document.getElementById('productFormCategory').innerHTML = options;
    if (productId) {
      document.getElementById('productFormTitle').textContent = 'Modifier le produit';
      Products.get(productId).then(function (p) {
        if (!p) return;
        document.getElementById('productFormId').value = p.id;
        document.getElementById('productFormName').value = p.name || '';
        document.getElementById('productFormCategory').value = p.category || '';
        document.getElementById('productFormPrice').value = p.price;
        document.getElementById('productFormAvailable').checked = p.available !== false;
        document.getElementById('productFormModal').classList.add('active');
      });
    } else {
      document.getElementById('productFormTitle').textContent = 'Ajouter un produit';
      document.getElementById('productFormId').value = '';
      document.getElementById('productFormName').value = '';
      document.getElementById('productFormPrice').value = '';
      document.getElementById('productFormAvailable').checked = true;
      document.getElementById('productFormModal').classList.add('active');
    }
  });
}

document.getElementById('addProductBtn').onclick = function () {
  openProductForm(null);
};

function renderTeam() {
  Users.getAll().then(function (users) {
    var html = '';
    if (users.length === 0) {
      html = '<p class="empty-state">Aucun serveur ajouté. Cliquez sur "+ Ajouter un serveur" pour commencer.</p>';
    } else {
      html = '<div class="team-cards">';
      users.forEach(function (u) {
        html += '<div class="team-card">';
        html += '<div class="team-card-avatar">👤</div>';
        html += '<div class="team-card-info">';
        html += '<div class="team-card-name">' + (u.name || 'Sans nom') + '</div>';
        html += '<div class="team-card-role">Serveur</div>';
        html += '<div class="team-card-username">Identifiant : <strong>' + (u.username || '') + '</strong></div>';
        html += '</div>';
        html += '<div class="team-card-actions">';
        html += '<button type="button" class="btn btn-secondary btn-sm team-edit-btn" data-user-id="' + u.id + '">✏️ Modifier</button>';
        html += '<button type="button" class="btn btn-danger btn-sm team-delete-btn" data-user-id="' + u.id + '" data-user-name="' + (u.name || '').replace(/"/g, '&quot;') + '">🗑 Supprimer</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    document.getElementById('teamGrid').innerHTML = html;

    // Edit buttons
    document.querySelectorAll('.team-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var userId = btn.getAttribute('data-user-id');
        Users.get(userId).then(function (user) {
          if (!user) return;
          document.getElementById('staffFormTitle').textContent = '✏️ Modifier le serveur';
          document.getElementById('staffFormId').value = user.id;
          document.getElementById('staffFormName').value = user.name || '';
          document.getElementById('staffFormUsername').value = user.username || '';
          document.getElementById('staffFormPassword').value = user.password || '';
          openModal('staffFormModal');
        });
      });
    });

    // Delete buttons
    document.querySelectorAll('.team-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var userId = btn.getAttribute('data-user-id');
        var userName = btn.getAttribute('data-user-name');
        showConfirm('Supprimer le serveur', 'Supprimer le compte de « ' + userName + ' » ?', function () {
          Users.delete(userId).then(function () {
            renderTeam();
          });
        });
      });
    });
  });
}

document.getElementById('productFormCancel').onclick = function () {
  document.getElementById('productFormModal').classList.remove('active');
};

document.getElementById('productForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var id = document.getElementById('productFormId').value;
  var product = {
    name: document.getElementById('productFormName').value.trim(),
    category: document.getElementById('productFormCategory').value,
    price: parseFloat(document.getElementById('productFormPrice').value) || 0,
    available: document.getElementById('productFormAvailable').checked
  };
  if (id) product.id = id;
  Products.save(product).then(function () {
    document.getElementById('productFormModal').classList.remove('active');
    if (window._menuDoRender) window._menuDoRender();
    renderOrderProducts();
  });
});

function renderHistory() {
  var search = document.getElementById('historySearch').value;
  var dateFrom = document.getElementById('historyDateFrom').value;
  var dateTo = document.getElementById('historyDateTo').value;
  var tableId = document.getElementById('historyTableFilter').value;
  var isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';

  History.getOrders({ search: search, dateFrom: dateFrom, dateTo: dateTo, tableId: tableId || undefined }).then(function (orders) {
    Tables.getAll().then(function (tables) {
      var tableMap = {};
      tables.forEach(function (t) { tableMap[t.id] = t.name; });
      var html = '';
      orders.forEach(function (o) {
        var date = o.paidAt ? new Date(o.paidAt) : new Date(o.createdAt);
        var dateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        // Afficher la durée d'occupation si disponible
        var occupationInfo = '';
        if (o.occupationDuration !== null && o.occupationDuration !== undefined) {
          if (o.occupationDuration < 60) {
            occupationInfo = ' · ⏱️ ' + o.occupationDuration + ' min';
          } else {
            var hours = Math.floor(o.occupationDuration / 60);
            var minutes = o.occupationDuration % 60;
            occupationInfo = ' · ⏱️ ' + hours + 'h' + (minutes > 0 ? minutes.toString().padStart(2, '0') : '');
          }
        }

        html += '<div class="history-item" data-order-id="' + o.id + '">';
        html += '<span class="order-table">' + (tableMap[o.tableId] || o.tableId) + '</span>';
        html += '<span class="order-date">' + dateStr + occupationInfo + '</span>';
        html += '<span class="order-total-badge">' + formatPrice(o.total) + '</span>';
        html += '<span>' + (Orders.PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod) + '</span>';
        if (isAdmin) {
          html += '<button type="button" class="btn btn-danger btn-sm delete-single-order-btn" title="Supprimer cette commande" data-order-id="' + o.id + '">🗑</button>';
        }
        html += '</div>';
      });
      document.getElementById('historyList').innerHTML = html || '<p class="empty-state">Aucune commande</p>';

      // Detail view
      document.querySelectorAll('.history-item').forEach(function (el) {
        el.addEventListener('click', function (e) {
          // Do not show details if clicking the delete button
          if (e.target.closest('.delete-single-order-btn')) return;
          showOrderDetail(el.getAttribute('data-order-id'));
        });
      });

      // Individual Deletion
      if (isAdmin) {
        document.querySelectorAll('.delete-single-order-btn').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var orderId = btn.getAttribute('data-order-id');
            showConfirm(
              'Supprimer la commande',
              'Voulez-vous vraiment supprimer définitivement cette commande ?',
              function () {
                Orders.getItems(orderId).then(function (items) {
                  var itemPromises = items.map(function (item) {
                    return CafeDB.remove(CafeDB.STORES.orderItems, item.id);
                  });
                  return Promise.all(itemPromises);
                }).then(function () {
                  return CafeDB.remove(CafeDB.STORES.orders, orderId);
                }).then(function () {
                  renderHistory();
                  renderDashboard(); // Update stats
                });
              }
            );
          });
        });
      }

    });
  });
}

function showOrderDetail(orderId) {
  Orders.get(orderId).then(function (order) {
    if (!order) return;
    Tables.get(order.tableId).then(function (table) {
      Orders.getItems(orderId).then(function (items) {
        var html = '<p><strong>Table :</strong> ' + (table ? table.name : order.tableId) + '</p>';
        html += '<p><strong>Date :</strong> ' + new Date(order.paidAt || order.createdAt).toLocaleString('fr-FR') + '</p>';
        html += '<p><strong>Mode de paiement :</strong> ' + (Orders.PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod) + '</p>';
        if (order.note) html += '<p><strong>Note :</strong> ' + order.note + '</p>';
        html += '<table class="revenue-table"><thead><tr><th>Produit</th><th>Qté</th><th>Total</th></tr></thead><tbody>';
        items.forEach(function (i) {
          html += '<tr><td>' + i.productName + '</td><td>' + i.quantity + '</td><td>' + formatPrice(i.subTotal) + '</td></tr>';
        });
        html += '</tbody></table>';
        html += '<p><strong>Total : ' + formatPrice(order.total) + '</strong></p>';
        document.getElementById('orderDetailContent').innerHTML = html;
        document.getElementById('orderDetailModal').classList.add('active');
      });
    });
  });
}

document.querySelector('[data-modal="orderDetailModal"]').addEventListener('click', function () {
  document.getElementById('orderDetailModal').classList.remove('active');
});

document.getElementById('orderNote').addEventListener('change', function () {
  if (currentOrderId) {
    Orders.updateNote(currentOrderId, this.value);
  }
});
document.getElementById('paymentMethod').addEventListener('change', function () {
  if (currentOrderId) {
    Orders.updatePaymentMethod(currentOrderId, this.value);
  }
});

document.getElementById('clearOrderBtn').onclick = function () {
  if (!currentOrderId) return;
  showConfirm('Vider la commande', 'Supprimer tous les articles de cette commande ?', function () {
    var tableName = document.getElementById('orderTableTitle').textContent || '';
    Orders.clearItems(currentOrderId).then(function () {
      if (window.getCurrentUserRole && window.getCurrentUserRole() === 'serveur') {
        Notifications.create('order_cleared', 'Commande vidée entièrement', tableName);
      }
      currentOrderId = null;
      currentTableId = null;
      showPage('tables');
      UI.renderTables();
      renderDashboard();
    });
  });
};

document.getElementById('payOrderBtn').onclick = function () {
  if (!currentOrderId) return;
  Orders.get(currentOrderId).then(function (o) {
    if (!o || o.total <= 0) {
      alert('Ajoutez au moins un article pour payer.');
      return;
    }
    showConfirm('Payer la commande', 'Clôturer la commande pour ' + formatPrice(o.total) + ' ?', function () {
      Orders.pay(currentOrderId).then(function () {
        currentOrderId = null;
        currentTableId = null;
        showPage('tables');
        UI.renderTables();
        renderDashboard();
        renderRevenue();
      });
    });
  });
};



document.querySelector('#partialPaymentModal .close-modal').onclick = function () {
  closeModal('partialPaymentModal');
};

document.getElementById('partialPayBtn').onclick = function () {
  if (!currentOrderId) return;
  Orders.getItems(currentOrderId).then(function (items) {
    if (items.length === 0) {
      alert('La commande est vide.');
      return;
    }

    var html = '';

    // Add Select All button
    html += '<div style="margin-bottom: 1rem; text-align: right;">';
    html += '<button type="button" class="btn btn-secondary btn-sm" id="selectAllPartialBtn">Tout sélectionner</button>';
    html += '</div>';

    html += '<div id="partialItemsContainer">';
    // Instead of grouping, display each unit individually with a checkbox
    items.forEach(function (item) {
      for (var i = 0; i < item.quantity; i++) {
        html += '<div class="partial-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid var(--border);">';
        html += '<div style="flex-grow:1;"><strong>' + item.productName + '</strong> (' + formatPrice(item.unitPrice) + ')</div>';

        html += '<div style="display:flex; align-items:center; gap:0.5rem;">';
        html += '<label style="display:flex; align-items:center; cursor:pointer; gap:0.5rem;">';
        html += '<span style="font-size:0.9rem;">Payer</span>';
        html += '<input type="checkbox" class="partial-item-checkbox" data-item-id="' + item.id + '" data-price="' + item.unitPrice + '" style="transform: scale(1.3);">';
        html += '</label>';
        html += '</div>';
        html += '</div>';
      }
    });
    html += '</div>';

    document.getElementById('partialPaymentItems').innerHTML = html;
    document.getElementById('partialPaymentTotal').textContent = formatPrice(0);

    function recalcTotal() {
      var total = 0;
      document.querySelectorAll('.partial-item-checkbox:checked').forEach(function (cb) {
        total += parseFloat(cb.getAttribute('data-price'));
      });
      document.getElementById('partialPaymentTotal').textContent = formatPrice(total);
    }

    // Live calculation listener
    document.querySelectorAll('.partial-item-checkbox').forEach(function (input) {
      input.addEventListener('change', recalcTotal);
    });

    // Select All listener
    var selectAllBtn = document.getElementById('selectAllPartialBtn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', function () {
        var checkboxes = document.querySelectorAll('.partial-item-checkbox');
        var allChecked = Array.from(checkboxes).every(function (cb) { return cb.checked; });

        checkboxes.forEach(function (cb) {
          cb.checked = !allChecked; // Toggle all
        });

        selectAllBtn.textContent = !allChecked ? 'Tout désélectionner' : 'Tout sélectionner';
        recalcTotal();
      });
    }

    UI.openModal('partialPaymentModal');
  });
};

document.getElementById('confirmPartialPaymentBtn').onclick = function () {
  if (!currentOrderId) return;

  var itemsToPayMap = {};
  var hasSelection = false;

  // Aggregate checkboxes by ID to send quantities to orders.js
  document.querySelectorAll('.partial-item-checkbox:checked').forEach(function (cb) {
    hasSelection = true;
    var itemId = cb.getAttribute('data-item-id');
    if (!itemsToPayMap[itemId]) {
      itemsToPayMap[itemId] = 0;
    }
    itemsToPayMap[itemId]++;
  });

  if (!hasSelection) {
    alert('Veuillez sélectionner au moins un article à encaisser.');
    return;
  }

  var itemsToPay = Object.keys(itemsToPayMap).map(function (id) {
    return { itemId: id, qty: itemsToPayMap[id] };
  });

  var dTotal = document.getElementById('partialPaymentTotal').textContent;
  var method = document.getElementById('partialPaymentMethod').value;

  showConfirm('Encaisser sélection', 'Confirmer l\'encaissement partiel de ' + dTotal + ' ?', function () {
    try {
      Orders.payPartial(currentOrderId, itemsToPay, method).then(function (res) {
        UI.closeModal('partialPaymentModal');
        if (res) {
          // success! Now we must check if the original order is fully paid or just partially
          Orders.get(currentOrderId).then(function (originalOrder) {
            if (originalOrder.status === Orders.ORDER_STATUS.PAID) {
              // It was entirely paid
              currentOrderId = null;
              currentTableId = null;
              showPage('tables');
            } else {
              // Still some items on table, re-render the order page
              renderOrderItems();
            }
            // Retiré "alert" ici pour éviter de bloquer l'affichage
            UI.renderTables();
            renderDashboard();
            renderRevenue();
          }).catch(function (e) {
            alert('Erreur lors de la vérification de la commande : ' + e.message);
          });
        }
      }).catch(function (e) {
        alert('Erreur lors du paiement partiel : ' + e.message);
      });
    } catch (e) {
      alert('Erreur d\'exécution fatale : ' + e.message);
    }
  });
};

document.getElementById('productSearchOrder').addEventListener('input', function () {
  renderOrderProducts();
});

function renderRevenue() {
  Revenue.getToday().then(function (data) {
    var html = '';

    // Fond de caisse
    html += '<div class="stat-card stat-card-input">';
    html += '<span class="stat-label">Fond de caisse</span>';
    html += '<div class="stat-value-input"><input type="number" id="revenueFondCaisse" min="0" step="1" value="' + data.fondDeCaisse + '"> <span class="currency">' + currencySymbol + '</span></div>';
    html += '</div>';

    // Recette des ventes
    html += '<div class="stat-card"><span class="stat-label">Recette des ventes</span><div class="stat-value">' + formatPrice(data.total) + '</div></div>';

    // Total en caisse
    var totalEnCaisse = data.fondDeCaisse + data.total;
    html += '<div class="stat-card highlight-revenue"><span class="stat-label">Total en caisse</span><div class="stat-value">' + formatPrice(totalEnCaisse) + '</div></div>';

    document.getElementById('revenueSummary').innerHTML = html;

    // Attach event listener to save the float value to Settings when changed
    var fondInput = document.getElementById('revenueFondCaisse');
    if (fondInput) {
      fondInput.addEventListener('change', function () {
        var newVal = parseFloat(this.value) || 0;
        Settings.set('fondDeCaisse', newVal).then(function () {
          renderRevenue(); // re-render to update the Total formula immediately
        });
      });
    }

    var ordersHtml = '';
    data.orders.forEach(function (o) {
      ordersHtml += '<tr><td>' + new Date(o.paidAt).toLocaleString('fr-FR') + '</td><td>' + o.id.slice(-6) + '</td><td>' + formatPrice(o.total) + '</td></tr>';
    });
    document.getElementById('revenueOrdersList').innerHTML = ordersHtml
      ? '<table class="revenue-table"><thead><tr><th>Date</th><th>N°</th><th>Total</th></tr></thead><tbody>' + ordersHtml + '</tbody></table>'
      : '<p class="empty-state">Aucune commande payée aujourd\'hui</p>';

    var catHtml = '';
    for (var cat in data.byCategory) {
      catHtml += '<tr><td>' + cat + '</td><td>' + data.byCategory[cat].quantity + '</td><td>' + formatPrice(data.byCategory[cat].total) + '</td></tr>';
    }
    document.getElementById('revenueByCategory').innerHTML = catHtml
      ? '<table class="revenue-table"><thead><tr><th>Catégorie</th><th>Qté</th><th>Total</th></tr></thead><tbody>' + catHtml + '</tbody></table>'
      : '<p class="empty-state">Aucune vente par catégorie</p>';

    document.getElementById('revenueBestProduct').innerHTML = data.bestProduct
      ? data.bestProduct.name + ' (' + data.bestProduct.quantity + ' vendus)'
      : '—';

  });
}

// === Stats Calendar Logic ===
let currentStatsYear = new Date().getFullYear();
let currentStatsMonth = new Date().getMonth();

/**
 * Affiche le calendrier des recettes sur la page Statistiques
 */
function renderStatsCalendar() {
  const calendarContainer = document.getElementById('statsCalendarContainer');
  const monthTitle = document.getElementById('statsMonthTitle');
  if (!calendarContainer || !monthTitle) return;

  Revenue.getHistoryByDay().then(function (history) {
    // Set month title
    const dateObj = new Date(currentStatsYear, currentStatsMonth, 1);
    monthTitle.textContent = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Generate calendar days header
    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    let html = '';
    daysOfWeek.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Calculate days
    const firstDayIndex = new Date(currentStatsYear, currentStatsMonth, 1).getDay(); // 0 is Sunday
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Map to Monday start
    const daysInMonth = new Date(currentStatsYear, currentStatsMonth + 1, 0).getDate();

    // Map history by date string ('YYYY-MM-DD')
    const historyByDate = {};
    history.forEach(h => {
      historyByDate[h.dateString] = h;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const currentDateObj = new Date();
    const isCurrentMonth = currentDateObj.getFullYear() === currentStatsYear && currentDateObj.getMonth() === currentStatsMonth;
    const currentDay = currentDateObj.getDate();

    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${currentStatsYear}-${String(currentStatsMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateKey === todayStr;
      const isFuture = isCurrentMonth && i > currentDay;
      const dayData = historyByDate[dateKey];

      let cellClass = 'calendar-day';
      if (isToday) cellClass += ' today';
      if (dayData) cellClass += ' has-credits'; // reusing style from credits
      if (isFuture) cellClass += ' blocked-day';

      // Inline styles similar to credits for colors
      let borderStyle = '';
      if (dayData) {
        borderStyle = 'border: 2px solid var(--primary); background: var(--status-paid-bg); cursor: pointer;';
      }

      html += `<div class="${cellClass}" data-date="${dateKey}" style="${borderStyle}">`;
      html += `<div class="day-number">${i}</div>`;
      if (dayData) {
        html += `<div class="credit-dot" style="background: var(--primary);"></div>`;

        // Show multiple sessions if they exist
        if (dayData.sessions && dayData.sessions.length > 1) {
          // Multiple sessions - show each separately
          dayData.sessions.forEach(function (session, index) {
            var sessionColor = session.sessionType === 'matin' ? '#10B981' : '#F59E0B'; // Green for morning, Orange for evening
            html += `<div style="font-size: 0.65rem; font-weight: 600; color: ${sessionColor}; margin-top: 2px;">${session.sessionTime}</div>`;
            html += `<div style="font-size: 0.7rem; font-weight: 600; color: ${sessionColor};">${formatPrice(session.total)}</div>`;
          });
        } else {
          // Single session - show total
          html += `<div style="font-size: 0.75rem; font-weight: 600; color: var(--primary); margin-top: 4px;">${formatPrice(dayData.total)}</div>`;
        }
      }
      html += `</div>`;
    }

    calendarContainer.innerHTML = html;

    // Attach click events
    calendarContainer.querySelectorAll('.calendar-day[data-date]').forEach(cell => {
      const dateKey = cell.getAttribute('data-date');
      const dayData = historyByDate[dateKey];

      if (dayData) {
        cell.addEventListener('click', function () {
          UI.showDayRevenueDetail(dateKey);
        });
      } else {
        // Optionnel : ne rien faire ou afficher "pas de recette"
        cell.addEventListener('click', function () {
          if (cell.classList.contains('blocked-day')) return;
          // on pourrait permettre d'ouvrir une modale vide mais ce n'est pas très utile
        });
      }
    });
  });
}

// Controls for Stats Calendar
document.addEventListener('DOMContentLoaded', function () {
  var statsPrevMonthBtn = document.getElementById('statsPrevMonthBtn');
  var statsNextMonthBtn = document.getElementById('statsNextMonthBtn');
  var exportDayPdfBtn = document.getElementById('exportDayPdfBtn');

  if (statsPrevMonthBtn) {
    statsPrevMonthBtn.addEventListener('click', function () {
      currentStatsMonth--;
      if (currentStatsMonth < 0) {
        currentStatsMonth = 11;
        currentStatsYear--;
      }
      renderStatsCalendar();
    });
  }

  if (statsNextMonthBtn) {
    statsNextMonthBtn.addEventListener('click', function () {
      currentStatsMonth++;
      if (currentStatsMonth > 11) {
        currentStatsMonth = 0;
        currentStatsYear++;
      }
      renderStatsCalendar();
    });
  }

  if (exportDayPdfBtn) {
    exportDayPdfBtn.addEventListener('click', function () {
      // Hide close buttons temporarily for clean PDF
      var actions = document.getElementById('clotureDetailActions');
      if (actions) actions.style.display = 'none';

      // Temporarily remove max-height to ensure html2pdf reads all rows without scroll cutoff
      var ordersContainer = document.getElementById('clotureDetailOrders');
      var productsContainer = document.getElementById('clotureDetailBestProduct');
      var oldOrdersMaxHeight = '';
      var oldProductsMaxHeight = '';

      if (ordersContainer) {
        oldOrdersMaxHeight = ordersContainer.style.maxHeight;
        ordersContainer.style.maxHeight = 'none';
        ordersContainer.style.overflow = 'visible';
      }
      if (productsContainer) {
        oldProductsMaxHeight = productsContainer.style.maxHeight;
        productsContainer.style.maxHeight = 'none';
        productsContainer.style.overflow = 'visible';
      }

      var element = document.getElementById('cloturePdfContent');
      var dateText = document.getElementById('clotureDetailDate').textContent.split(' ').join('_');
      var opt = {
        margin: [10, 10, 10, 10],
        filename: 'Recette_' + dateText + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1000 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(function () {
        if (actions) actions.style.display = 'flex';
        // restore max heights
        if (ordersContainer) {
          ordersContainer.style.maxHeight = oldOrdersMaxHeight;
          ordersContainer.style.overflow = 'auto';
        }
        if (productsContainer) {
          productsContainer.style.maxHeight = oldProductsMaxHeight;
          productsContainer.style.overflow = 'auto';
        }
      });
    });
  }
});

/**
 * Affiche le détail cumulé d'une journée calendaire passée dans la modale
 */
async function showDayRevenueDetail(dateString) {
  var history = await Revenue.getHistoryByDay();
  var dayData = history.find(function (s) { return s.dateString === dateString; });
  if (!dayData) return;

  // Création objet Date à midi pour éviter décalage fuseau horaire
  var dateParts = dateString.split('-');
  var dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);

  var dateStr = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  document.getElementById('clotureDetailDate').textContent = dateStr;

  // Check if multiple sessions exist
  var hasMultipleSessions = dayData.sessions && dayData.sessions.length > 1;

  if (hasMultipleSessions) {
    // Show sessions separately
    var sessionsHtml = '';
    var totalByCategory = {};
    var totalProductCount = {};

    dayData.sessions.forEach(function (session, index) {
      var sessionColor = session.sessionType === 'matin' ? '#10B981' : '#F59E0B';
      var sessionIcon = session.sessionType === 'matin' ? '🌅' : '🌙';

      sessionsHtml += '<div style="border: 2px solid ' + sessionColor + '; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: rgba(' + (session.sessionType === 'matin' ? '16, 185, 129' : '245, 158, 11') + ', 0.05);">';
      sessionsHtml += '<h4 style="color: ' + sessionColor + '; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">';
      sessionsHtml += sessionIcon + ' ' + session.sessionTime + '</h4>';
      sessionsHtml += '<div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">';
      sessionsHtml += '<span><strong>Recette:</strong> ' + formatPrice(session.total) + '</span>';
      sessionsHtml += '<span><strong>Commandes:</strong> ' + session.ordersCount + '</span>';
      sessionsHtml += '</div>';

      // Orders for this session
      sessionsHtml += '<div style="font-size: 0.9rem; color: var(--text-secondary);">';
      var sortedOrders = [...session.orders].sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt));
      sortedOrders.forEach(function (o) {
        var displayName = o.tableName || o.staffName || 'Commande';
        sessionsHtml += new Date(o.paidAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + displayName + ' (' + formatPrice(o.total) + ') ';
      });
      sessionsHtml += '</div>';
      sessionsHtml += '</div>';
    });

    document.getElementById('clotureDetailSummary').innerHTML = sessionsHtml;

    // Aggregate all sessions for category and product stats
    var allOrders = [];
    dayData.sessions.forEach(function (session) {
      allOrders = allOrders.concat(session.orders);
    });

  } else {
    // Single session - use existing logic
    var session = dayData.sessions ? dayData.sessions[0] : dayData;
    var allOrders = session.orders || dayData.orders || [];

    var sumHtml = '<div class="stat-card"><span class="stat-label">Recette Totale</span><div class="stat-value">' + formatPrice(dayData.total) + '</div></div>'
      + '<div class="stat-card"><span class="stat-label">Commandes</span><div class="stat-value">' + dayData.ordersCount + '</div></div>';
    document.getElementById('clotureDetailSummary').innerHTML = sumHtml;
  }

  // Calculate By Category and Best Product for all orders of the day
  var byCategory = {};
  var productCount = {};
  var [allItems, allProducts] = await Promise.all([
    CafeDB.getAll(CafeDB.STORES.orderItems),
    Products.getAll()
  ]);

  var productsMap = {};
  allProducts.forEach(function (p) { productsMap[p.id] = p; });

  var dayOrderIds = {};
  allOrders.forEach(function (o) { dayOrderIds[o.id] = true; });

  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];
    if (dayOrderIds[item.orderId]) {
      var product = productsMap[item.productId];
      var cat = product ? product.category : 'Autre';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, quantity: 0 };
      }
      byCategory[cat].total += item.subTotal;
      byCategory[cat].quantity += item.quantity;
      productCount[item.productName] = (productCount[item.productName] || 0) + item.quantity;
    }
  }

  // Sort products by quantity descending
  var sortedProducts = [];
  for (var name in productCount) {
    sortedProducts.push({ name: name, quantity: productCount[name] });
  }
  sortedProducts.sort((a, b) => b.quantity - a.quantity);

  // Orders Table - all orders of the day
  var ordersHtml = '<table class="revenue-table"><thead><tr><th>Heure</th><th>N°</th><th>Total</th></tr></thead><tbody>';
  var sortedOrders = [...allOrders].sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt));
  sortedOrders.forEach(function (o) {
    var displayName = o.tableName || o.staffName || 'Commande';
    ordersHtml += '<tr><td>' + new Date(o.paidAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</td>'
      + '<td>' + displayName + '</td><td>' + formatPrice(o.total) + '</td></tr>';
  });
  ordersHtml += '</tbody></table>';
  document.getElementById('clotureDetailOrders').innerHTML = ordersHtml;

  // Category Table
  var catHtml = '<table class="revenue-table"><thead><tr><th>Catégorie</th><th>Qté</th><th>Total</th></tr></thead><tbody>';
  for (var cat in byCategory) {
    catHtml += '<tr><td>' + cat + '</td><td>' + byCategory[cat].quantity + '</td><td>' + formatPrice(byCategory[cat].total) + '</td></tr>';
  }
  catHtml += '</tbody></table>';
  document.getElementById('clotureDetailCategories').innerHTML = catHtml;

  // All Products Sold (Sorted)
  var productsHtml = '<table class="revenue-table"><thead><tr><th>Produit</th><th>Qté</th></tr></thead><tbody>';
  if (sortedProducts.length === 0) {
    productsHtml += '<tr><td colspan="2" style="text-align: center; color: var(--text-secondary);">Aucun produit</td></tr>';
  } else {
    sortedProducts.forEach(function (p) {
      productsHtml += '<tr><td>' + p.name + '</td><td>' + p.quantity + '</td></tr>';
    });
  }
  productsHtml += '</tbody></table>';
  document.getElementById('clotureDetailBestProduct').innerHTML = productsHtml;

  openModal('clotureDetailModal');
}

document.getElementById('closeDayBtn').onclick = function () {
  showConfirm(
    'Clôturer la journée',
    'Toutes les commandes en attente seront payées et les tables libérées. Le tableau de bord sera remis à zéro. Continuer ?',
    function () {
      // Ask user if they want to export PDF before closing
      if (confirm('Voulez-vous exporter la recette du jour en PDF avant de clôturer ?')) {
        document.getElementById('exportRevenuePdfBtn').click();
      }

      Tables.getAll().then(function (tables) {
        var promises = [];
        tables.forEach(function (t) {
          if (t.status === Tables.STATUS.OCCUPIED && t.activeOrderId) {
            promises.push(
              Orders.get(t.activeOrderId).then(function (order) {
                if (order && order.status === Orders.ORDER_STATUS.PENDING) {
                  return Orders.pay(order.id);
                }
              })
            );
          }
        });
        return Promise.all(promises);
      }).then(function () {
        // Mark all today's paid orders as closed so dashboard resets to 0
        return Orders.closeDay();
      }).then(function () {
        return Settings.getAll().then(function (settings) {
          settings.fondDeCaisse = 0;
          return Settings.setAll(settings);
        });
      }).then(function () {
        currentOrderId = null;
        currentTableId = null;
        renderRevenue();
        UI.renderTables();
        renderDashboard();
        renderHistory();
        alert('Journée clôturée. Le rapport PDF a été généré, toutes les commandes ont été enregistrées en historique et les tables libérées.');
      });
    }
  );
};

function renderHistoryFilters() {
  Tables.getAll().then(function (tables) {
    var options = '<option value="">Toutes les tables</option>';
    tables.forEach(function (t) {
      options += '<option value="' + t.id + '">' + (t.name || t.id) + '</option>';
    });
    document.getElementById('historyTableFilter').innerHTML = options;
  });
}

function setupBackup() {
  document.getElementById('exportDataBtn').onclick = function () {
    Backup.exportData().then(function (data) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cafe-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };
  document.getElementById('exportRevenuePdfBtn').onclick = function () {
    Settings.get('cafeName').then(function (cafeName) {
      Revenue.getToday().then(function (data) {
        var today = new Date();
        var dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        var timeStr = today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">';
        html += '<title>Recette du jour - ' + (cafeName || 'Café') + ' - ' + today.toISOString().slice(0, 10) + '</title>';
        html += '<style>';
        html += 'body { font-family: "Inter", "Segoe UI", Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; color: #0F172A; }';
        html += '.header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-bottom: 25px; }';
        html += '.header h1 { margin: 0 0 5px; font-size: 24px; color: #0F172A; }';
        html += '.header .date { font-size: 14px; color: #64748B; }';
        html += '.summary { display: flex; justify-content: space-around; margin-bottom: 30px; }';
        html += '.summary-box { text-align: center; padding: 15px 25px; background: #EFF6FF; border-radius: 10px; border: 1px solid #BFDBFE; }';
        html += '.summary-box .label { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }';
        html += '.summary-box .value { font-size: 24px; font-weight: bold; color: #1E40AF; }';
        html += 'h2 { font-size: 16px; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-top: 25px; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }';
        html += 'th { background: #0F172A; color: white; padding: 8px 10px; text-align: left; }';
        html += 'td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; }';
        html += 'tr:nth-child(even) { background: #F8FAFC; }';
        html += '.total-row td { font-weight: bold; border-top: 2px solid #3B82F6; background: #EFF6FF; }';
        html += '.footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; }';
        html += '.best-product { background: #EFF6FF; padding: 12px 20px; border-radius: 10px; border: 1px solid #BFDBFE; text-align: center; }';
        html += '.best-product .name { font-size: 18px; font-weight: bold; color: #1E40AF; }';
        html += '@media print { body { padding: 15px; } }';
        html += '</style></head><body>';

        // Header
        html += '<div class="header">';
        html += '<h1>☕ ' + (cafeName || 'Café') + '</h1>';
        html += '<div class="date">Recette du jour — ' + dateStr + '</div>';
        html += '<div class="date">Généré à ' + timeStr + '</div>';
        html += '</div>';

        // Summary boxes
        html += '<div class="summary">';
        html += '<div class="summary-box"><div class="label">Total des ventes</div><div class="value">' + formatPrice(data.total) + '</div></div>';
        html += '<div class="summary-box"><div class="label">Commandes payées</div><div class="value">' + data.ordersCount + '</div></div>';
        html += '</div>';

        // Orders table
        if (data.orders.length > 0) {
          html += '<h2>Détail des commandes</h2>';
          html += '<table><thead><tr><th>Heure</th><th>N° Commande</th><th>Paiement</th><th style="text-align:right">Montant</th></tr></thead><tbody>';
          data.orders.forEach(function (o) {
            var time = new Date(o.paidAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            var method = Orders.PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod;
            html += '<tr><td>' + time + '</td><td>#' + o.id.slice(-6) + '</td><td>' + method + '</td><td style="text-align:right">' + formatPrice(o.total) + '</td></tr>';
          });
          html += '<tr class="total-row"><td colspan="3">TOTAL</td><td style="text-align:right">' + formatPrice(data.total) + '</td></tr>';
          html += '</tbody></table>';
        } else {
          html += '<p style="text-align:center;color:#888;">Aucune commande payée aujourd\'hui</p>';
        }

        // By category
        var catKeys = Object.keys(data.byCategory);
        if (catKeys.length > 0) {
          html += '<h2>Total par catégorie</h2>';
          html += '<table><thead><tr><th>Catégorie</th><th style="text-align:center">Qté</th><th style="text-align:right">Total</th></tr></thead><tbody>';
          catKeys.forEach(function (cat) {
            html += '<tr><td>' + cat + '</td><td style="text-align:center">' + data.byCategory[cat].quantity + '</td><td style="text-align:right">' + formatPrice(data.byCategory[cat].total) + '</td></tr>';
          });
          html += '</tbody></table>';
        }

        // Best product
        if (data.bestProduct) {
          html += '<h2>Produit le plus vendu</h2>';
          html += '<div class="best-product"><div class="name">🏆 ' + data.bestProduct.name + '</div><div>' + data.bestProduct.quantity + ' vendu(s)</div></div>';
        }

        // Footer
        html += '<div class="footer">Rapport généré automatiquement — ' + (cafeName || 'Café') + ' — ' + dateStr + '</div>';
        html += '</body></html>';

        // Utilize html2pdf structure to trigger native download on mobile
        var opt = {
          margin: 15,
          filename: 'Recette_du_jour_' + today.toISOString().slice(0, 10) + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
        };

        // Create a temporary element to hold the HTML
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Generate and download
        html2pdf().set(opt).from(tempDiv).save();
      });
    });
  };
  document.getElementById('importDataBtn').onclick = function () {
    document.getElementById('importFileInput').click();
  };
  document.getElementById('importFileInput').onchange = function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        showConfirm('Importer les données', 'Cela va remplacer toutes les données actuelles. Continuer ?', function () {
          Backup.importData(data).then(function () {
            alert('Import réussi. Rechargement…');
            window.location.reload();
          }).catch(function (e) {
            alert('Erreur : ' + (e.message || e));
          });
        });
      } catch (e) {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
    this.value = '';
  };
  document.getElementById('resetDataBtn').onclick = function () {
    showConfirm('Réinitialiser', 'Supprimer toutes les données ? Cette action est irréversible.', function () {
      Backup.reset().then(function () {
        alert('Données réinitialisées. Rechargement…');
        window.location.reload();
      });
    });
  };
}

function renderSettings() {
  Settings.getAll().then(function (s) {
    document.getElementById('settingCafeName').value = s.cafeName || '';
    document.getElementById('settingCurrency').value = s.currency || 'DT';
    document.getElementById('settingNumTables').value = s.numTables || 8;
    document.getElementById('settingCategories').value = s.categories || '';
  });
}

document.getElementById('settingsForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var num = parseInt(document.getElementById('settingNumTables').value, 10) || 8;
  Settings.setAll({
    cafeName: document.getElementById('settingCafeName').value,
    currency: document.getElementById('settingCurrency').value || 'DT',
    numTables: num,
    categories: document.getElementById('settingCategories').value
  }).then(function () {
    currencySymbol = document.getElementById('settingCurrency').value || 'DT';
    setCafeName(document.getElementById('settingCafeName').value);
    Tables.ensureDemo(num).then(function () {
      UI.renderTables();
      renderHistoryFilters();
      alert('Paramètres enregistrés.');
    });
  });
});

function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function updateNotifBadge() {
  if (!window.getCurrentUserRole || window.getCurrentUserRole() !== 'admin') return;
  Notifications.getUnreadCount().then(function (count) {
    var badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  });
}

function renderNotifications() {
  if (!window.getCurrentUserRole || window.getCurrentUserRole() !== 'admin') return;
  Notifications.getAll().then(function (notifs) {
    var list = document.getElementById('notifList');
    if (!list) return;
    if (notifs.length === 0) {
      list.innerHTML = '<div class="notif-empty">Aucune notification</div>';
      return;
    }
    var html = '';
    notifs.forEach(function (n) {
      var time = new Date(n.createdAt);
      var timeStr = time.toLocaleDateString('fr-FR') + ' ' + time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      var icon = n.type === 'order_cleared' ? '🗑' : '⚠️';
      var readClass = n.read ? 'notif-read' : 'notif-unread';
      html += '<div class="notif-item ' + readClass + '" data-notif-id="' + n.id + '">';
      html += '<div class="notif-icon">' + icon + '</div>';
      html += '<div class="notif-content">';
      html += '<div class="notif-message">' + n.message + '</div>';
      html += '<div class="notif-meta">' + n.userName + ' · ' + timeStr + '</div>';
      if (n.details) html += '<div class="notif-details">' + n.details + '</div>';
      html += '</div>';
      html += '</div>';
    });
    list.innerHTML = html;

    // Click on a notification to mark it as read
    document.querySelectorAll('.notif-item.notif-unread').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-notif-id');
        Notifications.markAsRead(id).then(function () {
          el.classList.remove('notif-unread');
          el.classList.add('notif-read');
          updateNotifBadge();
        });
      });
    });
  });
  updateNotifBadge();
}

// The notification page logic is now handled by the main navigation router.

// Mark all as read
var markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
  markAllReadBtn.addEventListener('click', function () {
    Notifications.markAllAsRead().then(function () {
      renderNotifications();
    });
  });
}

// Clear all notifications
var clearNotifsBtn = document.getElementById('clearNotifsBtn');
if (clearNotifsBtn) {
  clearNotifsBtn.addEventListener('click', function () {
    Notifications.clearAll().then(function () {
      renderNotifications();
    });
  });
}

let currentCreditYear = new Date().getFullYear();
let currentCreditMonth = new Date().getMonth();

function renderCreditsCalendar() {
  Credits.getAll().then(function (credits) {
    const calendarContainer = document.getElementById('creditsCalendarContainer');
    const monthTitle = document.getElementById('calendarMonthTitle');
    if (!calendarContainer || !monthTitle) return;

    // Set month title
    const dateObj = new Date(currentCreditYear, currentCreditMonth, 1);
    monthTitle.textContent = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Generate calendar days header
    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    let html = '';
    daysOfWeek.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Calculate days
    const firstDayIndex = new Date(currentCreditYear, currentCreditMonth, 1).getDay(); // 0 is Sunday
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Map to Monday start
    const daysInMonth = new Date(currentCreditYear, currentCreditMonth + 1, 0).getDate();

    // Map credits by date
    const creditsByDate = {};
    credits.forEach(c => {
      const d = new Date(c.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!creditsByDate[dateKey]) creditsByDate[dateKey] = [];
      creditsByDate[dateKey].push(c);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Empty prev month cells
    for (let i = 0; i < startOffset; i++) {
      html += `<div class="calendar-cell empty"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDateKey = `${currentCreditYear}-${String(currentCreditMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = cellDateKey === todayStr;

      html += `<div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${cellDateKey}">`;
      html += `<div class="calendar-date">${day}</div>`;

      if (creditsByDate[cellDateKey]) {
        html += `<div class="calendar-credits-list">`;
        const dayCredits = creditsByDate[cellDateKey];
        const displayCredits = dayCredits.slice(0, 2);

        displayCredits.forEach(c => {
          html += `
            <div class="credit-bubble" data-credit-id="${c.id}">
              <span class="credit-bubble-client">${c.clientName}</span>
              <span class="credit-bubble-amount">${formatPrice(c.amount)}</span>
            </div>
          `;
        });

        if (dayCredits.length > 2) {
          html += `<div class="credit-more-label">+ ${dayCredits.length - 2} autres</div>`;
        }

        html += `</div>`;
      }
      html += `</div>`;
    }

    calendarContainer.innerHTML = html;

    // Render Notes List below calendar
    const notesListContainer = document.getElementById('creditsNotesList');
    if (notesListContainer) {
      let notesHtml = '';
      let hasCredits = false;
      const sortedDates = Object.keys(creditsByDate)
        .filter(d => d.startsWith(`${currentCreditYear}-${String(currentCreditMonth + 1).padStart(2, '0')}`))
        .sort((a, b) => new Date(a) - new Date(b));

      sortedDates.forEach(dateKey => {
        const dayCredits = creditsByDate[dateKey];
        const dateObj = new Date(dateKey);
        // Correct date offset for display if needed
        const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        dayCredits.forEach(c => {
          hasCredits = true;
          notesHtml += `
            <div style="padding: 1rem 1.25rem; background: var(--bg-main); border-radius: var(--radius); border-left: 5px solid var(--status-occupied); display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: var(--status-occupied-bg); color: var(--status-occupied); border-radius: 50%; font-weight: bold; font-size: 1.1rem;">👤</span>
                  <strong style="color: var(--text-primary); font-size: 1.15rem; letter-spacing: -0.01em;">${c.clientName}</strong>
                </div>
                <span style="font-size: 0.85rem; color: var(--text-secondary); background: rgba(0,0,0,0.04); padding: 0.3rem 0.6rem; border-radius: var(--radius-sm); font-weight: 500;">📅 ${dateLabel}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                <div style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.5; flex: 1; padding: 0.25rem 0;">
                  ${c.note
              ? `<div style="display:flex; gap:0.5rem;"><span style="opacity:0.5;">📝 Note:</span> <span style="font-weight:500;">${c.note}</span></div>`
              : '<span style="font-style: italic; opacity: 0.5;">Aucune note spécifique</span>'}
                </div>
                <div style="color: var(--accent); font-weight: 800; font-size: 1.25rem; background: var(--status-paid-bg); padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); box-shadow: inset 0 0 0 1px var(--accent);">${formatPrice(c.amount)}</div>
              </div>
            </div>
          `;
        });
      });

      notesListContainer.innerHTML = hasCredits ? notesHtml : '<p style="color: var(--text-secondary); font-style: italic; font-size: 0.95rem; text-align: center; padding: 2rem 0;">Aucun crédit enregistré pour ce mois.</p>';
    }

    // Attach click events to day cells to open day detailed modal
    calendarContainer.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', function (e) {
        const selectedDate = this.getAttribute('data-date');
        if (typeof openDayCredits === 'function') {
          openDayCredits(selectedDate, creditsByDate[selectedDate] || []);
        } else {
          window.UI.openDayCredits(selectedDate, creditsByDate[selectedDate] || []);
        }
      });
    });
  });
}

function openDayCredits(dateStr, creditsList) {
  const displayDate = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('dayCreditsDateDisplay').textContent = displayDate;

  const listContainer = document.getElementById('dayCreditsList');
  let html = '';

  if (!creditsList || creditsList.length === 0) {
    html = '<p style="text-align:center; color: var(--text-secondary); padding: 2rem 0; font-style: italic;">Aucun crédit pour ce jour.</p>';
  } else {
    creditsList.forEach(c => {
      html += `
        <div style="background: var(--bg-main); padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--status-occupied); display: flex; flex-direction: column; gap: 0.5rem; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 1.1rem; color: var(--text-primary);">👤 ${c.clientName}</strong>
            <span style="color: var(--accent); font-weight: bold; font-size: 1.15rem;">${formatPrice(c.amount)}</span>
          </div>
          ${c.note ? `<div style="color: var(--text-secondary); font-size: 0.95rem;">📝 ${c.note}</div>` : ''}
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-danger btn-sm delete-credit-btn" data-id="${c.id}" data-client="${c.clientName}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">🗑️ Supprimer</button>
            <button type="button" class="btn btn-primary btn-sm pay-credit-btn" data-id="${c.id}" data-client="${c.clientName}" data-amount="${c.amount}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Encaisser (Payé)</button>
          </div>
        </div>
      `;
    });
  }

  listContainer.innerHTML = html;

  // Attach "Supprimer" button clicks
  listContainer.querySelectorAll('.delete-credit-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      const client = this.getAttribute('data-client');
      console.log('Delete button clicked for:', id, client);

      showConfirm('Supprimer le crédit', `Êtes-vous sûr de vouloir supprimer le crédit de ${client} ? Cette action est irréversible.`, function () {
        console.log('Confirmation accepted, deleting credit:', id);
        window.Credits.delete(id).then(function () {
          console.log('Credit deleted successfully');
          showToast('Crédit supprimé avec succès', 'success');
          closeModal('dayCreditsModal');
          if (typeof window.UI.renderCreditsCalendar === 'function') {
            window.UI.renderCreditsCalendar();
          } else if (typeof renderCreditsCalendar === 'function') {
            renderCreditsCalendar();
          }
        }).catch(function (err) {
          console.error('Erreur lors de la suppression du crédit:', err);
          showToast('Erreur lors de la suppression', 'error');
        });
      });
    });
  });

  // Attach "Encaisser (Payé)" button clicks
  listContainer.querySelectorAll('.pay-credit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      const client = this.getAttribute('data-client');
      const amount = this.getAttribute('data-amount');

      showConfirm('Encaisser le crédit', `Êtes-vous sûr de vouloir marquer ce crédit (${formatPrice(amount)}) de ${client} comme payé ? Il sera ajouté à la recette du jour.`, function () {
        if (typeof window.payCredit === 'function') {
          window.payCredit(id, client, amount);
        } else if (typeof payCredit === 'function') {
          payCredit(id, client, amount);
        } else {
          console.error('payCredit function not found!');
        }
      });
    });
  });

  // Setup Add Credit button in this modal to pre-fill the date
  const addBtn = document.getElementById('openAddCreditFromDayBtn');
  if (addBtn) {
    // Clone node to drop old event listeners
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    newBtn.addEventListener('click', function () {
      closeModal('dayCreditsModal');
      document.getElementById('creditDate').value = dateStr;

      const formDisplayDate = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      document.getElementById('creditDateDisplay').textContent = formDisplayDate;

      document.getElementById('creditClientName').value = '';
      document.getElementById('creditAmount').value = '';
      document.getElementById('creditNote').value = '';
      openModal('creditFormModal');
    });
  }

  openModal('dayCreditsModal');
}

var transferMode = 'total'; // 'total' or 'partial'
var transferItemsToMove = []; // [{itemId, qty}]

function openTransferModal() {
  if (!currentOrderId || !currentTableId) return;

  // Reset steps
  document.getElementById('transferStepMode').style.display = 'block';
  document.getElementById('transferStepItems').style.display = 'none';
  document.getElementById('transferStepTable').style.display = 'none';
  document.getElementById('transferBackBtn').style.visibility = 'hidden';

  transferMode = 'total';
  transferItemsToMove = [];

  openModal('transferTableModal');
}

document.getElementById('transferModeTotalBtn').onclick = function () {
  transferMode = 'total';
  showTransferStep('table');
};

document.getElementById('transferModePartialBtn').onclick = function () {
  transferMode = 'partial';
  renderTransferItems();
  showTransferStep('items');
};

document.getElementById('transferBackBtn').onclick = function () {
  const currentStep = getCurrentTransferStep();
  if (currentStep === 'table') {
    if (transferMode === 'total') showTransferStep('mode');
    else showTransferStep('items');
  } else if (currentStep === 'items') {
    showTransferStep('mode');
  }
};

function getCurrentTransferStep() {
  if (document.getElementById('transferStepTable').style.display === 'block') return 'table';
  if (document.getElementById('transferStepItems').style.display === 'block') return 'items';
  return 'mode';
}

function showTransferStep(step) {
  document.getElementById('transferStepMode').style.display = step === 'mode' ? 'block' : 'none';
  document.getElementById('transferStepItems').style.display = step === 'items' ? 'block' : 'none';
  document.getElementById('transferStepTable').style.display = step === 'table' ? 'block' : 'none';
  document.getElementById('transferBackBtn').style.visibility = step === 'mode' ? 'hidden' : 'visible';

  if (step === 'table') {
    renderTransferTables();
  }
}

async function renderTransferItems() {
  const items = await CafeDB.getByIndex(CafeDB.STORES.orderItems, 'orderId', currentOrderId);
  let html = '';
  if (items.length === 0) {
    html = '<p style="padding:1rem; text-align:center; opacity:0.6;">Aucun produit.</p>';
  } else {
    items.forEach(item => {
      // Show each unit as a separate row
      for (let i = 0; i < item.quantity; i++) {
        html += `
          <div class="transfer-item-unit-row" style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; border-bottom:1px solid var(--border); cursor:pointer;" onclick="toggleTransferUnit('${item.id}', ${i})">
            <div style="flex:1;">
              <div style="font-weight:600;">${item.productName}</div>
              <div style="font-size:0.8rem; opacity:0.7;">Article ${i + 1}</div>
            </div>
            <div style="margin-left:1rem;">
              <input type="checkbox" id="transfer-chk-${item.id}-${i}" data-itemid="${item.id}" class="transfer-unit-chk" style="width:18px; height:18px; cursor:pointer;" onclick="event.stopPropagation(); toggleTransferUnit('${item.id}', ${i})">
            </div>
          </div>
        `;
      }
    });
  }
  document.getElementById('transferItemsList').innerHTML = html;
  transferItemsToMove = [];
}

window.toggleTransferUnit = function (itemId, unitIndex) {
  const chk = document.getElementById(`transfer-chk-${itemId}-${unitIndex}`);
  if (event.target.type !== 'checkbox') {
    chk.checked = !chk.checked;
  }

  // Aggregate selected units for this itemId
  const allUnitChecks = document.querySelectorAll(`.transfer-unit-chk[data-itemid="${itemId}"]`);
  let selectedCount = 0;
  allUnitChecks.forEach(c => { if (c.checked) selectedCount++; });

  const idx = transferItemsToMove.findIndex(i => i.itemId === itemId);
  if (selectedCount > 0) {
    if (idx > -1) transferItemsToMove[idx].qty = selectedCount;
    else transferItemsToMove.push({ itemId, qty: selectedCount });
  } else {
    if (idx > -1) transferItemsToMove.splice(idx, 1);
  }
};

document.getElementById('confirmItemsToTransferBtn').onclick = function () {
  if (transferItemsToMove.length === 0) {
    alert('Veuillez sélectionner au moins un produit à transférer.');
    return;
  }
  showTransferStep('table');
};

async function renderTransferTables() {
  const tables = await Tables.getAll();
  const selectableTables = tables.filter(t => t.id !== currentTableId);

  let html = '';
  if (selectableTables.length === 0) {
    html = '<p style="text-align:center; padding:1rem; opacity:0.6;">Aucune autre table disponible.</p>';
  } else {
    selectableTables.forEach(t => {
      const isOccupied = t.status === Tables.STATUS.OCCUPIED;
      const statusClass = isOccupied ? 'btn-occupied' : 'btn-secondary';
      const statusLabel = isOccupied ? ' (Occupée)' : '';
      html += `<button type="button" class="btn ${statusClass} btn-sm transfer-target-btn" data-to-id="${t.id}" style="font-size:0.9rem; padding:0.8rem; display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
        <span>${t.name || t.id}</span>
        <span style="font-size:0.75rem; opacity:0.8;">${statusLabel}</span>
      </button>`;
    });
  }

  const grid = document.getElementById('transferTablesGrid');
  grid.innerHTML = html;

  grid.querySelectorAll('.transfer-target-btn').forEach(btn => {
    btn.onclick = function () {
      const toId = this.getAttribute('data-to-id');
      const toName = this.textContent;
      const confirmMsg = transferMode === 'total'
        ? `Transférer TOUTE la commande vers ${toName} ?`
        : `Transférer les produits sélectionnés vers ${toName} ?`;

      showConfirm('Confirmer le transfert', confirmMsg, async function () {
        try {
          if (transferMode === 'total') {
            await Tables.transfer(currentTableId, toId);
            currentTableId = toId;
            document.getElementById('orderTableTitle').textContent = 'Commande – ' + toName;
          } else {
            const newOrderId = await Tables.transferItems(currentTableId, toId, transferItemsToMove);
            // After partial transfer, we stay on original table but refresh its items
            // or maybe the user wants to go to the new table? Usually stay on source.
          }

          closeModal('transferTableModal');
          UI.renderTables();
          renderDashboard();
          showOrderPage(currentTableId); // Refresh items
        } catch (error) {
          alert('Erreur: ' + error.message);
        }
      });
    };
  });
}

// === Merge Tables Logic ===
var mergeSelectedTables = [];

var _mergeBtn = document.getElementById('mergeTablesBtn');
if (_mergeBtn) {
  _mergeBtn.onclick = function () {
    mergeSelectedTables = [];
    document.getElementById('mergeStepSelect').style.display = 'block';
    document.getElementById('mergeStepDest').style.display = 'none';
    document.getElementById('mergeBackBtn').style.visibility = 'hidden';
    document.getElementById('mergeNextBtn').disabled = true;
    document.getElementById('mergeNextBtn').textContent = 'Suivant →';
    renderMergeTablesGrid();
    openModal('mergeTablesModal');
  };
}

async function renderMergeTablesGrid() {
  var tables = await Tables.getAll();
  var grid = document.getElementById('mergeTablesGrid');
  if (!grid) return;

  if (tables.length < 2) {
    grid.innerHTML = '<p style="text-align:center; padding:1.5rem; opacity:0.6; grid-column: 1/-1;">Il faut au moins 2 tables pour fusionner.</p>';
    var nextBtn = document.getElementById('mergeNextBtn');
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  var html = '';
  tables.forEach(function (t) {
    var isSelected = mergeSelectedTables.indexOf(t.id) > -1;
    var icon = t.status === Tables.STATUS.FREE ? '🆓' : '🪑';
    var statusLabel = t.status === Tables.STATUS.FREE ? 'Libre' : 'Occupée';
    html += '<button type="button" class="btn merge-table-select-btn ' + (isSelected ? 'merge-selected' : '') + '" data-table-id="' + t.id + '"'
      + ' style="font-size:0.9rem; padding:0.8rem 0.5rem; display:flex; flex-direction:column; align-items:center; gap:0.3rem;'
      + ' border: 2px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)') + '; background: ' + (isSelected ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)') + '; color: var(--text-primary); border-radius: var(--radius); cursor:pointer; transition: all 0.2s;">'
      + '<span style="font-size:1.2rem;">' + icon + '</span>'
      + '<span style="font-weight:600;">' + (t.name || t.id) + '</span>'
      + '<span style="font-size:0.75rem; opacity:0.7;">' + statusLabel + '</span>'
      + '</button>';
  });
  grid.innerHTML = html;

  // Bind click events
  grid.querySelectorAll('.merge-table-select-btn').forEach(function (btn) {
    btn.onclick = function () {
      var tableId = this.getAttribute('data-table-id');
      var idx = mergeSelectedTables.indexOf(tableId);
      if (idx > -1) {
        mergeSelectedTables.splice(idx, 1);
      } else {
        mergeSelectedTables.push(tableId);
      }
      renderMergeTablesGrid();
    };
  });

  // Update info text and grouping button
  var infoEl = document.getElementById('mergeSelectionInfo');
  if (infoEl) infoEl.textContent = mergeSelectedTables.length + ' table(s) sélectionnée(s)';
  var groupBtn = document.getElementById('mergeNextBtn');
  if (groupBtn) {
    groupBtn.disabled = mergeSelectedTables.length < 2;
    groupBtn.textContent = mergeSelectedTables.length > 2 ? 'Grouper les ' + mergeSelectedTables.length + ' tables' : 'Grouper les 2 tables';
  }
}

var _mergeNextBtn = document.getElementById('mergeNextBtn');
if (_mergeNextBtn) {
  _mergeNextBtn.onclick = function () {
    if (mergeSelectedTables.length < 2) return;

    showConfirm(
      'Confirmer le groupement',
      'Voulez-vous grouper ces ' + mergeSelectedTables.length + ' tables ? Elles partageront la même commande.',
      async function () {
        try {
          await Tables.group(mergeSelectedTables);
          closeModal('mergeTablesModal');
          UI.renderTables();
          renderDashboard();
        } catch (err) {
          alert('Erreur: ' + err.message);
        }
      }
    );
  };
}


document.getElementById('openTransferModalBtn').onclick = openTransferModal;

// ==================== GESTION DU STOCK ====================

var _allStockItems = [];

function renderStock() {
  Stock.getAll().then(function (items) {
    _allStockItems = items;

    // Populate category filter
    var catSel = document.getElementById('stockCategoryFilter');
    if (catSel) {
      var cats = [''];
      items.forEach(function (i) { if (i.category && cats.indexOf(i.category) === -1) cats.push(i.category); });
      catSel.innerHTML = '<option value="">Toutes les catégories</option>' +
        cats.filter(function (c) { return c; }).map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    }

    // Also populate modal category select
    var modalCat = document.getElementById('stockItemCategory');
    if (modalCat) {
      modalCat.innerHTML = Stock.CATEGORIES.map(function (c) {
        return '<option value="' + c + '">' + c + '</option>';
      }).join('');
    }

    renderStockSummary(items);
    renderStockGrid(items);
  });
}

function renderStockSummary(items) {
  var total = items.length;
  var ok = items.filter(function (i) { return Stock.getStatus(i) === 'ok'; }).length;
  var low = items.filter(function (i) { return Stock.getStatus(i) === 'low'; }).length;
  var out = items.filter(function (i) { return Stock.getStatus(i) === 'out'; }).length;
  
  var totalValuation = items.reduce(function(sum, i) {
    return sum + ((i.quantity || 0) * (i.costPrice || 0));
  }, 0);

  var el = document.getElementById('stockSummary');
  if (!el) return;
  el.innerHTML =
    '<span style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:0.4rem 0.9rem;font-size:0.9rem;">📦 ' + total + ' articles</span>' +
    '<span style="background:var(--accent);color:#fff;border-radius:var(--radius);padding:0.4rem 0.9rem;font-size:0.9rem;font-weight:600;">💰 Valeur : ' + formatPrice(totalValuation) + '</span>' +
    (ok ? '<span style="background:#dcfce7;color:#166534;border-radius:var(--radius);padding:0.4rem 0.9rem;font-size:0.9rem;">✅ ' + ok + ' OK</span>' : '') +
    (low ? '<span style="background:#fef9c3;color:#854d0e;border-radius:var(--radius);padding:0.4rem 0.9rem;font-size:0.9rem;">⚠️ ' + low + ' Bas</span>' : '') +
    (out ? '<span style="background:#fee2e2;color:#991b1b;border-radius:var(--radius);padding:0.4rem 0.9rem;font-size:0.9rem;">❌ ' + out + ' Rupture</span>' : '');
}

function renderStockGrid(items) {
  var grid = document.getElementById('stockGrid');
  if (!grid) return;
  if (items.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;opacity:0.5;">Aucun article en stock. Cliquez sur « + Ajouter un article » pour commencer.</div>';
    return;
  }
  var html = '';
  items.forEach(function (item) {
    var status = Stock.getStatus(item);
    var badgeStyle = status === 'ok' ? 'background:#dcfce7;color:#166534;' : status === 'low' ? 'background:#fef9c3;color:#854d0e;' : 'background:#fee2e2;color:#991b1b;';
    var badgeLabel = status === 'ok' ? '✅ OK' : status === 'low' ? '⚠️ Stock bas' : '❌ Rupture';
    var updatedStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('fr-FR') : '—';
    var itemValuation = (item.quantity || 0) * (item.costPrice || 0);

    html += '<div class="product-card" style="position:relative;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">' +
      '<div>' +
      '<div style="font-weight:700;font-size:1.05rem;">' + item.name + '</div>' +
      '<div style="font-size:0.8rem;opacity:0.6;margin-top:0.2rem;">' + (item.category || '—') + '</div>' +
      '</div>' +
      '<span style="font-size:0.75rem;padding:0.3rem 0.6rem;border-radius:999px;font-weight:600;' + badgeStyle + '">' + badgeLabel + '</span>' +
      '</div>' +
      '<div style="display:flex; justify-content:space-between; align-items:baseline;">' +
      '<div style="font-size:2rem;font-weight:800;color:var(--accent);">' + (item.quantity != null ? item.quantity : '—') + ' <span style="font-size:1rem;opacity:0.7;">' + (item.unit || '') + '</span></div>' +
      (item.costPrice ? '<div style="font-size:0.9rem; font-weight:600; opacity:0.8;">Σ ' + formatPrice(itemValuation) + '</div>' : '') +
      '</div>' +
      '<div style="font-size:0.8rem;opacity:0.55;margin-bottom:0.75rem;">' + 
      (item.costPrice ? 'P.A: ' + formatPrice(item.costPrice) + ' · ' : '') + 
      'Seuil: ' + (item.minQuantity || 0) + ' ' + (item.unit || '') + ' · MàJ: ' + updatedStr + '</div>' +
      '<div style="display:flex; gap:0.4rem; margin-bottom:0.75rem;">' +
      '<button type="button" class="btn btn-secondary btn-sm" style="flex:1; padding:0.3rem;" onclick="UI.quickAddStock(\'' + item.id + '\', 1)" title="Ajouter +1">+1</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" style="flex:1; padding:0.3rem;" onclick="UI.quickAddStock(\'' + item.id + '\', 10)" title="Ajouter +10">+10</button>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem; border-top:1px solid var(--border); padding-top:0.75rem;">' +
      '<button type="button" class="btn btn-secondary btn-sm" style="flex:1;" onclick="UI.openStockModal(\'' + item.id + '\')">✏️ Modifier</button>' +
      '<button type="button" class="btn btn-danger btn-sm" onclick="UI.deleteStockItem(\'' + item.id + '\', \'' + item.name.replace(/'/g, "\\'") + '\')" style="padding:0 0.75rem;">🗑</button>' +
      '</div></div>';
  });
  grid.innerHTML = html;
}

function quickAddStock(id, qty) {
  Stock.get(id).then(function (item) {
    if (!item) return;
    item.quantity = (item.quantity || 0) + qty;
    Stock.save(item, 'Réapprovisionnement rapide (+' + qty + ')').then(function () {
      renderStock();
    });
  });
}

function exportStockExcel() {
  Stock.getAll().then(function (items) {
    if (!items || items.length === 0) {
      alert('Aucun article à exporter.');
      return;
    }

    var date = new Date().toLocaleDateString('fr-FR');
    var fileName = 'Inventaire-Stock-' + date.replace(/\//g, '-') + '.xls';

    // HTML XML Template for Excel with some basic CSS styling
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="UTF-8">\x3C!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Inventaire Stock</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--\x3E';
    html += '<style>';
    html += 'table { border-collapse: collapse; font-family: Segoe UI, sans-serif; }';
    html += 'th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 10px; font-weight: bold; text-align: left; }';
    html += 'td { border: 1px solid #d1d5db; padding: 8px; }';
    html += '.status-ok { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }';
    html += '.status-low { background-color: #fef9c3; color: #854d0e; font-weight: bold; text-align: center; }';
    html += '.status-out { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }';
    html += '.header { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #1f2937; }';
    html += '</style></head><body>';
    html += '<div class="header">📋 Inventaire Complet du Stock - ' + date + '</div>';
    html += '<table><thead><tr>';
    html += '<th>Article</th><th>Catégorie</th><th>Quantité</th><th>Unité</th><th>Seuil</th><th>Prix Achat</th><th>Valeur Totale</th><th>Statut</th>';
    html += '</tr></thead><tbody>';

    items.sort(function(a, b) {
      return (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name);
    }).forEach(function (item) {
      var status = Stock.getStatus(item);
      var statusClass = 'status-' + status;
      var statusLabel = status === 'ok' ? 'En Stock' : status === 'low' ? 'Stock Bas' : 'Rupture';
      var valuation = (item.quantity || 0) * (item.costPrice || 0);

      html += '<tr>';
      html += '<td>' + item.name + '</td>';
      html += '<td>' + (item.category || '-') + '</td>';
      html += '<td style="text-align:right;">' + (item.quantity || 0) + '</td>';
      html += '<td>' + (item.unit || '') + '</td>';
      html += '<td style="text-align:right;">' + (item.minQuantity || 0) + '</td>';
      html += '<td style="text-align:right;">' + (item.costPrice || 0).toFixed(2) + ' DT</td>';
      html += '<td style="text-align:right; font-weight:bold;">' + valuation.toFixed(2) + ' DT</td>';
      html += '<td class="' + statusClass + '">' + statusLabel + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></body></html>';

    var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

window.UI_filterStock = function () {
  var q = (document.getElementById('stockSearch') ? document.getElementById('stockSearch').value.toLowerCase() : '');
  var cat = (document.getElementById('stockCategoryFilter') ? document.getElementById('stockCategoryFilter').value : '');
  var st = (document.getElementById('stockStatusFilter') ? document.getElementById('stockStatusFilter').value : '');
  var filtered = _allStockItems.filter(function (item) {
    var matchQ = !q || item.name.toLowerCase().includes(q) || (item.category && item.category.toLowerCase().includes(q));
    var matchCat = !cat || item.category === cat;
    var matchSt = !st || Stock.getStatus(item) === st;
    return matchQ && matchCat && matchSt;
  });
  renderStockSummary(filtered);
  renderStockGrid(filtered);
};

function openStockModal(itemId) {
  var modal = document.getElementById('stockModal');
  if (!modal) return;

  document.getElementById('stockItemId').value = '';
  document.getElementById('stockItemQuantity').value = '';
  document.getElementById('stockItemUnit').value = '';
  document.getElementById('stockItemMin').value = '';
  document.getElementById('stockItemCost').value = '';

  document.getElementById('stockModalTitle').textContent = itemId ? "Modifier l'article" : 'Ajouter un article';

  // Populate categories for the reference table display
  var catSel = document.getElementById('stockItemCategory');
  if (catSel && catSel.options.length <= 1) {
    catSel.innerHTML = Stock.CATEGORIES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
  }

  // Populate dynamic select for stockItemName
  var nameSel = document.getElementById('stockItemName');
  Promise.all([
    Products.getAll(),
    Settings.get('categories')
  ]).then(function (results) {
    var products = results[0];
    var catsStr = results[1] || '';

    // Get unique categories from settings
    var cats = catsStr.split('\n').filter(function (c) { return c.trim(); }).map(function (c) { return c.trim(); });
    // Add any category from products not in settings
    if (products) {
      products.forEach(function (p) {
        if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
      });
    }
    cats.sort();

    var options = '<option value="">Sélectionner un produit...</option>';

    // Section 2: Products grouped by Category
    cats.forEach(function (catName) {
      var catProducts = products.filter(function(p) { return p.category === catName; });
      if (catProducts.length > 0) {
        options += '<optgroup label="─── ' + catName.toUpperCase() + ' ───">';
        catProducts.sort(function(a, b) { return a.name.localeCompare(b.name); }).forEach(function(p) {
          options += '<option value="' + p.name + '">' + p.name + '</option>';
        });
        options += '</optgroup>';
      }
    });

    // Products without category
    var noCatProducts = products.filter(function(p) { return !p.category; });
    if (noCatProducts.length > 0) {
      options += '<optgroup label="─── SANS CATÉGORIE ───">';
      noCatProducts.sort(function(a, b) { return a.name.localeCompare(b.name); }).forEach(function(p) {
        options += '<option value="' + p.name + '">' + p.name + '</option>';
      });
      options += '</optgroup>';
    }

    nameSel.innerHTML = options;

    // Load data if editing
    if (itemId) {
      Stock.get(itemId).then(function (item) {
        if (!item) return;
        document.getElementById('stockItemId').value = item.id;
        document.getElementById('stockItemQuantity').value = item.quantity != null ? item.quantity : '';
        document.getElementById('stockItemUnit').value = item.unit || '';
        document.getElementById('stockItemMin').value = item.minQuantity != null ? item.minQuantity : '';
        document.getElementById('stockItemCost').value = item.costPrice != null ? item.costPrice : '';

        if (catSel) catSel.value = item.category || '';

        // Find existing value in dropdown, if not create a temporary option so it isn't lost
        var existingValue = item.name || '';
        var optionExists = Array.from(nameSel.options).some(function (opt) { return opt.value === existingValue; });
        if (!optionExists && existingValue) {
          nameSel.innerHTML += '<option value="' + existingValue + '">' + existingValue + ' (Ancien)</option>';
        }
        nameSel.value = existingValue;
      });
    }

    modal.style.display = 'flex';
  });
}

function closeStockModal() {
  var modal = document.getElementById('stockModal');
  if (modal) modal.style.display = 'none';
}

function saveStockItem() {
  var name = document.getElementById('stockItemName').value.trim();
  if (!name) { alert('Veuillez sélectionner un article ou une catégorie.'); return; }

  var qty = parseFloat(document.getElementById('stockItemQuantity').value);
  if (isNaN(qty) || qty < 0) { alert('Quantité invalide.'); return; }

  // If user selected a "[Catégorie] X", auto-fill the category property and save the name.
  var cat = document.getElementById('stockItemCategory').value;
  var matchCat = name.match(/^\[Catégorie\]\s*(.*)$/);
  if (matchCat) {
    name = matchCat[1];
    cat = matchCat[1];
  } else {
    // Maybe try to auto-detect category if it's a known product, but relying on their input is fine
  }

  var item = {
    id: document.getElementById('stockItemId').value || undefined,
    name: name,
    category: cat,
    quantity: qty,
    unit: document.getElementById('stockItemUnit').value.trim(),
    minQuantity: parseFloat(document.getElementById('stockItemMin').value) || 0,
    costPrice: parseFloat(document.getElementById('stockItemCost').value) || 0
  };

  Stock.save(item).then(function () {
    closeStockModal();
    renderStock();
  });
}

function deleteStockItem(id, name) {
  showConfirm('Supprimer l\'article', 'Supprimer « ' + name + ' » du stock ?', function () {
    Stock.delete(id).then(function () {
      renderStock();
    });
  });
}

function openStockMovementsModal() {
  var modal = document.getElementById('stockMovementsModal');
  if (modal) {
    modal.style.display = 'flex';
    renderStockMovements();
  }
}

function closeStockMovementsModal() {
  var modal = document.getElementById('stockMovementsModal');
  if (modal) modal.style.display = 'none';
}

function renderStockMovements() {
  Stock.getMovements(100).then(function (movements) {
    var html = '';
    if (!movements || movements.length === 0) {
      html = '<tr><td colspan="5" style="text-align:center; padding:2rem; opacity:0.5;">Aucun mouvement enregistré</td></tr>';
    } else {
      movements.forEach(function (m) {
        var date = new Date(m.timestamp);
        var dateStr = date.toLocaleDateString() + ' ' + date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        var color = m.type === 'in' ? '#10b981' : '#ef4444';
        var prefix = m.type === 'in' ? '+' : '-';

        html += '<tr style="border-bottom:1px solid var(--border);">';
        html += '<td style="padding:0.75rem 0.5rem; font-size:0.8rem; opacity:0.8;">' + dateStr + '</td>';
        html += '<td style="padding:0.75rem 0.5rem; font-weight:600;">' + m.itemName + '</td>';
        html += '<td style="padding:0.75rem 0.5rem; font-weight:700; color:' + color + ';">' + prefix + m.quantity + '</td>';
        html += '<td style="padding:0.75rem 0.5rem; font-style:italic; opacity:0.9;">' + (m.reason || '-') + '</td>';
        html += '<td style="padding:0.75rem 0.5rem; font-size:0.85rem;">' + (m.user || '-') + '</td>';
        html += '</tr>';
      });
    }
    document.getElementById('stockMovementsList').innerHTML = html;
  });
}

window.UI = {
  showPage: showPage,
  setCafeName: setCafeName,
  formatPrice: formatPrice,
  renderDashboard: renderDashboard,
  renderTables: renderTables,
  renderOrderItems: renderOrderItems,
  renderOrderProducts: renderOrderProducts,
  renderMenu: renderMenu,
  renderHistory: renderHistory,
  renderRevenue: renderRevenue,
  renderHistoryFilters: renderHistoryFilters,
  renderSettings: renderSettings,
  renderTeam: renderTeam,
  renderNotifications: renderNotifications,
  renderCreditsCalendar: renderCreditsCalendar,
  updateNotifBadge: updateNotifBadge,
  openOrderForTable: openOrderForTable,
  showOrderPage: showOrderPage,
  showOrderDetail: showOrderDetail,
  showConfirm: showConfirm,
  setupBackup: setupBackup,
  openModal: openModal,
  closeModal: closeModal,
  showDayRevenueDetail: showDayRevenueDetail,
  renderStatsCalendar: renderStatsCalendar,
  openDayCredits: openDayCredits,
  renderStock: renderStock,
  openStockModal: openStockModal,
  closeStockModal: closeStockModal,
  saveStockItem: saveStockItem,
  deleteStockItem: deleteStockItem,
  quickAddStock: quickAddStock,
  exportStockExcel: exportStockExcel,
  openStockMovementsModal: openStockMovementsModal,
  closeStockMovementsModal: closeStockMovementsModal,
  renderStockMovements: renderStockMovements,
  filterStock: window.UI_filterStock,
  updateOccupationTimers: updateOccupationTimers,
  startOccupationTimer: startOccupationTimer,
  stopOccupationTimer: stopOccupationTimer,
  get currentOrderId() { return currentOrderId; },
  get currentTableId() { return currentTableId; },
  get currencySymbol() { return currencySymbol; },
  set currencySymbol(v) { currencySymbol = v; }
};
