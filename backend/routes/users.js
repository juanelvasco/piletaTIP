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
const { verificarToken, verificarAdmin, verificarAdminOEnfermero } = require('../middleware/auth');

// Todas las rutas requieren autenticación
// Los enfermeros solo pueden ver usuarios, no modificarlos

// @route   GET /api/users/estadisticas
// @desc    Obtener estadísticas de usuarios
// @access  Privado (Admin o Enfermero)
// IMPORTANTE: Esta ruta debe ir ANTES de /api/users/:id
// porque sino Express interpretaría "estadisticas" como un :id
router.get('/estadisticas', verificarToken, verificarAdminOEnfermero, obtenerEstadisticas);

// @route   GET /api/users
// @desc    Obtener todos los usuarios (con paginación y filtros)
// @access  Privado (Admin o Enfermero)
router.get('/', verificarToken, verificarAdminOEnfermero, obtenerUsuarios);

// @route   GET /api/users/:id
// @desc    Obtener un usuario por ID
// @access  Privado (Admin o Enfermero)
router.get('/:id', verificarToken, verificarAdminOEnfermero, obtenerUsuarioPorId);

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
router.put('/:id', verificarToken, verificarAdmin, toggleBanearUsuario);

// @route   DELETE /api/users/:id
// @desc    Eliminar usuario (soft delete)
// @access  Privado (Admin)
router.delete('/:id', verificarToken, verificarAdmin, eliminarUsuario);

module.exports = router;