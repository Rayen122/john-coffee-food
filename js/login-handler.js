/**
 * Gestionnaire de connexion
 */

function initLoginHandler() {
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorEl = document.getElementById('loginError');

    // Check admin credentials first
    if (username === Auth.AUTH_CREDENTIALS.email && password === Auth.AUTH_CREDENTIALS.password) {
      Auth.setCurrentUser('admin', 'John (Admin)');
      var token = Auth.generateToken(username, 'admin', 'John (Admin)');
      localStorage.setItem('cafe_jwt', token);
      errorEl.textContent = '';
      Auth.showApp();
      return;
    }

    // Check Firestore users (serveurs)
    CafeDB.open().then(function () {
      return Users.findByUsername(username);
    }).then(function (user) {
      if (user && user.password === password) {
        Auth.setCurrentUser(user.role || 'serveur', user.name || username);
        var token = Auth.generateToken(username, user.role || 'serveur', user.name || username);
        localStorage.setItem('cafe_jwt', token);
        errorEl.textContent = '';
        Auth.showApp();
      } else {
        errorEl.textContent = 'Identifiant ou mot de passe incorrect.';
        document.getElementById('loginPassword').value = '';
      }
    }).catch(function () {
      errorEl.textContent = 'Identifiant ou mot de passe incorrect.';
      document.getElementById('loginPassword').value = '';
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      Auth.logout();
    }
  });
}

window.LoginHandler = {
  init: initLoginHandler
};
