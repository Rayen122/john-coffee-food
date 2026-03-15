/**
 * Gestion du thème (Light/Dark Mode)
 */

(function() {
  // Récupérer le thème sauvegardé ou utiliser le thème système
  function getInitialTheme() {
    var savedTheme = localStorage.getItem('cafe_theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Détecter la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  // Appliquer le thème
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cafe_theme', theme);
  }

  // Basculer le thème
  function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  // Initialiser le thème au chargement
  var initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  // Attacher l'événement au bouton après le chargement du DOM
  document.addEventListener('DOMContentLoaded', function() {
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Écouter les changements de préférence système
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Ne changer que si l'utilisateur n'a pas de préférence sauvegardée
        if (!localStorage.getItem('cafe_theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  });

  // Exposer la fonction pour usage externe si nécessaire
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
})();
