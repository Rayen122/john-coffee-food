/**
 * Tableau de bord - statistiques et accès rapides
 */

async function getDashboardStats() {
  const tables = await Tables.getAll();
  const pendingCount = await Orders.getPendingCount();
  const pendingTotal = await Orders.getPendingTotal();
  const allPaidToday = await Orders.getPaidToday();

  const isAdmin = window.getCurrentUserRole && window.getCurrentUserRole() === 'admin';
  const currentName = window.getCurrentUserName ? window.getCurrentUserName() : '';

  // Filter paid orders by account if not admin
  const paidToday = allPaidToday.filter(o => isAdmin || o.waiterName === currentName);

  const revenueToday = paidToday.reduce((sum, o) => sum + o.total, 0);
  const freeCount = tables.filter(t => t.status === Tables.STATUS.FREE).length;
  const occupiedCount = tables.filter(t => t.status === Tables.STATUS.OCCUPIED).length;

  const productCount = {};

  if (paidToday.length > 0) {
    const allItems = await CafeDB.getAll(CafeDB.STORES.orderItems);
    // Create map of paid order IDs for quick lookup
    const paidOrderIds = {};
    for (const order of paidToday) {
      paidOrderIds[order.id] = true;
    }

    // Count only items that belong to today's paid orders
    for (const item of allItems) {
      if (paidOrderIds[item.orderId]) {
        productCount[item.productName] = (productCount[item.productName] || 0) + item.quantity;
      }
    }
  }

  const bestProduct = Object.keys(productCount).length > 0
    ? Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]
    : null;

  const itemsSoldToday = Object.values(productCount).reduce((sum, val) => sum + val, 0);

  return {
    tablesFree: freeCount,
    tablesOccupied: occupiedCount,
    ordersPending: pendingCount,
    pendingTotal: pendingTotal,
    ordersPaidToday: paidToday.length,
    itemsSoldToday: itemsSoldToday,
    revenueToday: Math.round(revenueToday * 100) / 100,
    bestProductToday: bestProduct ? bestProduct[0] : null
  };
}

window.Dashboard = {
  getStats: getDashboardStats
};
