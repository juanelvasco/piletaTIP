const express = require('express');
const router = express.Router();
const {
  register,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword
} = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Público
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Público
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Obtener perfil del usuario actual
// @access  Privado (requiere token)
router.get('/me', verificarToken, obtenerPerfil);

// @route   PUT /api/auth/me
// @desc    Actualizar perfil del usuario actual
// @access  Privado (requiere token)
router.put('/me', verificarToken, actualizarPerfil);

// @route   PUT /api/auth/cambiar-password
// @desc    Cambiar contraseña
// @access  Privado (requiere token)
router.put('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;