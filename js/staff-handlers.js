/**
 * Gestionnaires d'événements pour l'équipe
 */

function initStaffHandlers() {
  // Add staff button
  document.getElementById('addStaffBtn').onclick = function () {
    document.getElementById('staffFormTitle').textContent = '👥 Ajouter un serveur';
    document.getElementById('staffFormId').value = '';
    document.getElementById('staffForm').reset();
    UI.openModal('staffFormModal');
  };

  // Cancel staff form
  document.getElementById('staffFormCancel').onclick = function () {
    UI.closeModal('staffFormModal');
  };

  // Staff form submit
  document.getElementById('staffForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('staffFormId').value;
    var name = document.getElementById('staffFormName').value.trim();
    var username = document.getElementById('staffFormUsername').value.trim();
    var password = document.getElementById('staffFormPassword').value.trim();

    if (!name || !username || !password) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    if (username === 'john') {
      alert('Cet identifiant est réservé à l\'administrateur.');
      return;
    }

    if (id) {
      // Editing existing user
      Users.get(id).then(function (user) {
        if (!user) return;
        user.name = name;
        user.username = username;
        user.password = password;
        return Users.save(user);
      }).then(function () {
        UI.closeModal('staffFormModal');
        UI.renderTeam();
      }).catch(function (err) {
        alert('Erreur : ' + (err.message || err));
      });
    } else {
      // Creating new user
      Users.create(name, username, password).then(function () {
        UI.closeModal('staffFormModal');
        UI.renderTeam();
      }).catch(function (err) {
        alert('Erreur : ' + (err.message || err));
      });
    }
  });
}

window.StaffHandlers = {
  init: initStaffHandlers
};
