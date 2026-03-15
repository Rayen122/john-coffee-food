/**
 * Gestion des utilisateurs (serveurs/serveuses)
 * L'admin (john) est hardcodé, les serveurs sont dans Firestore.
 */
// firebase deploy --only hosting
const USER_STORE = CafeDB.STORES.users;
const USER_ROLES = { ADMIN: 'admin', SERVER: 'serveur' };

async function getAllUsers() {
    return CafeDB.getAll(USER_STORE);
}

async function getUser(id) {
    return CafeDB.get(USER_STORE, id);
}

async function findUserByUsername(username) {
    var users = await getAllUsers();
    return users.find(function (u) {
        return u.username === username;
    }) || null;
}

async function createUser(name, username, password) {
    var existing = await findUserByUsername(username);
    if (existing) {
        throw new Error('Cet identifiant est déjà utilisé.');
    }
    var user = {
        id: CafeDB.generateId(),
        name: name,
        username: username,
        password: password,
        role: USER_ROLES.SERVER,
        createdAt: Date.now()
    };
    await CafeDB.put(USER_STORE, user);
    return user;
}

async function saveUser(user) {
    if (!user.id) {
        user.id = CafeDB.generateId();
    }
    return CafeDB.put(USER_STORE, user);
}

async function deleteUser(userId) {
    return CafeDB.remove(USER_STORE, userId);
}

window.Users = {
    getAll: getAllUsers,
    get: getUser,
    findByUsername: findUserByUsername,
    create: createUser,
    save: saveUser,
    delete: deleteUser,
    ROLES: USER_ROLES
};
