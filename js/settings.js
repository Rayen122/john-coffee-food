/**
 * Paramètres de l'application
 */

const SETTINGS_STORE = CafeDB.STORES.settings;
const DEFAULTS = {
  cafeName: 'John Coffee Food',
  currency: 'DT',
  numTables: 8,
  categories: 'Café\nThé\nJus\nBoissons fraîches\nEau\nDesserts\nSnacks'
};

async function getSetting(key) {
  const row = await CafeDB.get(SETTINGS_STORE, key);
  return row ? row.value : DEFAULTS[key];
}


async function getSettings() {
  const rows = await CafeDB.getAll(SETTINGS_STORE);
  const settings = { ...DEFAULTS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

async function setSetting(key, value) {
  await CafeDB.put(SETTINGS_STORE, { key, value });
}

async function setSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    if (DEFAULTS.hasOwnProperty(key) || key === 'cafeName' || key === 'currency' || key === 'numTables' || key === 'categories' || key === 'fondDeCaisse') {
      await setSetting(key, value);
    }
  }
}

window.Settings = {
  get: getSetting,
  getAll: getSettings,
  set: setSetting,
  setAll: setSettings,
  DEFAULTS
};
