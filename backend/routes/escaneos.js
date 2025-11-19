const express = require('express');
const router = express.Router();
const {
  escanearQR,
  obtenerEscaneos,
  obtenerEscaneoPorId,
  obtenerHistorialUsuario,
  obtenerMiHistorial,
  obtenerEscaneosHoy,
  obtenerEstadisticas,
  obtenerReporteRechazos,
  rechazarEscaneoManual
} = require('../controllers/escaneoController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// ============================================
// RUTAS ESPECIALES (deben ir PRIMERO)
// ============================================

// @route   POST /api/escaneos/escanear
// @desc    Escanear QR y validar acceso
// @access  Privado (Admin)
router.post('/escanear', verificarToken, verificarAdmin, escanearQR);

// @route   GET /api/escaneos/estadisticas
// @desc    Obtener estadísticas de escaneos
// @access  Privado (Admin)
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// @route   GET /api/escaneos/hoy
// @desc    Obtener escaneos del día
// @access  Privado (Admin)
router.get('/hoy', verificarToken, verificarAdmin, obtenerEscaneosHoy);

// @route   GET /api/escaneos/reportes/rechazos
// @desc    Obtener reporte de rechazos por motivo
// @access  Privado (Admin)
router.get('/reportes/rechazos', verificarToken, verificarAdmin, obtenerReporteRechazos);

// @route   GET /api/escaneos/mi-historial
// @desc    Obtener mi historial de escaneos (usuario)
// @access  Privado (Usuario)
router.get('/mi-historial', verificarToken, obtenerMiHistorial);

// @route   GET /api/escaneos/usuario/:usuarioId
// @desc    Obtener historial de un usuario específico
// @access  Privado (Admin)
router.get('/usuario/:usuarioId', verificarToken, verificarAdmin, obtenerHistorialUsuario);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// @route   GET /api/escaneos
// @desc    Obtener todos los escaneos (con filtros)
// @access  Privado (Admin)
router.get('/', verificarToken, verificarAdmin, obtenerEscaneos);

// @route   GET /api/escaneos/:id
// @desc    Obtener escaneo por ID
// @access  Privado (Admin)
router.get('/:id', verificarToken, verificarAdmin, obtenerEscaneoPorId);

// @route   PUT /api/escaneos/:id/rechazar
// @desc    Rechazar escaneo manualmente
// @access  Privado (Admin)
router.put('/:id/rechazar', verificarToken, verificarAdmin, rechazarEscaneoManual);

module.exports = router;