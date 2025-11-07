const { Usuario, Escaneo } = require('../models');

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Privado (Admin)
const obtenerUsuarios = async (req, res) => {
  try {
    // Obtener parámetros de query
    const {
      page = 1,
      limit = 10,
      search = '',
      rol,
      activo,
      baneado,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    // Búsqueda por nombre, apellido, email o DNI
    if (search) {
      filtros.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { apellido: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { dni: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtros adicionales
    if (rol) filtros.rol = rol;
    if (activo !== undefined) filtros.activo = activo === 'true';
    if (baneado !== undefined) filtros.baneado = baneado === 'true';
    
    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener usuarios con paginación
    const usuarios = await Usuario.find(filtros)
      .select('-password')
      .populate('abonoActual', 'tipoAbono fechaFin activo pagado')
      .populate('pruebaSalud', 'fechaVencimiento vigente')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total de documentos
    const total = await Usuario.countDocuments(filtros);
    
    res.json({
      usuarios,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    res.status(500).json({ 
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/users/:id
// @access  Privado (Admin)
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select('-password')
      .populate('abonoActual')
      .populate('pruebaSalud');
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Obtener últimos 10 escaneos del usuario
    const escaneos = await Escaneo.find({ usuario: usuario._id })
      .sort({ fechaHora: -1 })
      .limit(10)
      .populate('escaneadoPor', 'nombre apellido');
    
    res.json({
      usuario,
      ultimosEscaneos: escaneos
    });
    
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId:', error);
    res.status(500).json({ 
      message: 'Error al obtener usuario',
      error: error.message 
    });
  }
};

// @desc    Crear nuevo usuario (por admin)
// @route   POST /api/users
// @access  Privado (Admin)
const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, dni, telefono, rol, fotoPerfil } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !password || !dni) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: nombre, apellido, email, password, dni' 
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
    
    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email: email.toLowerCase(),
      password,
      dni,
      telefono,
      rol: rol || 'usuario',
      fotoPerfil: fotoPerfil || null
    });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        rol: usuario.rol,
        qrCode: usuario.qrCode,
        fotoPerfil: usuario.fotoPerfil,
        activo: usuario.activo
      }
    });
    
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación',
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al crear usuario',
      error: error.message 
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Privado (Admin)
const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, dni, telefono, rol, activo, fotoPerfil } = req.body;
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Si se intenta cambiar el email, verificar que no exista
    if (email && email.toLowerCase() !== usuario.email) {
      const emailExiste = await Usuario.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id } 
      });
      
      if (emailExiste) {
        return res.status(400).json({ 
          message: 'El email ya está en uso por otro usuario' 
        });
      }
    }
    
    // Si se intenta cambiar el DNI, verificar que no exista
    if (dni && dni !== usuario.dni) {
      const dniExiste = await Usuario.findOne({ 
        dni,
        _id: { $ne: req.params.id } 
      });
      
      if (dniExiste) {
        return res.status(400).json({ 
          message: 'El DNI ya está en uso por otro usuario' 
        });
      }
    }
    
    // Actualizar campos básicos
    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email) usuario.email = email.toLowerCase();
    if (dni) usuario.dni = dni;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;
    if (fotoPerfil !== undefined) usuario.fotoPerfil = fotoPerfil;
    
    // Solo actualizar password si se envió uno nuevo
    if (password && password.trim() !== '') {
      usuario.password = password;
    }
    
    await usuario.save();
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono,
        rol: usuario.rol,
        fotoPerfil: usuario.fotoPerfil,
        activo: usuario.activo,
        baneado: usuario.baneado
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Error de validación',
        errores 
      });
    }
    
    res.status(500).json({ 
      message: 'Error al actualizar usuario',
      error: error.message 
    });
  }
};

// @desc    Banear/Desbanear usuario
// @route   PUT /api/users/:id/banear
// @access  Privado (Admin)
const toggleBanearUsuario = async (req, res) => {
  try {
    const { baneado, motivoBaneo } = req.body;
    
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // No permitir banear a otro admin
    if (usuario.rol === 'admin') {
      return res.status(403).json({ 
        message: 'No se puede banear a un administrador' 
      });
    }
    
    usuario.baneado = baneado;
    
    if (baneado) {
      usuario.motivoBaneo = motivoBaneo || 'No especificado';
      usuario.fechaBaneo = new Date();
    } else {
      usuario.motivoBaneo = null;
      usuario.fechaBaneo = null;
    }
    
    await usuario.save();
    
    res.json({
      message: baneado ? 'Usuario baneado exitosamente' : 'Usuario desbaneado exitosamente',
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        dni: usuario.dni,
        rol: usuario.rol,
        fotoPerfil: usuario.fotoPerfil,
        activo: usuario.activo,
        baneado: usuario.baneado,
        motivoBaneo: usuario.motivoBaneo,
        fechaBaneo: usuario.fechaBaneo
      }
    });
    
  } catch (error) {
    console.error('Error en toggleBanearUsuario:', error);
    res.status(500).json({ 
      message: 'Error al modificar estado de baneo',
      error: error.message 
    });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/users/:id
// @access  Privado (Admin)
const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // No permitir eliminar a otro admin
    if (usuario.rol === 'admin') {
      return res.status(403).json({ 
        message: 'No se puede eliminar a un administrador' 
      });
    }
    
    // Soft delete: marcar como inactivo
    usuario.activo = false;
    await usuario.save();
    
    // Si querés hard delete (eliminar permanentemente):
    // await Usuario.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Usuario eliminado exitosamente (marcado como inactivo)'
    });
    
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    res.status(500).json({ 
      message: 'Error al eliminar usuario',
      error: error.message 
    });
  }
};

// @desc    Obtener estadísticas de usuarios
// @route   GET /api/users/estadisticas
// @access  Privado (Admin)
const obtenerEstadisticas = async (req, res) => {
  try {
    const total = await Usuario.countDocuments();
    const activos = await Usuario.countDocuments({ activo: true });
    const baneados = await Usuario.countDocuments({ baneado: true });
    const admins = await Usuario.countDocuments({ rol: 'admin' });
    const usuarios = await Usuario.countDocuments({ rol: 'usuario' });
    const conAbono = await Usuario.countDocuments({ abonoActual: { $ne: null } });
    
    res.json({
      total,
      activos,
      inactivos: total - activos,
      baneados,
      admins,
      usuarios,
      conAbono,
      sinAbono: total - conAbono
    });
    
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  toggleBanearUsuario,
  eliminarUsuario,
  obtenerEstadisticas
};