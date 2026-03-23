
const STOCK_STORE = CafeDB.STORES.stock;
const MOVEMENT_STORE = CafeDB.STORES.stockMovements;

const STOCK_CATEGORIES = [
    'Café', 'Thé', 'Lait & Crème', 'Jus & Sirops', 'Boissons', 'Nourriture',
    'Emballages', 'Nettoyage', 'Autre'
];

async function getAllStockItems() {
    return CafeDB.getAll(STOCK_STORE);
}

async function getStockItem(id) {
    return CafeDB.get(STOCK_STORE, id);
}

async function saveStockItem(item, reason = 'Mise à jour manuelle') {
    const isNew = !item.id;
    if (isNew) {
        item.id = CafeDB.generateId();
    }
    
    // Track movement if quantity changed (or if new)
    let delta = item.quantity;
    if (!isNew) {
        const oldItem = await getStockItem(item.id);
        if (oldItem) delta = item.quantity - (oldItem.quantity || 0);
    }

    item.updatedAt = new Date().toISOString();
    await CafeDB.put(STOCK_STORE, item);

    if (delta !== 0) {
        await recordMovement(item.name, delta > 0 ? 'in' : 'out', Math.abs(delta), reason);
    }
    return item;
}

async function deleteStockItem(id) {
    const item = await getStockItem(id);
    if (item) {
        await recordMovement(item.name, 'out', item.quantity, 'Suppression de l\'article');
    }
    return CafeDB.remove(STOCK_STORE, id);
}

async function recordMovement(name, type, qty, reason = '') {
    const userStr = window.getCurrentUser ? window.getCurrentUser().displayName || window.getCurrentUser().email : 'Système';
    const movement = {
        id: CafeDB.generateId(),
        itemName: name,
        type: type, // 'in' or 'out'
        quantity: qty,
        reason: reason,
        timestamp: new Date().toISOString(),
        user: userStr
    };
    return CafeDB.put(MOVEMENT_STORE, movement);
}

async function getStockMovements(limit = 50) {
    const all = await CafeDB.getAll(MOVEMENT_STORE);
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
}

/**
 * Déduit une quantité du stock d'un article
 * @param {string} id - ID de l'article
 * @param {number} qty - Quantité à déduire
 */
async function deductStock(id, qty, reason = 'Vente') {
    const item = await getStockItem(id);
    if (!item) return;
    item.quantity = Math.max(0, (item.quantity || 0) - qty);
    // Use the direct DB put to avoid double recording if we use saveStockItem's logic
    item.updatedAt = new Date().toISOString();
    await CafeDB.put(STOCK_STORE, item);
    return recordMovement(item.name, 'out', qty, reason);
}

/**
 * Retourne les articles dont la quantité est <= seuil d'alerte
 */
async function getLowStockItems() {
    const all = await getAllStockItems();
    return all.filter(item => item.quantity <= item.minQuantity);
}

/**
 * Retourne le statut d'un article : 'ok' | 'low' | 'out'
 */
function getStockStatus(item) {
    if (item.quantity <= 0) return 'out';
    if (item.quantity <= item.minQuantity) return 'low';
    return 'ok';
}

window.Stock = {
    getAll: getAllStockItems,
    get: getStockItem,
    save: saveStockItem,
    delete: deleteStockItem,
    deduct: deductStock,
    getLowStock: getLowStockItems,
    getStatus: getStockStatus,
    getMovements: getStockMovements,
    recordMovement: recordMovement,
    CATEGORIES: STOCK_CATEGORIES
};
