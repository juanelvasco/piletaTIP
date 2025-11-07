const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  toggleBanearUsuario,
  eliminarUsuario,
  obtenerEstadisticas
} = require('../controllers/userController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
// Por eso aplicamos los middlewares a todas

// @route   GET /api/users/estadisticas
// @desc    Obtener estadísticas de usuarios
// @access  Privado (Admin)
// IMPORTANTE: Esta ruta debe ir ANTES de /api/users/:id
// porque sino Express interpretaría "estadisticas" como un :id
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// @route   GET /api/users
// @desc    Obtener todos los usuarios (con paginación y filtros)
// @access  Privado (Admin)
router.get('/', verificarToken, verificarAdmin, obtenerUsuarios);

// @route   GET /api/users/:id
// @desc    Obtener un usuario por ID
// @access  Privado (Admin)
router.get('/:id', verificarToken, verificarAdmin, obtenerUsuarioPorId);

// @route   POST /api/users
// @desc    Crear nuevo usuario
// @access  Privado (Admin)
router.post('/', verificarToken, verificarAdmin, crearUsuario);

// @route   PUT /api/users/:id
// @desc    Actualizar usuario
// @access  Privado (Admin)
router.put('/:id', verificarToken, verificarAdmin, actualizarUsuario);

// @route   PUT /api/users/:id/banear
// @desc    Banear/Desbanear usuario
// @access  Privado (Admin)
router.put('/:id/banear', verificarToken, verificarAdmin, toggleBanearUsuario);

// @route   DELETE /api/users/:id
// @desc    Eliminar usuario (soft delete)
// @access  Privado (Admin)
router.delete('/:id', verificarToken, verificarAdmin, eliminarUsuario);

module.exports = router;