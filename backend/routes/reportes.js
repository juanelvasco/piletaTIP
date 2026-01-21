
const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(verificarToken);
router.use(verificarAdmin);

// GET /api/reportes/ingresos - Obtener reporte de ingresos con filtros
router.get('/ingresos', reportesController.obtenerIngresos);

// GET /api/reportes/resumen - Obtener resumen por tipo de abono
router.get('/resumen', reportesController.obtenerResumenPorTipo);

module.exports = router;