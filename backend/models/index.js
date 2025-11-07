// Archivo central para exportar todos los modelos

const Usuario = require('./Usuario');
const Abono = require('./Abono');
const Escaneo = require('./Escaneo');
const PruebaSalud = require('./PruebaSalud');
const Configuracion = require('./Configuracion');

module.exports = {
  Usuario,
  Abono,
  Escaneo,
  PruebaSalud,
  Configuracion
};