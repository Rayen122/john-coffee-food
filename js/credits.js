/**
 * Gestion des crédits clients
 */

const CREDIT_STORE = CafeDB.STORES.credits;

async function getAllCredits() {
    const all = await CafeDB.getAll(CREDIT_STORE);
    // Tri par date décroissante (plus récent d'abord)
    all.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    return all;
}

async function getCredit(id) {
    return CafeDB.get(CREDIT_STORE, id);
}

async function addCredit(clientName, amount, date, note) {
    const credit = {
        id: CafeDB.generateId(),
        clientName: clientName,
        amount: parseFloat(amount),
        date: date || new Date().toISOString(),
        note: note || '',
        createdAt: new Date().toISOString()
    };
    await CafeDB.put(CREDIT_STORE, credit);
    return credit;
}

async function deleteCredit(id) {
    return CafeDB.remove(CREDIT_STORE, id);
}

window.Credits = {
    getAll: getAllCredits,
    get: getCredit,
    add: addCredit,
    delete: deleteCredit
};
