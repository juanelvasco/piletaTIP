// backend/routes/configuracion.js

const express = require('express');
const router = express.Router();
const {
  obtenerConfiguracion,
  agregarTipoAbono,
  actualizarTipoAbono,
  eliminarTipoAbono,
  reordenarTiposAbono,
  actualizarSistema,
  actualizarPruebaSalud,
  actualizarAbonos
} = require('../controllers/configuracionController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Ruta pública para obtener configuración
router.get('/', obtenerConfiguracion);

// ✅ NUEVAS RUTAS: Gestión de tipos de abono
router.post('/tipos-abono', verificarToken, verificarAdmin, agregarTipoAbono);
router.put('/tipos-abono/:id', verificarToken, verificarAdmin, actualizarTipoAbono);
router.delete('/tipos-abono/:id', verificarToken, verificarAdmin, eliminarTipoAbono);
router.put('/tipos-abono-reordenar', verificarToken, verificarAdmin, reordenarTiposAbono);

// Rutas protegidas (solo admin)
router.put('/sistema', verificarToken, verificarAdmin, actualizarSistema);
router.put('/prueba-salud', verificarToken, verificarAdmin, actualizarPruebaSalud);
router.put('/abonos', verificarToken, verificarAdmin, actualizarAbonos);

module.exports = router;