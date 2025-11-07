const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
  // Precios de abonos (en pesos argentinos)
  tarifas: {
    mensual: {
      type: Number,
      required: true,
      default: 15000,
      min: [0, 'El precio no puede ser negativo']
    },
    trimestral: {
      type: Number,
      required: true,
      default: 40000,
      min: [0, 'El precio no puede ser negativo']
    },
    semestral: {
      type: Number,
      required: true,
      default: 75000,
      min: [0, 'El precio no puede ser negativo']
    },
    anual: {
      type: Number,
      required: true,
      default: 140000,
      min: [0, 'El precio no puede ser negativo']
    }
  },
  
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
      select: false // No se devuelve por defecto
    },
    accessToken: {
      type: String,
      default: null,
      select: false // No se devuelve por defecto
    }
  },
  
  // Control de versión y actualización
  version: {
    type: String,
    default: '1.0.0'
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

// VIRTUAL: Obtener descuento por tipo de abono (comparado con mensual)
configuracionSchema.virtual('descuentos').get(function() {
  const precioMensual = this.tarifas.mensual;
  
  return {
    trimestral: this.calcularDescuento(precioMensual * 3, this.tarifas.trimestral),
    semestral: this.calcularDescuento(precioMensual * 6, this.tarifas.semestral),
    anual: this.calcularDescuento(precioMensual * 12, this.tarifas.anual)
  };
});

// MÉTODO: Calcular descuento porcentual
configuracionSchema.methods.calcularDescuento = function(precioSinDescuento, precioConDescuento) {
  const descuento = ((precioSinDescuento - precioConDescuento) / precioSinDescuento) * 100;
  return Math.round(descuento * 100) / 100; // Redondear a 2 decimales
};

// MÉTODO: Actualizar tarifas
configuracionSchema.methods.actualizarTarifas = async function(nuevasTarifas, adminId) {
  if (nuevasTarifas.mensual) this.tarifas.mensual = nuevasTarifas.mensual;
  if (nuevasTarifas.trimestral) this.tarifas.trimestral = nuevasTarifas.trimestral;
  if (nuevasTarifas.semestral) this.tarifas.semestral = nuevasTarifas.semestral;
  if (nuevasTarifas.anual) this.tarifas.anual = nuevasTarifas.anual;
  
  this.ultimaActualizacion = new Date();
  this.actualizadoPor = adminId;
  
  await this.save();
  return this;
};

// MÉTODO: Obtener precio por tipo de abono
configuracionSchema.methods.obtenerPrecio = function(tipoAbono) {
  return this.tarifas[tipoAbono] || null;
};

// MÉTODO ESTÁTICO: Obtener o crear configuración (singleton)
configuracionSchema.statics.obtener = async function() {
  let config = await this.findOne();
  
  // Si no existe, crear una con valores por defecto
  if (!config) {
    config = await this.create({
      tarifas: {
        mensual: 15000,
        trimestral: 40000,
        semestral: 75000,
        anual: 140000
      }
    });
  }
  
  return config;
};

// MÉTODO ESTÁTICO: Obtener solo tarifas públicas
configuracionSchema.statics.obtenerTarifasPublicas = async function() {
  const config = await this.obtener();
  
  return {
    tarifas: config.tarifas,
    descuentos: config.descuentos,
    pruebaSalud: {
      diasValidez: config.pruebaSalud.diasValidez
    },
    sistema: {
      nombrePileta: config.sistema.nombrePileta,
      horarioApertura: config.sistema.horarioApertura,
      horarioCierre: config.sistema.horarioCierre
    }
  };
};

// MIDDLEWARE: Actualizar fecha de modificación antes de guardar
configuracionSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.ultimaActualizacion = new Date();
  }
  next();
});

// MIDDLEWARE: Solo permitir UN documento de configuración
configuracionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Ya existe una configuración. Solo puede haber una configuración en el sistema.');
    }
  }
  next();
});

// Incluir virtuals en JSON
configuracionSchema.set('toJSON', { virtuals: true });
configuracionSchema.set('toObject', { virtuals: true });

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

module.exports = Configuracion;