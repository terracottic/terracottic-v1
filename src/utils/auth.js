export const getAuthToken = () => {
  return localStorage.getItem(import.meta.env.VITE_TOKEN_KEY);
};

export const setAuthToken = (token) => {
  localStorage.setItem(import.meta.env.VITE_TOKEN_KEY, token);
};

export const removeAuthToken = () => {
  localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
