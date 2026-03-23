/**
 * Module de rendu des commandes
 */

function openOrderForTable(tableId, tableName) {
  UI.currentTableId = tableId;
  Tables.get(tableId).then(function (table) {
    if (table.activeOrderId) {
      UI.currentOrderId = table.activeOrderId;
      // Auto-cleanup check: if the order actually has 0 items, clear and free it instantly
      Orders.getItems(UI.currentOrderId).then(function (items) {
        if (items.length === 0) {
          Orders.clearItems(UI.currentOrderId).then(function () {
            UI.currentOrderId = null;
            showOrderPage(tableName);
          });
        } else {
          showOrderPage(tableName);
        }
      });
    } else {
      // Create new order
      Orders.create(tableId).then(function (order) {
        UI.currentOrderId = order.id;
        Tables.setOccupied(tableId, order.id).then(function () {
          showOrderPage(tableName);
        });
      });
    }
  });
}

function showOrderPage(tableName) {
  document.getElementById('orderTableTitle').textContent = 'Commande – ' + (tableName || 'Table');
  UI.showPage('order');
  renderOrderItems();
  renderOrderProducts();
}

function renderOrderItems() {
  if (!UI.currentOrderId) {
    document.getElementById('orderItemsList').innerHTML = '<li style="text-align:center; padding:1rem; opacity:0.6;">Aucun article</li>';
    document.getElementById('orderTotalAmount').textContent = UI.formatPrice(0);
    return;
  }

  Orders.getItems(UI.currentOrderId).then(function (items) {
    var html = '';
    var total = 0;
    items.forEach(function (item) {
      total += item.subTotal;
      html += '<li class="order-item-row">';
      html += '<span class="item-name">' + item.productName + '</span>';
      html += '<div class="item-qty-controls">';
      html += '<button type="button" onclick="changeItemQuantity(\'' + item.id + '\', -1)">−</button>';
      html += '<span class="qty-value">' + item.quantity + '</span>';
      html += '<button type="button" onclick="changeItemQuantity(\'' + item.id + '\', 1)">+</button>';
      html += '</div>';
      html += '<span class="item-subtotal">' + UI.formatPrice(item.subTotal) + '</span>';
      html += '<button type="button" class="btn-remove-item" onclick="removeOrderItem(\'' + item.id + '\')">🗑</button>';
      html += '</li>';
    });
    document.getElementById('orderItemsList').innerHTML = html || '<li style="text-align:center; padding:1rem; opacity:0.6;">Aucun article</li>';
    document.getElementById('orderTotalAmount').textContent = UI.formatPrice(total);
  });
}

function renderOrderProducts() {
  var search = document.getElementById('productSearchOrder').value.toLowerCase();
  Promise.all([
    Products.getAll(),
    window.Stock ? Stock.getAll() : Promise.resolve([])
  ]).then(function (results) {
    var products = results[0];
    var stockItems = results[1];

    var filtered = products.filter(function (p) {
      return p.available && p.name.toLowerCase().includes(search);
    });

    var grouped = {};
    filtered.forEach(function (p) {
      var cat = p.category && p.category.trim() !== '' ? p.category.trim() : 'Général';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    var html = '';
    Object.keys(grouped).sort().forEach(function (cat) {
      html += '<div style="width:100%; margin-top:1rem; margin-bottom:0.5rem; border-bottom:1px solid var(--border); padding-bottom:0.25rem;">';
      html += '<h4 style="margin:0; color:var(--text-secondary); font-size:1rem;">' + cat + '</h4>';
      html += '</div>';

      grouped[cat].forEach(function (product) {
        // Check stock by name, then by category
        var stockItem = stockItems.find(function (s) { return s.name.toLowerCase() === product.name.toLowerCase(); });
        if (!stockItem && product.category) {
          stockItem = stockItems.find(function (s) { return s.category && s.category.toLowerCase() === product.category.toLowerCase(); });
        }
        var isOutOfStock = stockItem && stockItem.quantity <= 0;
        var stockLabel = stockItem ? (isOutOfStock ? 'Rupture' : ('Stock: ' + stockItem.quantity)) : '';
        var stockColor = isOutOfStock ? '#ef4444' : 'var(--text-secondary)';

        var onclickAttr = isOutOfStock ? '' : 'onclick="addProductToOrder(\'' + product.id + '\', \'' + product.name.replace(/'/g, "\\'") + '\', ' + product.price + ')"';
        var disabledClass = isOutOfStock ? ' opacity:0.5; cursor:not-allowed;' : '';

        html += '<button type="button" class="product-add-btn" style="' + disabledClass + '" ' + onclickAttr + '>';
        html += '<div class="prod-info">';
        html += '<div class="prod-name">' + product.name + '</div>';
        html += '<div class="price">' + UI.formatPrice(product.price);
        if (stockLabel) {
          html += '<span style="font-size:0.75rem; margin-left:0.5rem; padding:0.1rem 0.4rem; background:var(--bg-main); border-radius:4px; color:' + stockColor + ';">' + stockLabel + '</span>';
        }
        html += '</div>';
        html += '</div>';
        html += '<div class="add-icon">+</div>';
        html += '</button>';
      });
    });

    document.getElementById('productsListOrder').innerHTML = html;
  });
}

// Fonctions globales pour les événements
window.changeItemQuantity = function (itemId, delta) {
  Orders.updateItemQuantity(UI.currentOrderId, itemId, delta).then(function () {
    renderOrderItems();
    UITables.renderTables();
  });
};

window.removeOrderItem = function (itemId) {
  Orders.removeItem(UI.currentOrderId, itemId).then(function () {
    renderOrderItems();
    UITables.renderTables();
  });
};

window.addProductToOrder = function (productId, productName, productPrice) {
  if (!UI.currentOrderId) return;

  var btn = event.target.closest('.product-add-btn');
  btn.classList.add('animating-add');
  setTimeout(function () {
    btn.classList.remove('animating-add');
  }, 350);

  Orders.addItem(UI.currentOrderId, productId, productName, productPrice, 1).then(function () {
    renderOrderItems();
    UITables.renderTables();
    renderOrderProducts(); // Refresh list to disable this button
  });
};

// Export du module
window.UIOrders = {
  openOrderForTable: openOrderForTable,
  showOrderPage: showOrderPage,
  renderOrderItems: renderOrderItems,
  renderOrderProducts: renderOrderProducts
};