/**
 * Gestion des commandes
 */

const ORDER_STORE = CafeDB.STORES.orders;
const ORDER_ITEMS_STORE = CafeDB.STORES.orderItems;
const PAYMENT_STORE = CafeDB.STORES.payments;

const ORDER_STATUS = { PENDING: 'pending', PAID: 'paid' };
const PAYMENT_METHODS = { cash: 'Espèces', card: 'Carte' };

async function getAllOrders() {
  return CafeDB.getAll(ORDER_STORE);
}

async function getOrder(id) {
  return CafeDB.get(ORDER_STORE, id);
}

async function getOrderItems(orderId) {
  return CafeDB.getByIndex(ORDER_ITEMS_STORE, 'orderId', orderId);
}

async function getOrdersByTable(tableId) {
  return CafeDB.getByIndex(ORDER_STORE, 'tableId', tableId);
}

async function getOrdersPaidToday() {
  const all = await getAllOrders();
  return all.filter(o => o.status === ORDER_STATUS.PAID && o.paidAt && !o.closedAt);
}

async function closeDayOrders() {
  const paidToday = await getOrdersPaidToday();
  const now = new Date().toISOString();
  for (const order of paidToday) {
    order.closedAt = now;
    await CafeDB.put(ORDER_STORE, order);
  }
  return paidToday.length;
}

async function createOrder(tableId) {
  const order = {
    id: CafeDB.generateId(),
    tableId,
    status: ORDER_STATUS.PENDING,
    total: 0,
    paymentMethod: 'cash',
    note: '',
    createdAt: new Date().toISOString(),
    paidAt: null,
    waiterName: window.getCurrentUserName ? window.getCurrentUserName() : 'Inconnu',
    waiterRole: window.getCurrentUserRole ? window.getCurrentUserRole() : 'serveur'
  };
  await CafeDB.put(ORDER_STORE, order);
  return order;
}

let actionQueue = Promise.resolve();

async function addItemToOrder(orderId, productId, productName, unitPrice, quantity = 1) {
  return new Promise((resolve, reject) => {
    actionQueue = actionQueue.then(async () => {
      try {
        const items = await getOrderItems(orderId);
        const existing = items.find(i => i.productId === productId);
        let item;
        if (existing) {
          existing.quantity += quantity;
          existing.subTotal = Math.round(existing.quantity * existing.unitPrice * 100) / 100;
          item = existing;
        } else {
          item = {
            id: CafeDB.generateId(),
            orderId,
            productId,
            productName,
            unitPrice,
            quantity,
            subTotal: Math.round(quantity * unitPrice * 100) / 100
          };
        }
        await CafeDB.put(ORDER_ITEMS_STORE, item);
        await recalcOrderTotal(orderId);
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function updateItemQuantity(orderId, itemId, delta) {
  return new Promise((resolve, reject) => {
    actionQueue = actionQueue.then(async () => {
      try {
        const item = await CafeDB.get(ORDER_ITEMS_STORE, itemId);
        if (!item || item.orderId !== orderId) {
          resolve(null);
          return;
        }
        item.quantity = Math.max(0, item.quantity + delta);
        if (item.quantity <= 0) {
          await CafeDB.remove(ORDER_ITEMS_STORE, itemId);
        } else {
          item.subTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
          await CafeDB.put(ORDER_ITEMS_STORE, item);
        }
        await recalcOrderTotal(orderId);
        resolve(await getOrder(orderId));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function removeItemFromOrder(orderId, itemId) {
  return new Promise((resolve, reject) => {
    actionQueue = actionQueue.then(async () => {
      try {
        await CafeDB.remove(ORDER_ITEMS_STORE, itemId);
        resolve(await recalcOrderTotal(orderId));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function recalcOrderTotal(orderId) {
  const items = await getOrderItems(orderId);
  const order = await getOrder(orderId);

  if (!order) return null;

  if (items.length === 0) {
    const paidItems = await getPartiallyPaidItems(orderId);
    if (paidItems.length > 0) {
      // There are partial payments, just close the original
      order.status = ORDER_STATUS.PAID;
      order.paidAt = new Date().toISOString();
      order.total = 0;
      await CafeDB.put(ORDER_STORE, order);
    } else {
      // Truly empty order, no history. Delete it.
      await CafeDB.remove(ORDER_STORE, orderId);
    }
    const allTables = await Tables.getAll();
    for (const t of allTables) {
      if (t.activeOrderId === order.id) {
        await Tables.setFree(t.id);
      }
    }
    return order;
  }

  const total = items.reduce((sum, i) => sum + i.subTotal, 0);
  order.total = Math.round(total * 100) / 100;
  await CafeDB.put(ORDER_STORE, order);
  return order;
}

async function updateOrderNote(orderId, note) {
  const order = await getOrder(orderId);
  if (!order) return null;
  order.note = note || '';
  return CafeDB.put(ORDER_STORE, order);
}

async function updateOrderPaymentMethod(orderId, method) {
  const order = await getOrder(orderId);
  if (!order) return null;
  order.paymentMethod = method;
  return CafeDB.put(ORDER_STORE, order);
}

async function payOrder(orderId) {
  const order = await getOrder(orderId);
  if (!order || order.status === ORDER_STATUS.PAID) return null;
  order.status = ORDER_STATUS.PAID;
  order.paidAt = new Date().toISOString();
  // Ensure the waiter who takes the payment gets the credit
  if (window.getCurrentUserName) order.waiterName = window.getCurrentUserName();
  if (window.getCurrentUserRole) order.waiterRole = window.getCurrentUserRole();
  await CafeDB.put(ORDER_STORE, order);
  await CafeDB.put(PAYMENT_STORE, {
    id: CafeDB.generateId(),
    orderId: order.id,
    amount: order.total,
    method: order.paymentMethod,
    paidAt: order.paidAt
  });
  const allTables = await Tables.getAll();
  for (const t of allTables) {
    if (t.activeOrderId === order.id) {
      await Tables.setFree(t.id);
    }
  }
  return order;
}

async function clearOrderItems(orderId) {
  const items = await getOrderItems(orderId);
  for (const item of items) {
    await CafeDB.remove(ORDER_ITEMS_STORE, item.id);
  }
  return recalcOrderTotal(orderId);
}

async function getPendingOrdersCount() {
  const allOrders = await getAllOrders();
  const allTables = await Tables.getAll();
  const activeOrderIds = allTables.filter(t => t.activeOrderId).map(t => t.activeOrderId);
  return allOrders.filter(o => o.status === ORDER_STATUS.PENDING && activeOrderIds.includes(o.id)).length;
}

async function getPendingTotal() {
  const allOrders = await getAllOrders();
  const allTables = await Tables.getAll();
  const activeOrderIds = allTables.filter(t => t.activeOrderId).map(t => t.activeOrderId);
  const pending = allOrders.filter(o => o.status === ORDER_STATUS.PENDING && activeOrderIds.includes(o.id));
  const total = pending.reduce((sum, o) => sum + (o.total || 0), 0);
  return Math.round(total * 100) / 100;
}

async function payPartial(orderId, itemsToPay, method) {
  const originalOrder = await getOrder(orderId);
  if (!originalOrder || originalOrder.status === ORDER_STATUS.PAID) return null;

  // 1. Create a "split" order that gets paid immediately
  const newOrder = {
    id: CafeDB.generateId(),
    originalOrderId: originalOrder.id, // Linking back to the main order
    tableId: originalOrder.tableId,
    status: ORDER_STATUS.PAID,
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    paymentMethod: method,
    note: 'Paiement partiel depuis ' + originalOrder.id.slice(-6),
    total: 0,
    // Add waiter info to the split order
    waiterName: window.getCurrentUserName ? window.getCurrentUserName() : (originalOrder.waiterName || 'Inconnu'),
    waiterRole: window.getCurrentUserRole ? window.getCurrentUserRole() : (originalOrder.waiterRole || 'serveur')
  };
  await CafeDB.put(ORDER_STORE, newOrder);

  let newOrderTotal = 0;

  // 2. Process each item the user wants to pay
  for (let i = 0; i < itemsToPay.length; i++) {
    const requested = itemsToPay[i];
    if (requested.qty <= 0) continue;

    let remainingQtyToPay = requested.qty;
    const itemIds = requested.itemId.split(',');

    for (const id of itemIds) {
      if (remainingQtyToPay <= 0) break;
      const item = await CafeDB.get(ORDER_ITEMS_STORE, id);
      if (!item || item.orderId !== orderId) continue;

      // We can't pay more than what's on the bill
      const qtyFromThisItem = Math.min(remainingQtyToPay, item.quantity);
      if (qtyFromThisItem <= 0) continue;

      // Create item record for the new paid order
      const newItem = {
        id: CafeDB.generateId(),
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: qtyFromThisItem,
        subTotal: Math.round(qtyFromThisItem * item.unitPrice * 100) / 100
      };
      await CafeDB.put(ORDER_ITEMS_STORE, newItem);
      newOrderTotal += newItem.subTotal;

      // Reduce original item quantity (the persons left at the table)
      item.quantity -= qtyFromThisItem;
      if (item.quantity <= 0) {
        await CafeDB.remove(ORDER_ITEMS_STORE, item.id);
      } else {
        item.subTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        await CafeDB.put(ORDER_ITEMS_STORE, item);
      }

      remainingQtyToPay -= qtyFromThisItem;
    }
  }

  // Finalize new order
  newOrder.total = Math.round(newOrderTotal * 100) / 100;
  await CafeDB.put(ORDER_STORE, newOrder);

  // Record Payment
  await CafeDB.put(PAYMENT_STORE, {
    id: CafeDB.generateId(),
    orderId: newOrder.id,
    amount: newOrder.total,
    method: newOrder.paymentMethod,
    paidAt: newOrder.paidAt
  });

  // 3. Clean up the original order
  const remainingItems = await getOrderItems(orderId);
  if (remainingItems.length === 0) {
    // Everything was paid, close original order and free table
    originalOrder.status = ORDER_STATUS.PAID;
    // We don't record another payment, it's 0 amount, just closing it.
    originalOrder.paidAt = new Date().toISOString();
    originalOrder.total = 0;
    await CafeDB.put(ORDER_STORE, originalOrder);
    const allTables = await Tables.getAll();
    for (const t of allTables) {
      if (t.activeOrderId === originalOrder.id) {
        await Tables.setFree(t.id);
      }
    }
  } else {
    await recalcOrderTotal(orderId);
  }

  return newOrder;
}

// Retrieves all items that have been partially paid for a specific active order
async function getPartiallyPaidItems(orderId) {
  const allOrders = await getAllOrders();
  // Find all PAID orders that were split from this specific order
  const linkedOrders = allOrders.filter(o => o.originalOrderId === orderId && o.status === ORDER_STATUS.PAID);

  let paidItems = [];
  for (const lo of linkedOrders) {
    const items = await CafeDB.getByIndex(ORDER_ITEMS_STORE, 'orderId', lo.id);
    paidItems = paidItems.concat(items);
  }
  return paidItems;
}

window.Orders = {
  getAll: getAllOrders,
  get: getOrder,
  getItems: getOrderItems,
  getPartiallyPaidItems: getPartiallyPaidItems,
  getByTable: getOrdersByTable,
  getPaidToday: getOrdersPaidToday,
  create: createOrder,
  addItem: addItemToOrder,
  updateItemQty: updateItemQuantity,
  removeItem: removeItemFromOrder,
  updateNote: updateOrderNote,
  updatePaymentMethod: updateOrderPaymentMethod,
  pay: payOrder,
  payPartial: payPartial,
  recalcTotal: recalcOrderTotal,
  clearItems: clearOrderItems,
  getPendingCount: getPendingOrdersCount,
  getPendingTotal: getPendingTotal,
  closeDay: closeDayOrders,
  ORDER_STATUS,
  PAYMENT_METHODS
};
