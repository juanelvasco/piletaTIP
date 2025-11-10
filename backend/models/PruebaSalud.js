const mongoose = require('mongoose');

const pruebaSaludSchema = new mongoose.Schema({
  // Relación con usuario
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es obligatorio'],
    unique: true // Un usuario solo tiene una prueba de salud activa
  },
  
  // Fechas
  fechaPrueba: {
    type: Date,
    required: [true, 'La fecha de la prueba es obligatoria'],
    default: Date.now
  },
  fechaVencimiento: {
    type: Date,
    required: [true, 'La fecha de vencimiento es obligatoria']
  },
  
  // Días de validez (configurable)
  diasValidez: {
    type: Number,
    required: [true, 'Los días de validez son obligatorios'],
    default: 15,
    min: [1, 'Debe ser al menos 1 día'],
    max: [365, 'No puede ser más de 365 días']
  },
  
  // Estado
  vigente: {
    type: Boolean,
    default: true
  },
  
  // Control de alertas
  alertaEnviada: {
    type: Boolean,
    default: false
  },
  fechaAlerta: {
    type: Date,
    default: null
  },
  
  // Archivo adjunto (opcional, para futuro)
  archivoUrl: {
    type: String,
    default: null
  },
  archivoNombre: {
    type: String,
    default: null
  },
  
  // Notas adicionales
  notas: {
    type: String,
    trim: true
  },
  
  // Registrar quién cargó la prueba
  cargadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// VIRTUAL: Días hasta vencimiento
pruebaSaludSchema.virtual('diasHastaVencimiento').get(function() {
  const hoy = new Date();
  const diferencia = this.fechaVencimiento - hoy;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return dias;
});

// VIRTUAL: Estado legible
pruebaSaludSchema.virtual('estadoLegible').get(function() {
  const dias = this.diasHastaVencimiento;
  
  if (!this.vigente) {
    return 'Vencida';
  }
  
  if (dias < 0) {
    return 'Vencida';
  } else if (dias <= 2) {
    return 'Crítico - Vence en ' + dias + ' día(s)';
  } else if (dias <= 5) {
    return 'Alerta - Vence en ' + dias + ' días';
  } else {
    return 'Vigente - ' + dias + ' días restantes';
  }
});

// MIDDLEWARE: Calcular fecha de vencimiento antes de guardar
pruebaSaludSchema.pre('save', function(next) {
  // Si es una prueba nueva o se modificó la fechaPrueba o diasValidez
  if (this.isNew || this.isModified('fechaPrueba') || this.isModified('diasValidez')) {
    // La prueba vence según los días de validez configurados
    const vencimiento = new Date(this.fechaPrueba);
    vencimiento.setDate(vencimiento.getDate() + this.diasValidez);
    this.fechaVencimiento = vencimiento;
  }
  next();
});

// MIDDLEWARE: Actualizar estado de vigencia antes de guardar
pruebaSaludSchema.pre('save', function(next) {
  const hoy = new Date();
  // Si ya venció, marcar como no vigente
  if (this.fechaVencimiento < hoy) {
    this.vigente = false;
  }
  next();
});

// MÉTODO: Renovar prueba de salud
pruebaSaludSchema.methods.renovar = async function(enfermeroId, diasValidez = 15, notas = null) {
  this.fechaPrueba = new Date();
  this.diasValidez = diasValidez;
  // El middleware pre-save calculará automáticamente la nueva fechaVencimiento
  this.vigente = true;
  this.alertaEnviada = false;
  this.fechaAlerta = null;
  this.cargadoPor = enfermeroId;
  
  if (notas) {
    this.notas = notas;
  }
  
  await this.save();
  return this;
};

// MÉTODO: Marcar alerta como enviada
pruebaSaludSchema.methods.marcarAlertaEnviada = async function() {
  this.alertaEnviada = true;
  this.fechaAlerta = new Date();
  await this.save();
  return this;
};

// MÉTODO ESTÁTICO: Crear o actualizar prueba de salud
pruebaSaludSchema.statics.crearOActualizar = async function(usuarioId, enfermeroId, diasValidez = 15, notas = null) {
  // Buscar si ya existe una prueba para este usuario
  let prueba = await this.findOne({ usuario: usuarioId });
  
  if (prueba) {
    // Si existe, renovarla
    return await prueba.renovar(enfermeroId, diasValidez, notas);
  } else {
    // Si no existe, crear una nueva
    prueba = await this.create({
      usuario: usuarioId,
      fechaPrueba: new Date(),
      diasValidez: diasValidez,
      cargadoPor: enfermeroId,
      notas,
      vigente: true
    });
    
    // Actualizar la referencia en el usuario
    const Usuario = mongoose.model('Usuario');
    await Usuario.findByIdAndUpdate(usuarioId, {
      pruebaSalud: prueba._id
    });
    
    return prueba;
  }
};

// MÉTODO ESTÁTICO: Obtener pruebas que necesitan alerta
pruebaSaludSchema.statics.obtenerPendientesAlerta = async function(diasAntes = 2) {
  const hoy = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasAntes);
  
  return await this.find({
    vigente: true,
    alertaEnviada: false,
    fechaVencimiento: {
      $lte: fechaLimite,
      $gte: hoy
    }
  }).populate('usuario', 'nombre apellido email telefono');
};

// MÉTODO ESTÁTICO: Obtener pruebas vencidas
pruebaSaludSchema.statics.obtenerVencidas = async function() {
  const hoy = new Date();
  
  return await this.find({
    fechaVencimiento: { $lt: hoy },
    vigente: true // Todavía marcadas como vigentes (para actualizarlas)
  }).populate('usuario', 'nombre apellido email');
};

// MÉTODO ESTÁTICO: Actualizar todas las pruebas vencidas
pruebaSaludSchema.statics.actualizarVencidas = async function() {
  const hoy = new Date();
  
  const resultado = await this.updateMany(
    {
      fechaVencimiento: { $lt: hoy },
      vigente: true
    },
    {
      $set: { vigente: false }
    }
  );
  
  return resultado;
};

// MÉTODO ESTÁTICO: Obtener estadísticas
pruebaSaludSchema.statics.obtenerEstadisticas = async function() {
  const total = await this.countDocuments();
  const vigentes = await this.countDocuments({ vigente: true });
  const vencidas = await this.countDocuments({ vigente: false });
  
  const hoy = new Date();
  const proximasVencer = new Date();
  proximasVencer.setDate(proximasVencer.getDate() + 5);
  
  const alertas = await this.countDocuments({
    vigente: true,
    fechaVencimiento: {
      $gte: hoy,
      $lte: proximasVencer
    }
  });
  
  return {
    total,
    vigentes,
    vencidas,
    alertas,
    porcentajeVigente: total > 0 ? ((vigentes / total) * 100).toFixed(2) : 0
  };
};

// ÍNDICES
pruebaSaludSchema.index({ fechaVencimiento: 1 });
pruebaSaludSchema.index({ vigente: 1 });
pruebaSaludSchema.index({ alertaEnviada: 1 });

// Incluir virtuals en JSON
pruebaSaludSchema.set('toJSON', { virtuals: true });
pruebaSaludSchema.set('toObject', { virtuals: true });

const PruebaSalud = mongoose.model('PruebaSalud', pruebaSaludSchema);

module.exports = PruebaSalud;