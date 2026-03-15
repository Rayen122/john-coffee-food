/**
 * Gestionnaire de navigation et sidebar
 */

function initNavigation() {
  // Mobile sidebar toggle
  var sidebar = document.getElementById('sidebar');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  
  function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
  }
  
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
  }
  
  hamburgerBtn.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  });

  // Sidebar navigation
  document.querySelector('.sidebar-nav').addEventListener('click', function (e) {
    var link = e.target.closest('.nav-link[data-page]');
    if (!link) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    UI.showPage(page);
    renderPageContent(page);
  });

  // Main content navigation
  document.querySelector('.main-content').addEventListener('click', function (e) {
    var link = e.target.closest('[data-page]');
    if (!link || !link.classList.contains('btn')) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    UI.showPage(page);
    renderPageContent(page);
  });

  // Back to tables button
  document.getElementById('backToTables').onclick = function (e) {
    e.preventDefault();
    UI.showPage('tables');
    UI.renderTables();
  };
}

function renderPageContent(page) {
  if (page === 'dashboard') UI.renderDashboard();
  if (page === 'tables') UI.renderTables();
  if (page === 'menu') UI.renderMenu();
  if (page === 'history') {
    UI.renderHistoryFilters();
    UI.renderHistory();
  }
  if (page === 'revenue') UI.renderRevenue();
  if (page === 'settings') UI.renderSettings();
  if (page === 'team') UI.renderTeam();
  if (page === 'notifications') UI.renderNotifications();
  if (page === 'credits') UI.renderCreditsCalendar();
  if (page === 'stats') {
    Stats.renderProductCurve();
    UI.renderStatsCalendar();
  }
}

window.Navigation = {
  init: initNavigation,
  renderPageContent: renderPageContent
};
