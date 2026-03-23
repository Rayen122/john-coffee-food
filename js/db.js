/**
 * Firebase Firestore - Base de données Cloud CafeDB
 * Les données sont synchronisées en ligne pour PC et téléphone.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBy6Rif4VaeiolVrRcHEoQaCCMB4CXAfgQ",
  authDomain: "mon-cafe-john.firebaseapp.com",
  projectId: "mon-cafe-john",
  storageBucket: "mon-cafe-john.firebasestorage.app",
  messagingSenderId: "97935158832",
  appId: "1:97935158832:web:c64cd553ef57170ecec7f5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestoreDb = firebase.firestore();

const STORES = {
  tables: 'tables',
  products: 'products',
  orders: 'orders',
  orderItems: 'orderItems',
  payments: 'payments',
  settings: 'settings',
  users: 'users',
  credits: 'credits',
  stock: 'stock',
  stockMovements: 'stockMovements'
};

/**
 * Compatible avec l'ancienne signature
 */
function openDB() {
  return Promise.resolve();
}

/**
 * Génère un ID unique avec Firestore
 */
function generateId() {
  return firestoreDb.collection('dummy').doc().id;
}

/**
 * Récupère tous les documents
 */
function getAll(storeName) {
  return firestoreDb.collection(storeName).get().then(snapshot => {
    const results = [];
    snapshot.forEach(doc => {
      results.push(doc.data());
    });
    return results;
  });
}

/**
 * Récupère un enregistrement
 */
function get(storeName, id) {
  return firestoreDb.collection(storeName).doc(id.toString()).get().then(doc => {
    return doc.exists ? doc.data() : undefined;
  });
}

/**
 * Ajoute ou met à jour
 */
function put(storeName, object) {
  // Settings use 'key', others use 'id'
  const idValue = object.id || object.key;
  if (!idValue) {
    return Promise.reject(new Error("L'objet n'a pas d'ID ou de KEY"));
  }
  return firestoreDb.collection(storeName).doc(idValue.toString()).set(object).then(() => {
    return object;
  });
}

/**
 * Supprime un document
 */
function remove(storeName, id) {
  return firestoreDb.collection(storeName).doc(id.toString()).delete();
}

/**
 * Requête par index (where)
 */
function getByIndex(storeName, indexName, value) {
  return firestoreDb.collection(storeName).where(indexName, '==', value).get().then(snapshot => {
    const results = [];
    snapshot.forEach(doc => {
      results.push(doc.data());
    });
    return results;
  });
}

/**
 * Efface tous les documents (Batch delete)
 */
function clearStore(storeName) {
  return firestoreDb.collection(storeName).get().then(snapshot => {
    const batch = firestoreDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    return batch.commit();
  });
}

/**
 * Exporte l'objet STORES API
 */
window.CafeDB = {
  open: openDB,
  STORES,
  generateId,
  getAll,
  get,
  put,
  remove,
  getByIndex,
  clearStore
};

