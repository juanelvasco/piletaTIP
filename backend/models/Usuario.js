const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Datos personales
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No se devuelve por defecto en las queries
  },
  dni: {
    type: String,
    required: [true, 'El DNI es obligatorio'],
    unique: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  
  // Foto de perfil (base64)
  fotoPerfil: {
    type: String,
    default: null
  },
  
  // Rol y acceso
  rol: {
    type: String,
    enum: ['admin', 'usuario', 'enfermero'],
    default: 'usuario'
  },
  qrCode: {
    type: String,
    unique: true,
    // Se generará automáticamente al crear el usuario
  },
  
  // Relaciones
  abonoActual: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abono',
    default: null
  },
  pruebaSalud: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PruebaSalud',
    default: null
  },
  
  // Control de acceso
  activo: {
    type: Boolean,
    default: true
  },
  baneado: {
    type: Boolean,
    default: false
  },
  motivoBaneo: {
    type: String,
    default: null
  },
  fechaBaneo: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// MIDDLEWARE: Hashear password antes de guardar
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generar salt y hashear
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// MIDDLEWARE: Generar código QR único antes de guardar
usuarioSchema.pre('save', async function(next) {
  // Solo generar si es un usuario nuevo y no tiene qrCode
  if (this.isNew && !this.qrCode) {
    // Generar código único: DNI + timestamp + random
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.qrCode = `USER-${this.dni}-${timestamp}-${random}`;
  }
  next();
});

// MÉTODO: Comparar password en login
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// MÉTODO: Obtener datos públicos del usuario (sin password)
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.password;
  return usuario;
};

// VIRTUAL: Nombre completo
usuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});



const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;