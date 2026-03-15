/**
 * Historique des commandes
 */

async function getHistoryOrders(filters) {
  filters = filters || {};
  let orders = await Orders.getAll();
  orders = orders.filter(function (o) {
    return o.status === Orders.ORDER_STATUS.PAID;
  });
  orders.sort(function (a, b) {
    return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt);
  });

  if (filters.tableId) {
    orders = orders.filter(function (o) {
      return o.tableId === filters.tableId;
    });
  }
  if (filters.dateFrom) {
    var from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    orders = orders.filter(function (o) {
      return new Date(o.paidAt) >= from;
    });
  }
  if (filters.dateTo) {
    var to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    orders = orders.filter(function (o) {
      return new Date(o.paidAt) <= to;
    });
  }
  if (filters.search) {
    var q = filters.search.toLowerCase();

    // Pre-fetch all needed data in parallel to avoid N+1 querying during mapping
    var allItemsPromise = CafeDB.getAll(CafeDB.STORES.orderItems);
    var allTablesPromise = Tables.getAll();

    var [allItems, allTables] = await Promise.all([allItemsPromise, allTablesPromise]);

    // Build quick lookup maps
    var tableMap = {};
    allTables.forEach(t => tableMap[t.id] = t.name || '');

    var itemsByOrderId = {};
    allItems.forEach(i => {
      if (!itemsByOrderId[i.orderId]) itemsByOrderId[i.orderId] = [];
      itemsByOrderId[i.orderId].push(i);
    });

    orders = orders.filter(function (o) {
      var items = itemsByOrderId[o.id] || [];
      var tableName = tableMap[o.tableId] || '';
      var match = o.id.toLowerCase().indexOf(q) !== -1 ||
        tableName.toLowerCase().indexOf(q) !== -1 ||
        items.some(function (i) {
          return i.productName.toLowerCase().indexOf(q) !== -1;
        });
      return match;
    });
  }
  return orders;
}

window.History = {
  getOrders: getHistoryOrders
};
