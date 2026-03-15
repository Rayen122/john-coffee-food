/**
 * Sauvegarde - Export / Import / Réinitialisation
 */

async function exportAllData() {
  const [tables, products, orders, orderItems, payments, settings] = await Promise.all([
    CafeDB.getAll(CafeDB.STORES.tables),
    CafeDB.getAll(CafeDB.STORES.products),
    CafeDB.getAll(CafeDB.STORES.orders),
    CafeDB.getAll(CafeDB.STORES.orderItems),
    CafeDB.getAll(CafeDB.STORES.payments),
    CafeDB.getAll(CafeDB.STORES.settings)
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
    products,
    orders,
    orderItems,
    payments,
    settings
  };
}

async function importAllData(data) {
  if (!data || !data.tables) throw new Error('Fichier invalide');
  const stores = [
    [CafeDB.STORES.tables, data.tables],
    [CafeDB.STORES.products, data.products || []],
    [CafeDB.STORES.orders, data.orders || []],
    [CafeDB.STORES.orderItems, data.orderItems || []],
    [CafeDB.STORES.payments, data.payments || []],
    [CafeDB.STORES.settings, data.settings || []]
  ];
  for (const [storeName, arr] of stores) {
    await CafeDB.clearStore(storeName);
    for (const item of arr) {
      await CafeDB.put(storeName, item);
    }
  }
}

async function resetAllData() {
  await CafeDB.clearStore(CafeDB.STORES.orderItems);
  await CafeDB.clearStore(CafeDB.STORES.payments);
  await CafeDB.clearStore(CafeDB.STORES.orders);
  await CafeDB.clearStore(CafeDB.STORES.tables);
  await CafeDB.clearStore(CafeDB.STORES.products);
  await CafeDB.clearStore(CafeDB.STORES.settings);
}

window.Backup = {
  exportData: exportAllData,
  importData: importAllData,
  reset: resetAllData
};
