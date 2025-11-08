import api from './api';

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
  const response = await api.get('/users/estadisticas');
  return response.data;
};

// Obtener estadísticas de abonos (cuando esté implementado)
export const getAbonoStats = async () => {
  const response = await api.get('/abonos/estadisticas');
  return response.data;
};

// Obtener estadísticas de escaneos
export const getEscaneoStats = async () => {
  const response = await api.get('/escaneos/estadisticas');
  return response.data;
};

// Obtener escaneos del día
export const getEscaneosHoy = async () => {
  const response = await api.get('/escaneos/hoy');
  return response.data;
};

// Obtener estadísticas de pruebas de salud
export const getSaludStats = async () => {
  const response = await api.get('/salud/estadisticas');
  return response.data;
};