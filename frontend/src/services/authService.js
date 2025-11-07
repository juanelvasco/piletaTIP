import api from './api';

// Registrar nuevo usuario
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.usuario));
  }
  return response.data;
};

// Login
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.usuario));
  }
  return response.data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Obtener usuario actual
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

// Obtener perfil actualizado del servidor
export const getProfile = async () => {
  const response = await api.get('/auth/me');
  if (response.data.usuario) {
    localStorage.setItem('user', JSON.stringify(response.data.usuario));
  }
  return response.data;
};

// Actualizar perfil
export const updateProfile = async (userData) => {
  const response = await api.put('/auth/me', userData);
  if (response.data.usuario) {
    localStorage.setItem('user', JSON.stringify(response.data.usuario));
  }
  return response.data;
};

// Cambiar contraseña
export const changePassword = async (passwordActual, passwordNuevo) => {
  const response = await api.put('/auth/cambiar-password', {
    passwordActual,
    passwordNuevo
  });
  return response.data;
};

// Verificar si está autenticado
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Verificar si es admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.rol === 'admin';
};