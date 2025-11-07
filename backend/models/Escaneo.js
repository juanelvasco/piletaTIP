const mongoose = require('mongoose');

const escaneoSchema = new mongoose.Schema({
  // Relaciones
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es obligatorio']
  },
  abono: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abono',
    default: null
  },
  
  // Información del escaneo
  fechaHora: {
    type: Date,
    default: Date.now,
    required: true
  },
  exitoso: {
    type: Boolean,
    required: true
  },
  motivoRechazo: {
    type: String,
    enum: {
      values: [
        null,
        'abono_vencido',
        'abono_no_pagado',
        'sin_abono',
        'usuario_baneado',
        'usuario_inactivo',
        'prueba_salud_vencida',
        'sin_prueba_salud',
        'qr_invalido'
      ],
      message: '{VALUE} no es un motivo válido'
    },
    default: null
  },
  
  // Información del admin que escaneó
  escaneadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El admin que escanea es obligatorio']
  },
  
  // Información adicional
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  
  // Notas opcionales del admin
  notas: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Solo createdAt (no necesitamos updatedAt)
});

// VIRTUAL: Obtener mensaje legible del motivo de rechazo
escaneoSchema.virtual('motivoLegible').get(function() {
  if (!this.motivoRechazo) return null;
  
  const motivos = {
    'abono_vencido': 'El abono ha vencido',
    'abono_no_pagado': 'El abono no está pagado',
    'sin_abono': 'El usuario no tiene un abono asignado',
    'usuario_baneado': 'El usuario está baneado temporalmente',
    'usuario_inactivo': 'El usuario está inactivo en el sistema',
    'prueba_salud_vencida': 'La prueba de salud ha vencido',
    'sin_prueba_salud': 'El usuario no tiene prueba de salud registrada',
    'qr_invalido': 'El código QR es inválido o no existe'
  };
  
  return motivos[this.motivoRechazo] || 'Motivo desconocido';
});

// MÉTODO ESTÁTICO: Registrar intento de acceso
escaneoSchema.statics.registrarAcceso = async function(datos) {
  const { 
    usuarioId, 
    abonoId, 
    exitoso, 
    motivoRechazo, 
    adminId,
    ipAddress,
    userAgent,
    notas 
  } = datos;
  
  const escaneo = await this.create({
    usuario: usuarioId,
    abono: abonoId || null,
    exitoso,
    motivoRechazo: exitoso ? null : motivoRechazo,
    escaneadoPor: adminId,
    ipAddress,
    userAgent,
    notas
  });
  
  return escaneo;
};

// MÉTODO ESTÁTICO: Obtener estadísticas de accesos
escaneoSchema.statics.obtenerEstadisticas = async function(filtros = {}) {
  const { fechaInicio, fechaFin, usuarioId } = filtros;
  
  const match = {};
  
  if (fechaInicio && fechaFin) {
    match.fechaHora = {
      $gte: new Date(fechaInicio),
      $lte: new Date(fechaFin)
    };
  }
  
  if (usuarioId) {
    match.usuario = mongoose.Types.ObjectId(usuarioId);
  }
  
  const estadisticas = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEscaneos: { $sum: 1 },
        exitosos: {
          $sum: { $cond: ['$exitoso', 1, 0] }
        },
        rechazados: {
          $sum: { $cond: ['$exitoso', 0, 1] }
        }
      }
    }
  ]);
  
  if (estadisticas.length === 0) {
    return {
      totalEscaneos: 0,
      exitosos: 0,
      rechazados: 0,
      porcentajeExito: 0
    };
  }
  
  const stats = estadisticas[0];
  stats.porcentajeExito = stats.totalEscaneos > 0 
    ? ((stats.exitosos / stats.totalEscaneos) * 100).toFixed(2)
    : 0;
  
  return stats;
};

// MÉTODO ESTÁTICO: Obtener historial de un usuario
escaneoSchema.statics.historialUsuario = async function(usuarioId, limite = 50) {
  return await this.find({ usuario: usuarioId })
    .populate('escaneadoPor', 'nombre apellido')
    .populate('abono', 'tipoAbono fechaFin')
    .sort({ fechaHora: -1 })
    .limit(limite);
};

// MÉTODO ESTÁTICO: Obtener accesos del día
escaneoSchema.statics.accesosDia = async function(fecha = new Date()) {
  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  
  const finDia = new Date(fecha);
  finDia.setHours(23, 59, 59, 999);
  
  return await this.find({
    fechaHora: {
      $gte: inicioDia,
      $lte: finDia
    }
  })
    .populate('usuario', 'nombre apellido dni')
    .populate('escaneadoPor', 'nombre apellido')
    .sort({ fechaHora: -1 });
};

// MÉTODO ESTÁTICO: Obtener rechazos por motivo (para reportes)
escaneoSchema.statics.rechazosPorMotivo = async function(fechaInicio, fechaFin) {
  return await this.aggregate([
    {
      $match: {
        exitoso: false,
        fechaHora: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      }
    },
    {
      $group: {
        _id: '$motivoRechazo',
        cantidad: { $sum: 1 }
      }
    },
    {
      $sort: { cantidad: -1 }
    }
  ]);
};

// ÍNDICES para búsquedas optimizadas
escaneoSchema.index({ usuario: 1, fechaHora: -1 });
escaneoSchema.index({ fechaHora: -1 });
escaneoSchema.index({ exitoso: 1 });
escaneoSchema.index({ escaneadoPor: 1 });

// Incluir virtuals en JSON
escaneoSchema.set('toJSON', { virtuals: true });
escaneoSchema.set('toObject', { virtuals: true });

const Escaneo = mongoose.model('Escaneo', escaneoSchema);

module.exports = Escaneo;