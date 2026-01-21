const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  // ✅ NUEVO: Tipos de abono dinámicos (array de objetos)
  tiposAbono: [
    {
      id: {
        type: String,
        required: true,
        unique: true
      },
      nombre: {
        type: String,
        required: true,
        trim: true
      },
      precio: {
        type: Number,
        required: true,
        min: [0, 'El precio no puede ser negativo']
      },
      duracionDias: {
        type: Number,
        required: true,
        min: [1, 'La duración debe ser al menos 1 día']
      },
      descripcion: {
        type: String,
        trim: true,
        default: ''
      },
      activo: {
        type: Boolean,
        default: true
      },
      orden: {
        type: Number,
        default: 0
      }
    }
  ],
  
  // Configuración de prueba de salud
  pruebaSalud: {
    diasValidez: {
      type: Number,
      default: 15,
      min: [1, 'Debe ser al menos 1 día'],
      max: [365, 'No puede ser más de 365 días']
    },
    diasAlertaAntes: {
      type: Number,
      default: 2,
      min: [0, 'No puede ser negativo'],
      max: [30, 'No puede ser más de 30 días']
    }
  },
  
  // Configuración de abonos
  abonos: {
    diasAlertaVencimiento: {
      type: Number,
      default: 3,
      min: [0, 'No puede ser negativo'],
      max: [30, 'No puede ser más de 30 días']
    },
    permitirRenovacionAnticipada: {
      type: Boolean,
      default: true
    },
    diasAnticipadosRenovacion: {
      type: Number,
      default: 7,
      min: [0, 'No puede ser negativo'],
      max: [30, 'No puede ser más de 30 días']
    }
  },
  
  // Configuración general del sistema
  sistema: {
    nombrePileta: {
      type: String,
      default: 'Pileta Municipal',
      trim: true
    },
    horarioApertura: {
      type: String,
      default: '08:00'
    },
    horarioCierre: {
      type: String,
      default: '20:00'
    },
    diasLaborables: {
      type: [String],
      default: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    },
    mensajeBienvenida: {
      type: String,
      default: 'Bienvenido al sistema de control de acceso'
    }
  },
  
  // MercadoPago (para futuro)
  mercadopago: {
    activo: {
      type: Boolean,
      default: false
    },
    publicKey: {
      type: String,
      default: null,
      select: false
    },
    accessToken: {
      type: String,
      default: null,
      select: false
    }
  },
  
  // Control de versión y actualización
  version: {
    type: String,
    default: '2.0.0' // Nueva versión con tipos dinámicos
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true
});

// ✅ NUEVO: Agregar tipo de abono
configuracionSchema.methods.agregarTipoAbono = async function(nuevoTipo) {
  // Generar ID único si no existe
  if (!nuevoTipo.id) {
    nuevoTipo.id = nuevoTipo.nombre.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Verificar que no exista
  const existe = this.tiposAbono.find(t => t.id === nuevoTipo.id);
  if (existe) {
    throw new Error('Ya existe un tipo de abono con ese ID');
  }
  
  this.tiposAbono.push(nuevoTipo);
  await this.save();
  return this;
};

// ✅ NUEVO: Eliminar tipo de abono
configuracionSchema.methods.eliminarTipoAbono = async function(tipoId) {
  this.tiposAbono = this.tiposAbono.filter(t => t.id !== tipoId);
  await this.save();
  return this;
};

// ✅ NUEVO: Actualizar tipo de abono
configuracionSchema.methods.actualizarTipoAbono = async function(tipoId, datosActualizados) {
  const tipo = this.tiposAbono.find(t => t.id === tipoId);
  if (!tipo) {
    throw new Error('Tipo de abono no encontrado');
  }
  
  Object.assign(tipo, datosActualizados);
  await this.save();
  return this;
};

// ✅ NUEVO: Obtener precio por ID de tipo
configuracionSchema.methods.obtenerPrecio = function(tipoId) {
  const tipo = this.tiposAbono.find(t => t.id === tipoId && t.activo);
  return tipo ? tipo.precio : null;
};

// ✅ NUEVO: Obtener duración por ID de tipo
configuracionSchema.methods.obtenerDuracion = function(tipoId) {
  const tipo = this.tiposAbono.find(t => t.id === tipoId && t.activo);
  return tipo ? tipo.duracionDias : null;
};

// MÉTODO ESTÁTICO: Obtener o crear configuración (singleton)
configuracionSchema.statics.obtener = async function() {
  let config = await this.findOne();
  
  // Si no existe, crear una con valores por defecto
  if (!config) {
    config = await this.create({
      tiposAbono: [
        {
          id: 'diario',
          nombre: 'Diario',
          precio: 6000,
          duracionDias: 1,
          descripcion: 'Acceso por 1 día',
          orden: 1
        },
        {
          id: 'mensual',
          nombre: 'Mensual',
          precio: 15000,
          duracionDias: 30,
          descripcion: 'Acceso por 30 días',
          orden: 2
        },
        {
          id: 'trimestral',
          nombre: 'Trimestral',
          precio: 40000,
          duracionDias: 90,
          descripcion: 'Acceso por 90 días (3 meses)',
          orden: 3
        },
        {
          id: 'semestral',
          nombre: 'Semestral',
          precio: 75000,
          duracionDias: 180,
          descripcion: 'Acceso por 180 días (6 meses)',
          orden: 4
        },
        {
          id: 'anual',
          nombre: 'Anual',
          precio: 140000,
          duracionDias: 365,
          descripcion: 'Acceso por 365 días (1 año)',
          orden: 5
        }
      ]
    });
  }
  
  return config;
};

// MÉTODO ESTÁTICO: Obtener solo tipos de abono activos
configuracionSchema.statics.obtenerTiposActivos = async function() {
  const config = await this.obtener();
  return config.tiposAbono
    .filter(t => t.activo)
    .sort((a, b) => a.orden - b.orden);
};

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

module.exports = Configuracion;