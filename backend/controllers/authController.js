const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Función para generar JWT
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d' // El token expira en 7 días
    }
  );
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Público
const register = async (req, res) => {
  try {
     console.log('📥 DATOS RECIBIDOS:', req.body); // ← AGREGAR ESTA LÍNEA
    // ✅ AGREGAR provincia y localidad
    const { nombre, apellido, email, password, dni, telefono, provincia, localidad } = req.body;
    
    // ✅ AGREGAR provincia y localidad a la validación
    if (!nombre || !apellido || !email || !password || !dni || !provincia || !localidad) {
      return res.status(400).json({ 
        message: 'Por favor complete todos los campos obligatorios: nombre, apellido, email, password, dni, provincia, localidad' 
      });
    }
    
    // Verificar si el email ya existe
    const emailExiste = await Usuario.findOne({ email: email.toLowerCase() });
    if (emailExiste) {
      return res.status(400).json({ 
        message: 'El email ya está registrado' 
      });
    }
    
    // Verificar si el DNI ya existe
    const dniExiste = await Usuario.findOne({ dni });
    if (dniExiste) {
      return res.status(400).json({ 
        message: 'El DNI ya está registrado' 
      });
    }
    
    // ✅ AGREGAR provincia y localidad al crear usuario
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email: email.toLowerCase(),
      password,
      dni,
      telefono,
      provincia,
      localidad,
      rol: 'usuario' // Por defecto es usuario regular
    });
    
    // Generar token
    const token = generarToken(usuario);
    
    // ✅ AGREGAR provincia y localidad a la respuesta
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        provincia: usuario.provincia,
        localidad: usuario.localidad,
        rol: usuario.rol,
        qrCode: usuario.qrCode,
        fotoPerfil: usuario.fotoPerfil,
        activo: usuario.activo
      }
    });
    
  } catch (error) {
    console.error('Error en register:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación',
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al registrar usuario',
      error: error.message 
    });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Público
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Por favor ingrese email y contraseña' 
      });
    }
    
    // Buscar usuario por email (incluir password que está en select: false)
    const usuario = await Usuario.findOne({ email: email.toLowerCase() })
      .select('+password');
    
    if (!usuario) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Verificar contraseña
    const passwordValido = await usuario.compararPassword(password);
    
    if (!passwordValido) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }
    
    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        message: 'Usuario inactivo. Contacte al administrador' 
      });
    }
    
    // Verificar que no esté baneado
    if (usuario.baneado) {
      return res.status(403).json({ 
        message: 'Usuario baneado. Motivo: ' + (usuario.motivoBaneo || 'No especificado')
      });
    }
    
    // Generar token
    const token = generarToken(usuario);
    
    // ✅ AGREGAR provincia y localidad a la respuesta
    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        provincia: usuario.provincia,
        localidad: usuario.localidad,
        rol: usuario.rol,
        qrCode: usuario.qrCode,
        fotoPerfil: usuario.fotoPerfil,
        activo: usuario.activo
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesión',
      error: error.message 
    });
  }
};

// @desc    Obtener usuario actual (perfil)
// @route   GET /api/auth/me
// @access  Privado
const obtenerPerfil = async (req, res) => {
  try {
    // req.usuario viene del middleware verificarToken
    const usuario = await Usuario.findById(req.userId)
      .populate('abonoActual')
      .populate('pruebaSalud');
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    res.json({
      usuario
    });
    
  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({ 
      message: 'Error al obtener perfil',
      error: error.message 
    });
  }
};

// @desc    Actualizar perfil del usuario actual
// @route   PUT /api/auth/me
// @access  Privado
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, fotoPerfil } = req.body;
    
    // Buscar el usuario actual para verificar rol
    const usuarioActual = await Usuario.findById(req.userId);
    
    if (!usuarioActual) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Preparar campos a actualizar
    const camposPermitidos = {};
    
    // Si es admin, puede cambiar nombre y apellido
    if (usuarioActual.rol === 'admin') {
      if (nombre) camposPermitidos.nombre = nombre;
      if (apellido) camposPermitidos.apellido = apellido;
    }
    
    // Si se intenta cambiar el email, verificar que no exista
    if (email && email.toLowerCase() !== usuarioActual.email) {
      const emailExiste = await Usuario.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.userId } 
      });
      
      if (emailExiste) {
        return res.status(400).json({ 
          message: 'El email ya está en uso por otro usuario' 
        });
      }
      
      camposPermitidos.email = email.toLowerCase();
    }
    
    // Actualizar otros campos permitidos
    if (telefono !== undefined) camposPermitidos.telefono = telefono;
    if (fotoPerfil !== undefined) camposPermitidos.fotoPerfil = fotoPerfil;
    
    // Usar findByIdAndUpdate para evitar disparar el middleware de password
    const usuario = await Usuario.findByIdAndUpdate(
      req.userId,
      camposPermitidos,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario
    });
    
  } catch (error) {
    console.error('Error en actualizarPerfil:', error);
    res.status(500).json({ 
      message: 'Error al actualizar perfil',
      error: error.message 
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/auth/cambiar-password
// @access  Privado
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    
    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ 
        message: 'Debe proporcionar la contraseña actual y la nueva' 
      });
    }
    
    if (passwordNuevo.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }
    
    // Buscar usuario con password
    const usuario = await Usuario.findById(req.userId).select('+password');
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar contraseña actual
    const passwordValido = await usuario.compararPassword(passwordActual);
    
    if (!passwordValido) {
      return res.status(401).json({ 
        message: 'Contraseña actual incorrecta' 
      });
    }
    
    // Actualizar contraseña (el middleware pre-save la hasheará)
    usuario.password = passwordNuevo;
    await usuario.save();
    
    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en cambiarPassword:', error);
    res.status(500).json({ 
      message: 'Error al cambiar contraseña',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword
};