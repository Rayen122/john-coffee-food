/**
 * Gestion des produits / menu
 */

const PRODUCT_STORE = CafeDB.STORES.products;

const DEFAULT_CATEGORIES = [
  'Café', 'Thé', 'Jus', 'Boissons fraîches', 'Eau', 'Desserts', 'Snacks'
];

const DEMO_PRODUCTS = [
  { name: 'Espresso', category: 'Café', price: 2.5, available: true },
  { name: 'Cappuccino', category: 'Café', price: 3.5, available: true },
  { name: 'Café crème', category: 'Café', price: 3.2, available: true },
  { name: 'Thé à la menthe', category: 'Thé', price: 3, available: true },
  { name: 'Eau', category: 'Eau', price: 1.5, available: true },
  { name: 'Jus d\'orange', category: 'Jus', price: 4, available: true },
  { name: 'Croissant', category: 'Snacks', price: 2.8, available: true },
  { name: 'Fondant au chocolat', category: 'Desserts', price: 5, available: true }
];

async function getAllProducts() {
  return CafeDB.getAll(PRODUCT_STORE);
}

async function getProduct(id) {
  return CafeDB.get(PRODUCT_STORE, id);
}

async function saveProduct(product) {
  if (!product.id) {
    product.id = CafeDB.generateId();
  }
  return CafeDB.put(PRODUCT_STORE, product);
}

async function deleteProduct(id) {
  return CafeDB.remove(PRODUCT_STORE, id);
}

async function getProductsByCategory(category) {
  if (!category) return getAllProducts();
  return CafeDB.getByIndex(PRODUCT_STORE, 'category', category);
}

async function searchProducts(query) {
  const all = await getAllProducts();
  if (!query || !query.trim()) return all;
  const q = query.trim().toLowerCase();
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.category && p.category.toLowerCase().includes(q))
  );
}

async function ensureDemoProducts() {
  const existing = await getAllProducts();
  if (existing.length > 0) return existing;
  for (const p of DEMO_PRODUCTS) {
    await saveProduct({ ...p, id: CafeDB.generateId() });
  }
  return getAllProducts();
}

window.Products = {
  getAll: getAllProducts,
  get: getProduct,
  save: saveProduct,
  delete: deleteProduct,
  getByCategory: getProductsByCategory,
  search: searchProducts,
  ensureDemo: ensureDemoProducts,
  DEFAULT_CATEGORIES,
  DEMO_PRODUCTS
};
