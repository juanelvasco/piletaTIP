import api from './api';

// Obtener todos los abonos con filtros
export const getAbonos = async (params = {}) => {
  // Filtrar parámetros vacíos
  const cleanParams = {};
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== '' && value !== null && value !== undefined) {
      cleanParams[key] = value;
    }
  });
  
  const response = await api.get('/abonos', { params: cleanParams });
  return response.data;
};

// Obtener abono por ID
export const getAbonoById = async (id) => {
  const response = await api.get(`/abonos/${id}`);
  return response.data;
};

// Crear nuevo abono
export const createAbono = async (abonoData) => {
  const response = await api.post('/abonos', abonoData);
  return response.data;
};

// Actualizar abono
export const updateAbono = async (id, abonoData) => {
  const response = await api.put(`/abonos/${id}`, abonoData);
  return response.data;
};

// Marcar como pagado
export const marcarComoPagado = async (id, metodoPago) => {
  const response = await api.put(`/abonos/${id}/pagar`, { metodoPago });
  return response.data;
};

// Obtener mi abono actual (usuario)
export const getMiAbono = async () => {
  const response = await api.get('/abonos/mi-abono');
  return response.data;
};

// Obtener mi historial de abonos (usuario)
export const getMiHistorial = async () => {
  const response = await api.get('/abonos/mi-historial');
  return response.data;
};

// Obtener estadísticas de abonos
export const getAbonoStats = async () => {
  const response = await api.get('/abonos/estadisticas');
  return response.data;
};

// Obtener reporte de ventas
export const getReporteVentas = async (params = {}) => {
  const response = await api.get('/abonos/reportes/ventas', { params });
  return response.data;
};