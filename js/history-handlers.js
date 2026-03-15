/**
 * Gestionnaires d'événements pour l'historique
 */

function initHistoryHandlers() {
  // Clear history button
  document.getElementById('clearHistoryBtn').onclick = function () {
    UI.showConfirm(
      'Supprimer l\'historique',
      'Toutes les commandes payées seront supprimées définitivement. Cette action est irréversible. Continuer ?',
      function () {
        Orders.getAll().then(function (orders) {
          var paidOrders = orders.filter(function (o) { return o.status === Orders.ORDER_STATUS.PAID; });
          var promises = [];
          paidOrders.forEach(function (o) {
            promises.push(
              Orders.getItems(o.id).then(function (items) {
                var itemPromises = items.map(function (item) {
                  return CafeDB.remove(CafeDB.STORES.orderItems, item.id);
                });
                return Promise.all(itemPromises);
              }).then(function () {
                return CafeDB.remove(CafeDB.STORES.orders, o.id);
              })
            );
          });
          return Promise.all(promises);
        }).then(function () {
          UI.renderHistory();
          UI.renderDashboard();
          alert('Historique supprimé avec succès.');
        });
      }
    );
  };

  // History filter button
  document.getElementById('historyFilterBtn').onclick = function () {
    UI.renderHistory();
  };
}

window.HistoryHandlers = {
  init: initHistoryHandlers
};
