const express = require('express');
const router = express.Router();
const {
  obtenerConfigPublica,
  obtenerConfig,
  actualizarTarifas,
  actualizarConfig
} = require('../controllers/configController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// @route   GET /api/config/public
// @desc    Obtener configuración pública
// @access  Público
router.get('/public', obtenerConfigPublica);

// @route   GET /api/config
// @desc    Obtener configuración completa
// @access  Privado (Admin)
router.get('/', verificarToken, verificarAdmin, obtenerConfig);

// @route   PUT /api/config/tarifas
// @desc    Actualizar tarifas
// @access  Privado (Admin)
router.put('/tarifas', verificarToken, verificarAdmin, actualizarTarifas);

// @route   PUT /api/config
// @desc    Actualizar configuración general
// @access  Privado (Admin)
router.put('/', verificarToken, verificarAdmin, actualizarConfig);

module.exports = router;