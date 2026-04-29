const cache = new Map();

export const getSessionStorageItem = (prop) => window.sessionStorage.getItem(prop);

export const setSessionStorageItem = (prop, value) => {
  cache.delete(prop);
  window.sessionStorage.setItem(prop, value);
};

export const getPropFromSessionStorageObj = (prop, key) => {
  let obj = cache.get(prop);
  if (!obj) {
    const raw = getSessionStorageItem(prop);
    if (!raw) return '';
    obj = JSON.parse(raw);
    cache.set(prop, obj);
  }
  return obj[key] || '';
};
