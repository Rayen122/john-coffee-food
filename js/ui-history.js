/**
 * Module de rendu de l'historique
 */

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
        html += '<span class="order-total-badge">' + UI.formatPrice(o.total) + '</span>';
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
            UI.showConfirm(
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
                  UI.renderDashboard(); // Update stats
                });
              }
            );
          });
        });
      }

    });
  });
}

function renderHistoryFilters() {
  Tables.getAll().then(function (tables) {
    var options = '<option value="">Toutes les tables</option>';
    tables.forEach(function (t) {
      options += '<option value="' + t.id + '">' + (t.name || t.id) + '</option>';
    });
    document.getElementById('historyTableFilter').innerHTML = options;
  });
}

function showOrderDetail(orderId) {
  Orders.get(orderId).then(function (order) {
    if (!order) return;
    
    Orders.getItems(orderId).then(function (items) {
      var html = '<h4>Commande #' + order.id.slice(-6) + '</h4>';
      html += '<p><strong>Table:</strong> ' + order.tableId + '</p>';
      html += '<p><strong>Date:</strong> ' + new Date(order.createdAt).toLocaleString('fr-FR') + '</p>';
      if (order.paidAt) {
        html += '<p><strong>Payée le:</strong> ' + new Date(order.paidAt).toLocaleString('fr-FR') + '</p>';
      }
      html += '<p><strong>Mode de paiement:</strong> ' + (Orders.PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod) + '</p>';
      if (order.note) {
        html += '<p><strong>Note:</strong> ' + order.note + '</p>';
      }
      
      html += '<h5>Articles:</h5><ul>';
      items.forEach(function (item) {
        html += '<li>' + item.quantity + 'x ' + item.productName + ' - ' + UI.formatPrice(item.subTotal) + '</li>';
      });
      html += '</ul>';
      html += '<p><strong>Total:</strong> ' + UI.formatPrice(order.total) + '</p>';
      
      document.getElementById('orderDetailContent').innerHTML = html;
      UI.openModal('orderDetailModal');
    });
  });
}

// Export du module
window.UIHistory = {
  renderHistory: renderHistory,
  renderHistoryFilters: renderHistoryFilters,
  showOrderDetail: showOrderDetail
};