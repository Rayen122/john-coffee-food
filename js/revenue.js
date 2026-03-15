/**
 * Recette du jour
 */

async function getRevenueToday() {
  // We only want paid orders that haven't been closed yet.
  // This allows the revenue page to reset to 0 ONLY after a manual day close.
  var all = await Orders.getAll();
  var orders = all.filter(function (o) {
    return o.status === Orders.ORDER_STATUS.PAID && o.paidAt && !o.closedAt;
  });
  var total = orders.reduce(function (sum, o) {
    return sum + o.total;
  }, 0);
  var byCategory = {};
  var productCount = {};

  if (orders.length > 0) {
    // Pre-fetch all needed data in parallel
    var [allItems, allProducts] = await Promise.all([
      CafeDB.getAll(CafeDB.STORES.orderItems),
      Products.getAll()
    ]);

    // Build quick lookup maps
    var productsMap = {};
    allProducts.forEach(function (p) { productsMap[p.id] = p; });

    var orderIdsMap = {};
    orders.forEach(function (o) { orderIdsMap[o.id] = true; });

    // Process only items that belong to today's paid orders
    for (var i = 0; i < allItems.length; i++) {
      var item = allItems[i];
      if (orderIdsMap[item.orderId]) {
        var product = productsMap[item.productId];
        var cat = product ? product.category : 'Autre';
        if (!byCategory[cat]) {
          byCategory[cat] = { total: 0, quantity: 0 };
        }
        byCategory[cat].total += item.subTotal;
        byCategory[cat].quantity += item.quantity;
        productCount[item.productName] = (productCount[item.productName] || 0) + item.quantity;
      }
    }
  }

  var bestEntry = null;
  var bestQty = 0;
  for (var name in productCount) {
    if (productCount[name] > bestQty) {
      bestQty = productCount[name];
      bestEntry = { name: name, quantity: bestQty };
    }
  }

  var settings = await Settings.getAll();
  var fondDeCaisse = parseFloat(settings.fondDeCaisse) || 0;

  return {
    total: Math.round(total * 100) / 100,
    fondDeCaisse: fondDeCaisse,
    ordersCount: orders.length,
    orders: orders,
    byCategory: byCategory,
    bestProduct: bestEntry
  };
}

async function getClotureHistory() {
  var all = await Orders.getAll();
  var closedOrders = all.filter(function (o) {
    return o.status === Orders.ORDER_STATUS.PAID && o.closedAt;
  });

  // Group orders by closedAt (the session key)
  var sessions = {};
  closedOrders.forEach(function (o) {
    var key = o.closedAt;
    if (!sessions[key]) {
      sessions[key] = {
        closedAt: key,
        total: 0,
        ordersCount: 0,
        orders: []
      };
    }
    sessions[key].total += o.total;
    sessions[key].ordersCount++;
    sessions[key].orders.push(o);
  });

  // Convert to array and sort by date descending
  var history = Object.values(sessions).sort(function (a, b) {
    return new Date(b.closedAt) - new Date(a.closedAt);
  });

  return history;
}

async function getHistoryByDay() {
  var all = await Orders.getAll();
  var closedOrders = all.filter(function (o) {
    return o.status === Orders.ORDER_STATUS.PAID && o.closedAt;
  });

  // Group orders by calendar day
  var sessions = {};
  closedOrders.forEach(function (o) {
    var dateObj = new Date(o.closedAt);
    // Format YYYY-MM-DD
    var dayKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');

    if (!sessions[dayKey]) {
      sessions[dayKey] = {
        dateString: dayKey, // e.g., '2023-10-25'
        total: 0,
        ordersCount: 0,
        orders: []
      };
    }
    sessions[dayKey].total += o.total;
    sessions[dayKey].ordersCount++;
    sessions[dayKey].orders.push(o);
  });

  // Convert to array and sort by date descending
  var history = Object.values(sessions).sort(function (a, b) {
    return new Date(b.dateString) - new Date(a.dateString);
  });

  return history;
}

window.Revenue = {
  getToday: getRevenueToday,
  getHistory: getClotureHistory,
  getHistoryByDay: getHistoryByDay
};
