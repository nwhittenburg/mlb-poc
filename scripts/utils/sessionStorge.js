// Session Storage utilities
export const getSessionStorageItem = (prop) => window.sessionStorage.getItem(prop);
export const setSessionStorageItem = (prop, value) => window.sessionStorage.setItem(prop, value);

export const getPropFromSessionStorageObj = (prop, key) => {
  const obj = JSON.parse(getSessionStorageItem(prop));
  return obj && obj[key] ? obj[key] : '';
};
