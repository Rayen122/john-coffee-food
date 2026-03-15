/**
 * Notifications pour l'admin
 * Stockées dans Firestore, collection 'notifications'
 */

const NOTIF_STORE = 'notifications';

async function createNotification(type, message, details) {
    var notif = {
        id: CafeDB.generateId(),
        type: type,
        message: message,
        details: details || '',
        userName: window.getCurrentUserName ? window.getCurrentUserName() : 'Inconnu',
        userRole: window.getCurrentUserRole ? window.getCurrentUserRole() : 'serveur',
        read: false,
        createdAt: new Date().toISOString()
    };
    await CafeDB.put(NOTIF_STORE, notif);
    return notif;
}

async function getAllNotifications() {
    var notifs = await CafeDB.getAll(NOTIF_STORE);
    // Sort by newest first
    notifs.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return notifs;
}

async function getUnreadCount() {
    var notifs = await getAllNotifications();
    return notifs.filter(function (n) { return !n.read; }).length;
}

async function markAsRead(notifId) {
    var notif = await CafeDB.get(NOTIF_STORE, notifId);
    if (notif) {
        notif.read = true;
        await CafeDB.put(NOTIF_STORE, notif);
    }
}

async function markAllAsRead() {
    var notifs = await getAllNotifications();
    for (var i = 0; i < notifs.length; i++) {
        if (!notifs[i].read) {
            notifs[i].read = true;
            await CafeDB.put(NOTIF_STORE, notifs[i]);
        }
    }
}

async function clearAllNotifications() {
    return CafeDB.clearStore(NOTIF_STORE);
}

window.Notifications = {
    create: createNotification,
    getAll: getAllNotifications,
    getUnreadCount: getUnreadCount,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    clearAll: clearAllNotifications
};
