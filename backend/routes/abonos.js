const express = require('express');
const router = express.Router();
const {
  crearAbono,
  obtenerAbonos,
  obtenerAbonoPorId,
  obtenerMiAbono,
  obtenerMiHistorial,
  actualizarAbono,
  marcarComoPagado,
  eliminarAbono,
  obtenerReporteVentas,
  obtenerEstadisticas,
  obtenerTiposUnicos
} = require('../controllers/abonoController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// ============================================
// RUTAS ESPECIALES (deben ir PRIMERO)
// ============================================

// ✅ NUEVA: Obtener tipos únicos para filtros
// @route   GET /api/abonos/tipos-unicos
// @desc    Obtener tipos de abono únicos (activos + históricos)
// @access  Privado (Admin)
router.get('/tipos-unicos', verificarToken, verificarAdmin, obtenerTiposUnicos);

// @route   GET /api/abonos/estadisticas
// @desc    Obtener estadísticas de abonos
// @access  Privado (Admin)
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// @route   GET /api/abonos/reportes/ventas
// @desc    Obtener reporte de ventas
// @access  Privado (Admin)
router.get('/reportes/ventas', verificarToken, verificarAdmin, obtenerReporteVentas);

// @route   GET /api/abonos/mi-abono
// @desc    Obtener abono actual del usuario logueado
// @access  Privado (Usuario)
router.get('/mi-abono', verificarToken, obtenerMiAbono);

// @route   GET /api/abonos/mi-historial
// @desc    Obtener historial de abonos del usuario
// @access  Privado (Usuario)
router.get('/mi-historial', verificarToken, obtenerMiHistorial);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// @route   GET /api/abonos
// @desc    Obtener todos los abonos (con filtros)
// @access  Privado (Admin)
router.get('/', verificarToken, verificarAdmin, obtenerAbonos);

// @route   POST /api/abonos
// @desc    Crear nuevo abono
// @access  Privado (Admin)
router.post('/', verificarToken, verificarAdmin, crearAbono);

// @route   GET /api/abonos/:id
// @desc    Obtener abono por ID
// @access  Privado (Admin o Usuario dueño)
router.get('/:id', verificarToken, obtenerAbonoPorId);

// @route   PUT /api/abonos/:id
// @desc    Actualizar abono
// @access  Privado (Admin)
router.put('/:id', verificarToken, verificarAdmin, actualizarAbono);

// @route   PUT /api/abonos/:id/pagar
// @desc    Marcar abono como pagado
// @access  Privado (Admin)
router.put('/:id/pagar', verificarToken, verificarAdmin, marcarComoPagado);

// @route   DELETE /api/abonos/:id
// @desc    Eliminar abono
// @access  Privado (Admin)
router.delete('/:id', verificarToken, verificarAdmin, eliminarAbono);

module.exports = router;