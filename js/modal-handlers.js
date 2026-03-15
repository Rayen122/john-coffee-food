/**
 * Gestionnaires génériques pour les modales
 */

function initModalHandlers() {
  // Generic modal close handlers
  document.querySelectorAll('.close-modal').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var modalId = e.target.getAttribute('data-modal');
      if (modalId) {
        UI.closeModal(modalId);
      }
    });
  });

  // Imported cafe modal
  var confirmAddImportedBtn = document.getElementById('confirmAddImportedCafeBtn');
  if (confirmAddImportedBtn) {
    confirmAddImportedBtn.onclick = function () {
      Orders.create('direct_sale').then(function (order) {
        return Orders.addItem(order.id, 'import_cafe', 'Café importé', 2.50, 1).then(function () {
          return Orders.pay(order.id);
        });
      }).then(function () {
        window.location.reload();
      }).catch(function (err) {
        console.error(err);
        alert('Erreur: ' + err);
      });
    };
  }
}

window.ModalHandlers = {
  init: initModalHandlers
};
