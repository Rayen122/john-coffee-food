/**
 * Gestion des tables du café
 */

const TABLE_STORE = CafeDB.STORES.tables;

const STATUS = { FREE: 'free', OCCUPIED: 'occupied', PAID: 'paid' };
const STATUS_LABELS = { free: 'Libre', occupied: 'Occupée', paid: 'Payée' };

async function getAllTables() {
  return CafeDB.getAll(TABLE_STORE);
}

async function getTable(id) {
  return CafeDB.get(TABLE_STORE, id);
}

async function saveTable(table) {
  if (!table.id) {
    table.id = CafeDB.generateId();
  }
  return CafeDB.put(TABLE_STORE, table);
}

async function createTable(name, image) {
  return saveTable({
    id: CafeDB.generateId(),
    name: name || `Table ${(await getAllTables()).length + 1}`,
    status: STATUS.FREE,
    activeOrderId: null,
    image: image || null
  });
}

async function setTableOccupied(tableId, orderId) {
  const table = await getTable(tableId);
  if (!table) return null;
  table.status = STATUS.OCCUPIED;
  table.activeOrderId = orderId;
  return saveTable(table);
}

async function setTableFree(tableId) {
  const table = await getTable(tableId);
  if (!table) return null;
  table.status = STATUS.FREE;
  table.activeOrderId = null;
  return saveTable(table);
}

async function deduplicateTables() {
  const allTables = await getAllTables();
  const nameMap = {};
  const toDelete = [];

  for (const table of allTables) {
    const name = table.name ? table.name.trim().toLowerCase() : `table ${table.id}`;
    if (!nameMap[name]) {
      nameMap[name] = [table];
    } else {
      nameMap[name].push(table);
    }
  }

  for (const name in nameMap) {
    const tablesWithSameName = nameMap[name];
    if (tablesWithSameName.length > 1) {
      // Sort: prefer occupied tables and those with active orders to map to index 0
      tablesWithSameName.sort((a, b) => {
        if (a.status === STATUS.OCCUPIED && b.status !== STATUS.OCCUPIED) return -1;
        if (b.status === STATUS.OCCUPIED && a.status !== STATUS.OCCUPIED) return 1;
        if (a.activeOrderId && !b.activeOrderId) return -1;
        if (b.activeOrderId && !a.activeOrderId) return 1;
        // Keep the one with the smallest/oldest ID mostly
        return a.id > b.id ? 1 : -1;
      });
      for (let i = 1; i < tablesWithSameName.length; i++) {
        toDelete.push(tablesWithSameName[i].id);
      }
    }
  }

  for (const id of toDelete) {
    await deleteTable(id);
  }
}

async function ensureDemoTables(count = 8) {
  await deduplicateTables();
  const existing = await getAllTables();
  if (existing.length >= count) return existing;
  for (let i = existing.length; i < count; i++) {
    const nextNum = i + 1;
    // Vérifier avant de créer si le nom existe déjà
    const nameExists = existing.some(t => t.name.trim().toLowerCase() === `table ${nextNum}`);
    if (!nameExists) {
      await createTable(`Table ${nextNum}`);
    }
  }
  return getAllTables();
}

async function deleteTable(tableId) {
  return CafeDB.remove(TABLE_STORE, tableId);
}

async function transferTable(fromTableId, toTableId) {
  const fromTable = await getTable(fromTableId);
  const toTable = await getTable(toTableId);

  if (!fromTable || !toTable) throw new Error('Table introuvable');
  const sourceOrderId = fromTable.activeOrderId;
  if (!sourceOrderId) throw new Error('Aucune commande active sur la table source');

  if (toTable.activeOrderId) {
    // Merge entire source order into existing target order
    const sourceItems = await Orders.getItems(sourceOrderId);
    const targetOrderId = toTable.activeOrderId;

    for (const item of sourceItems) {
      // Find if product exists in target
      const targetItems = await Orders.getItems(targetOrderId);
      const existingInTarget = targetItems.find(i => i.productId === item.productId);

      if (existingInTarget) {
        existingInTarget.quantity += item.quantity;
        existingInTarget.subTotal = Math.round(existingInTarget.quantity * existingInTarget.unitPrice * 100) / 100;
        await CafeDB.put(CafeDB.STORES.orderItems, existingInTarget);
      } else {
        // Move item to new order
        item.orderId = targetOrderId;
        await CafeDB.put(CafeDB.STORES.orderItems, item);
      }
    }

    // Clean up source order
    await CafeDB.remove(CafeDB.STORES.orders, sourceOrderId);

    // Update Tables
    fromTable.status = STATUS.FREE;
    fromTable.activeOrderId = null;
    await saveTable(fromTable);

    // Recalculate target total
    await Orders.recalcTotal(targetOrderId);
  } else {
    // Simple transfer to free table (current logic)
    const order = await CafeDB.get(CafeDB.STORES.orders, sourceOrderId);
    if (order) {
      order.tableId = toTableId;
      await CafeDB.put(CafeDB.STORES.orders, order);
    }

    fromTable.status = STATUS.FREE;
    fromTable.activeOrderId = null;

    toTable.status = STATUS.OCCUPIED;
    toTable.activeOrderId = sourceOrderId;

    await saveTable(fromTable);
    await saveTable(toTable);
  }

  return true;
}

async function transferItems(fromTableId, toTableId, itemsToMove) {
  const fromTable = await getTable(fromTableId);
  const toTable = await getTable(toTableId);

  if (!fromTable || !toTable) throw new Error('Table introuvable');
  const sourceOrderId = fromTable.activeOrderId;
  if (!sourceOrderId) throw new Error('Aucune commande active');

  let targetOrderId = toTable.activeOrderId;
  if (!targetOrderId) {
    // 1. Create target order if it doesn't exist
    const targetOrder = await Orders.create(toTableId);
    targetOrderId = targetOrder.id;
    await setTableOccupied(toTableId, targetOrderId);
  }

  // 2. Move items
  for (const requested of itemsToMove) {
    const item = await CafeDB.get(CafeDB.STORES.orderItems, requested.itemId);
    if (!item || item.orderId !== sourceOrderId) continue;

    const qtyToMove = Math.min(requested.qty, item.quantity);
    if (qtyToMove <= 0) continue;

    // Try to find if the same product already exists in the target order
    const targetItems = await Orders.getItems(targetOrderId);
    const existingInTarget = targetItems.find(i => i.productId === item.productId);

    if (existingInTarget) {
      // Merge into existing item
      existingInTarget.quantity += qtyToMove;
      existingInTarget.subTotal = Math.round(existingInTarget.quantity * existingInTarget.unitPrice * 100) / 100;
      await CafeDB.put(CafeDB.STORES.orderItems, existingInTarget);
    } else {
      // Create new item in target order
      const newItem = {
        id: CafeDB.generateId(),
        orderId: targetOrderId,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: qtyToMove,
        subTotal: Math.round(qtyToMove * item.unitPrice * 100) / 100
      };
      await CafeDB.put(CafeDB.STORES.orderItems, newItem);
    }

    // Reduce original
    item.quantity -= qtyToMove;
    if (item.quantity <= 0) {
      await CafeDB.remove(CafeDB.STORES.orderItems, item.id);
    } else {
      item.subTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      await CafeDB.put(CafeDB.STORES.orderItems, item);
    }
  }

  // 3. Recalculate totals
  if (sourceOrderId) await Orders.recalcTotal(sourceOrderId);
  if (targetOrderId) await Orders.recalcTotal(targetOrderId);

  return targetOrderId;
}

/**
 * Groupe plusieurs tables ensemble.
 * @param {string[]} tableIds - Liste des IDs des tables à grouper.
 */
async function groupTables(tableIds) {
  if (!tableIds || tableIds.length < 2) throw new Error('Sélectionnez au moins 2 tables');

  const tables = await Promise.all(tableIds.map(id => getTable(id)));

  // On cherche une commande existante à utiliser comme base (la première trouvée)
  let leaderTable = tables.find(t => t.activeOrderId) || tables[0];
  let commonOrderId = leaderTable.activeOrderId;

  if (!commonOrderId) {
    const newOrder = await Orders.create(leaderTable.id);
    commonOrderId = newOrder.id;
  }

  for (const t of tables) {
    if (t.id === leaderTable.id) {
      t.status = STATUS.OCCUPIED;
      t.activeOrderId = commonOrderId;
      await saveTable(t);
      continue;
    }

    // Si la table a une commande différente, on fusionne les articles
    if (t.activeOrderId && t.activeOrderId !== commonOrderId) {
      const sourceItems = await Orders.getItems(t.activeOrderId);
      for (const item of sourceItems) {
        const destItems = await Orders.getItems(commonOrderId);
        const existingInDest = destItems.find(i => i.productId === item.productId);

        if (existingInDest) {
          existingInDest.quantity += item.quantity;
          existingInDest.subTotal = Math.round(existingInDest.quantity * existingInDest.unitPrice * 100) / 100;
          await CafeDB.put(CafeDB.STORES.orderItems, existingInDest);
          await CafeDB.remove(CafeDB.STORES.orderItems, item.id);
        } else {
          item.orderId = commonOrderId;
          await CafeDB.put(CafeDB.STORES.orderItems, item);
        }
      }
      // Supprimer l'ancienne commande
      await CafeDB.remove(CafeDB.STORES.orders, t.activeOrderId);
    }

    // Lier la table à la commande commune
    t.status = STATUS.OCCUPIED;
    t.activeOrderId = commonOrderId;
    await saveTable(t);
  }

  await Orders.recalcTotal(commonOrderId);
  return true;
}

/**
 * Reste pour compatibilité, appelle groupTables.
 */
async function mergeTables(sourceTableId, destTableId) {
  return groupTables([destTableId, sourceTableId]);
}

/**
 * Sépare une table d'un groupe de tables fusionnées
 * en lui assignant une nouvelle commande vide.
 */
async function separateTable(tableId) {
  const table = await getTable(tableId);
  if (!table || table.status !== STATUS.OCCUPIED || !table.activeOrderId) return false;

  // Check if it's actually grouped (i.e. another table has the same activeOrderId)
  const allTables = await getAllTables();
  const sharingTables = allTables.filter(t => t.activeOrderId === table.activeOrderId && t.id !== tableId);

  if (sharingTables.length === 0) {
    throw new Error('Cette table n\'est pas groupée à une autre.');
  }

  // Create a new empty order for this table
  const newOrder = await Orders.create(tableId);
  table.activeOrderId = newOrder.id;
  await saveTable(table);
  return true;
}

window.Tables = {
  getAll: getAllTables,
  get: getTable,
  save: saveTable,
  create: createTable,
  delete: deleteTable,
  setOccupied: setTableOccupied,
  setFree: setTableFree,
  transfer: transferTable,
  transferItems: transferItems,
  merge: mergeTables,
  group: groupTables,
  separate: separateTable,
  ensureDemo: ensureDemoTables,
  STATUS,
  STATUS_LABELS
};
