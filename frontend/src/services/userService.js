import api from './api';

// Obtener todos los usuarios con filtros
export const getUsers = async (params = {}) => {
  // Filtrar parámetros vacíos para no enviarlos al backend
  const cleanParams = {};
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    // Solo agregar si el valor no está vacío
    if (value !== '' && value !== null && value !== undefined) {
      cleanParams[key] = value;
    }
  });
  
  const response = await api.get('/users', { params: cleanParams });
  return response.data;
};

// Obtener usuario por ID
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Crear nuevo usuario
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// Actualizar usuario
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

// Banear/Desbanear usuario
export const toggleBanUser = async (id, baneado, motivoBaneo = '') => {
  const response = await api.put(`/users/${id}/banear`, {
    baneado,
    motivoBaneo
  });
  return response.data;
};

// Eliminar usuario
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
  const response = await api.get('/users/estadisticas');
  return response.data;
};