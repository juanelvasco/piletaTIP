import api from './api';

// Escanear QR (Admin)
export const escanearQR = async (qrCode, notas = '') => {
  const response = await api.post('/escaneos/escanear', { qrCode, notas });
  return response.data;
};

// Obtener todos los escaneos (Admin)
export const getEscaneos = async (params = {}) => {
  const cleanParams = {};
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== '' && value !== null && value !== undefined) {
      cleanParams[key] = value;
    }
  });
  
  const response = await api.get('/escaneos', { params: cleanParams });
  return response.data;
};

// Obtener escaneo por ID (Admin)
export const getEscaneoById = async (id) => {
  const response = await api.get(`/escaneos/${id}`);
  return response.data;
};

// Obtener historial de un usuario (Admin)
export const getHistorialUsuario = async (usuarioId, limite = 50) => {
  const response = await api.get(`/escaneos/usuario/${usuarioId}`, {
    params: { limite }
  });
  return response.data;
};

// Obtener mi historial de escaneos (Usuario)
export const getMiHistorial = async (limite = 50) => {
  const response = await api.get('/escaneos/mi-historial', {
    params: { limite }
  });
  return response.data;
};

// Obtener escaneos del día (Admin)
export const getEscaneosHoy = async () => {
  const response = await api.get('/escaneos/hoy');
  return response.data;
};

// Obtener estadísticas (Admin)
export const getEstadisticas = async (fechaInicio, fechaFin) => {
  const response = await api.get('/escaneos/estadisticas', {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};

// Obtener reporte de rechazos (Admin)
export const getReporteRechazos = async (fechaInicio, fechaFin) => {
  const response = await api.get('/escaneos/reportes/rechazos', {
    params: { fechaInicio, fechaFin }
  });
  return response.data;
};