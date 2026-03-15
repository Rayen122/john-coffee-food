/**
 * Initialisation de l'application
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  if (Auth.checkAuth()) {
    Auth.showApp();
  }

  // Initialize all handlers
  LoginHandler.init();
  Navigation.init();
  TableHandlers.init();
  StaffHandlers.init();
  HistoryHandlers.init();
  CreditsHandlers.init();
  ModalHandlers.init();

  // Initialize database and load data
  CafeDB.open().then(function () {
    return Settings.getAll();
  }).then(function (settings) {
    UI.setCafeName(settings.cafeName);
    UI.currencySymbol = settings.currency || 'DT';
    var numTables = parseInt(settings.numTables, 10) || 8;
    return Promise.all([
      Tables.ensureDemo(numTables),
      Products.ensureDemo()
    ]);
  }).then(function () {
    UI.renderDashboard();
    UI.renderTables();
    UI.renderMenu();
    UI.renderHistoryFilters();
    UI.renderHistory();
    UI.renderRevenue();
    UI.renderSettings();
    UI.setupBackup();
    
    var currentRole = Auth.currentUserRole();
    if (currentRole === 'admin') {
      UI.renderTeam();
    }
    
    // Hide add product button for servers
    var addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn && currentRole !== 'admin') {
      addProductBtn.style.display = 'none';
    }
  }).catch(function (err) {
    console.error(err);
    alert('Erreur au chargement : ' + (err.message || err));
  });
});
