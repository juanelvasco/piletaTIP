const mongoose = require('mongoose');

const abonoSchema = new mongoose.Schema({
  // Relación con usuario
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es obligatorio']
  },
  
  // Fechas del abono
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin es obligatoria']
  },
  
  // Tipo y precio
  tipoAbono: {
    type: String,
    enum: {
      values: ['mensual', 'trimestral', 'semestral', 'anual'],
      message: '{VALUE} no es un tipo de abono válido'
    },
    required: [true, 'El tipo de abono es obligatorio']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  
  // Estado de pago
  pagado: {
    type: Boolean,
    default: false
  },
  metodoPago: {
    type: String,
    enum: {
      values: ['efectivo', 'mercadopago', 'transferencia', 'pendiente'],
      message: '{VALUE} no es un método de pago válido'
    },
    default: 'pendiente'
  },
  fechaPago: {
    type: Date,
    default: null
  },
  
  // Integración con MercadoPago
  mercadoPagoId: {
    type: String,
    default: null
  },
  mercadoPagoStatus: {
    type: String,
    default: null
  },
  
  // Estado del abono
  activo: {
    type: Boolean,
    default: false
  },
  
  // Notas adicionales
  notas: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// VIRTUAL: Calcular si el abono está vigente
abonoSchema.virtual('vigente').get(function() {
  const hoy = new Date();
  return this.pagado && 
         this.fechaInicio <= hoy && 
         this.fechaFin >= hoy &&
         this.activo;
});

// VIRTUAL: Días restantes
abonoSchema.virtual('diasRestantes').get(function() {
  const hoy = new Date();
  const diferencia = this.fechaFin - hoy;
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
});

// MÉTODO ESTÁTICO: Crear abono automático según tipo
abonoSchema.statics.crearAbono = async function(usuarioId, tipoAbono, precio) {
  const fechaInicio = new Date();
  const fechaFin = new Date();
  
  // Calcular fecha de fin según tipo
  switch(tipoAbono) {
    case 'mensual':
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      break;
    case 'trimestral':
      fechaFin.setMonth(fechaFin.getMonth() + 3);
      break;
    case 'semestral':
      fechaFin.setMonth(fechaFin.getMonth() + 6);
      break;
    case 'anual':
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      break;
    default:
      throw new Error('Tipo de abono inválido');
  }
  
  const abono = await this.create({
    usuario: usuarioId,
    fechaInicio,
    fechaFin,
    tipoAbono,
    precio,
    activo: false,
    pagado: false
  });
  
  return abono;
};

// MÉTODO: Marcar como pagado
abonoSchema.methods.marcarComoPagado = async function(metodoPago, transaccionId = null) {
  this.pagado = true;
  this.activo = true;
  this.fechaPago = new Date();
  this.metodoPago = metodoPago;
  
  if (metodoPago === 'mercadopago' && transaccionId) {
    this.mercadoPagoId = transaccionId;
  }
  
  await this.save();
  
  // Actualizar el usuario con este abono como actual
  const Usuario = mongoose.model('Usuario');
  await Usuario.findByIdAndUpdate(this.usuario, {
    abonoActual: this._id
  });
  
  return this;
};

// MÉTODO: Verificar si está próximo a vencer (3 días antes)
abonoSchema.methods.proximoAVencer = function() {
  const hoy = new Date();
  const diasRestantes = Math.ceil((this.fechaFin - hoy) / (1000 * 60 * 60 * 24));
  return diasRestantes <= 3 && diasRestantes > 0;
};

// MIDDLEWARE: Verificar vigencia antes de guardar
abonoSchema.pre('save', function(next) {
  // Si el abono fue pagado y está activo, verificar vigencia
  if (this.pagado && this.activo) {
    const hoy = new Date();
    // Si ya venció, desactivarlo
    if (this.fechaFin < hoy) {
      this.activo = false;
    }
  }
  next();
});

// ÍNDICES para búsquedas optimizadas
abonoSchema.index({ usuario: 1 });
abonoSchema.index({ fechaFin: 1 });
abonoSchema.index({ activo: 1, pagado: 1 });
abonoSchema.index({ mercadoPagoId: 1 });

// Asegurar que los virtuals se incluyan al convertir a JSON
abonoSchema.set('toJSON', { virtuals: true });
abonoSchema.set('toObject', { virtuals: true });

const Abono = mongoose.model('Abono', abonoSchema);

module.exports = Abono;