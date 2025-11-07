const express = require('express');
const router = express.Router();
const {
  crearOActualizarPrueba,
  obtenerPruebas,
  obtenerPruebaPorId,
  obtenerMiPrueba,
  renovarPrueba,
  eliminarPrueba,
  obtenerAlertasPendientes,
  obtenerPruebasVencidas,
  actualizarPruebasVencidas,
  obtenerEstadisticas
} = require('../controllers/saludController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// ============================================
// RUTAS ESPECIALES (deben ir PRIMERO)
// ============================================

// @route   GET /api/salud/estadisticas
// @desc    Obtener estadísticas de pruebas de salud
// @access  Privado (Admin)
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// @route   GET /api/salud/alertas/pendientes
// @desc    Obtener pruebas pendientes de alerta
// @access  Privado (Admin)
router.get('/alertas/pendientes', verificarToken, verificarAdmin, obtenerAlertasPendientes);

// @route   GET /api/salud/vencidas
// @desc    Obtener pruebas vencidas
// @access  Privado (Admin)
router.get('/vencidas', verificarToken, verificarAdmin, obtenerPruebasVencidas);

// @route   PUT /api/salud/actualizar-vencidas
// @desc    Actualizar todas las pruebas vencidas
// @access  Privado (Admin)
router.put('/actualizar-vencidas', verificarToken, verificarAdmin, actualizarPruebasVencidas);

// @route   GET /api/salud/mi-prueba
// @desc    Obtener mi prueba de salud (usuario)
// @access  Privado (Usuario)
router.get('/mi-prueba', verificarToken, obtenerMiPrueba);

// ============================================
// RUTAS CRUD ESTÁNDAR
// ============================================

// @route   GET /api/salud
// @desc    Obtener todas las pruebas de salud
// @access  Privado (Admin)
router.get('/', verificarToken, verificarAdmin, obtenerPruebas);

// @route   POST /api/salud
// @desc    Crear o actualizar prueba de salud
// @access  Privado (Admin)
router.post('/', verificarToken, verificarAdmin, crearOActualizarPrueba);

// @route   GET /api/salud/:id
// @desc    Obtener prueba de salud por ID
// @access  Privado (Admin o Usuario dueño)
router.get('/:id', verificarToken, obtenerPruebaPorId);

// @route   PUT /api/salud/:id/renovar
// @desc    Renovar prueba de salud
// @access  Privado (Admin)
router.put('/:id/renovar', verificarToken, verificarAdmin, renovarPrueba);

// @route   DELETE /api/salud/:id
// @desc    Eliminar prueba de salud
// @access  Privado (Admin)
router.delete('/:id', verificarToken, verificarAdmin, eliminarPrueba);

module.exports = router;