/**
 * Gestionnaires d'événements pour les crédits clients
 */

function initCreditsHandlers() {
  // Credit form submit
  var creditForm = document.getElementById('creditForm');
  if (creditForm) {
    creditForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var clientName = document.getElementById('creditClientName').value.trim();
      var amount = document.getElementById('creditAmount').value;
      var date = document.getElementById('creditDate').value;
      var note = document.getElementById('creditNote').value.trim();

      if (!clientName || !amount || !date) return;

      Credits.add(clientName, amount, date, note).then(function () {
        UI.closeModal('creditFormModal');
        creditForm.reset();
        UI.renderCreditsCalendar();
      }).catch(function (err) {
        console.error(err);
        alert('Erreur lors de l\'ajout du crédit: ' + err);
      });
    });
  }

  // Calendar navigation
  var prevMonthBtn = document.getElementById('prevMonthBtn');
  var nextMonthBtn = document.getElementById('nextMonthBtn');
  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', function () {
      if (typeof currentCreditMonth !== 'undefined') {
        currentCreditMonth--;
        if (currentCreditMonth < 0) {
          currentCreditMonth = 11;
          currentCreditYear--;
        }
        UI.renderCreditsCalendar();
      }
    });

    nextMonthBtn.addEventListener('click', function () {
      if (typeof currentCreditMonth !== 'undefined') {
        currentCreditMonth++;
        if (currentCreditMonth > 11) {
          currentCreditMonth = 0;
          currentCreditYear++;
        }
        UI.renderCreditsCalendar();
      }
    });
  }
}

// Global function for paying credits
window.payCredit = function (id, client, amount) {
  Orders.create('direct_sale').then(function (order) {
    return Orders.addItem(order.id, 'credit_payment', 'Paiement crédit : ' + client, parseFloat(amount), 1).then(function () {
      return Orders.pay(order.id, 'cash', parseFloat(amount));
    });
  }).then(function () {
    return Credits.delete(id);
  }).then(function () {
    UI.closeModal('dayCreditsModal');
    UI.renderCreditsCalendar();
    console.log('Crédit de ' + client + ' remboursé et ajouté à la recette avec succès.');
  }).catch(function (err) {
    console.error(err);
    alert('Erreur lors du paiement du crédit : ' + err.message);
  });
};

window.CreditsHandlers = {
  init: initCreditsHandlers
};
