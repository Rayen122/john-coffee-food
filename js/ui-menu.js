/**
 * Module de rendu du menu
 */

function renderMenu() {
  var search = document.getElementById('menuSearch').value.toLowerCase();
  var categoryFilter = document.getElementById('menuCategoryFilter').value;

  Promise.all([
    Products.getAll(),
    window.Stock ? Stock.getAll() : Promise.resolve([])
  ]).then(function (results) {
    var products = results[0];
    var stockItems = results[1];

    var filtered = products.filter(function (p) {
      var matchesSearch = p.name.toLowerCase().includes(search);
      var matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    var html = '';
    filtered.forEach(function (product) {
      // Stock mapping: first by name, then by category
      var stockItem = stockItems.find(function (s) { return s.name.toLowerCase() === product.name.toLowerCase(); });
      if (!stockItem && product.category) {
        stockItem = stockItems.find(function (s) { return s.category && s.category.toLowerCase() === product.category.toLowerCase(); });
      }

      var stockHtml = '';
      var isOutOfStock = false;
      if (stockItem) {
        if (stockItem.quantity <= 0) {
          isOutOfStock = true;
          stockHtml = '<div style="color:#ef4444; font-size:0.8rem; font-weight:600; margin-top:0.25rem;">❌ En rupture</div>';
        } else {
          stockHtml = '<div style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.25rem;">📦 Stock: <strong>' + stockItem.quantity + '</strong></div>';
        }
      }

      var availableClass = (product.available && !isOutOfStock) ? '' : ' unavailable';
      html += '<div class="menu-product-card' + availableClass + '">';
      html += '<div class="product-category">' + (product.category || 'Général') + '</div>';
      html += '<div class="product-name">' + product.name + '</div>';
      html += '<div class="product-price">' + UI.formatPrice(product.price) + '</div>';
      html += stockHtml;
      html += '<div class="product-actions" style="margin-top: 0.5rem;">';

      var isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';
      if (isAdmin) {
        html += '<button type="button" class="btn btn-sm product-edit-btn" onclick="editProduct(\'' + product.id + '\')">✏️</button>';
        html += '<button type="button" class="btn btn-danger btn-sm product-delete-btn" onclick="deleteProduct(\'' + product.id + '\')">🗑</button>';
      }

      html += '</div>';
      html += '</div>';
    });

    document.getElementById('menuGrid').innerHTML = html || '<p class="empty-state">Aucun produit trouvé</p>';
  });
}

function renderMenuFilters() {
  Settings.get('categories').then(function (categoriesStr) {
    var categories = (categoriesStr || '').split('\n').filter(function (c) { return c.trim(); });
    var options = '<option value="">Toutes les catégories</option>';
    categories.forEach(function (cat) {
      options += '<option value="' + cat.trim() + '">' + cat.trim() + '</option>';
    });
    document.getElementById('menuCategoryFilter').innerHTML = options;
  });
}

// Fonctions globales pour les événements
window.editProduct = function (productId) {
  Products.get(productId).then(function (product) {
    if (!product) return;

    document.getElementById('productFormId').value = product.id;
    document.getElementById('productFormName').value = product.name;
    document.getElementById('productFormPrice').value = product.price;
    document.getElementById('productFormAvailable').checked = product.available;
    document.getElementById('productFormTitle').textContent = 'Modifier le produit';

    // Populate categories
    Settings.get('categories').then(function (categoriesStr) {
      var categories = (categoriesStr || '').split('\n').filter(function (c) { return c.trim(); });
      var options = '';
      categories.forEach(function (cat) {
        var selected = cat.trim() === product.category ? ' selected' : '';
        options += '<option value="' + cat.trim() + '"' + selected + '>' + cat.trim() + '</option>';
      });
      document.getElementById('productFormCategory').innerHTML = options;
      UI.openModal('productFormModal');
    });
  });
};

window.deleteProduct = function (productId) {
  Products.get(productId).then(function (product) {
    if (!product) return;
    UI.showConfirm(
      'Supprimer le produit',
      'Supprimer « ' + product.name + ' » définitivement ?',
      function () {
        Products.delete(productId).then(function () {
          renderMenu();
        });
      }
    );
  });
};

// Export du module
window.UIMenu = {
  renderMenu: renderMenu,
  renderMenuFilters: renderMenuFilters
};