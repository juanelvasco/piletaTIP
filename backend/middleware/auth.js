const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Acceso denegado. No se proporcionó token de autenticación.' 
      });
    }
    
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({ 
        message: 'Token inválido. Usuario no encontrado.' 
      });
    }
    
    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        message: 'Usuario inactivo. Contacte al administrador.' 
      });
    }
    
    // Verificar que no esté baneado
    if (usuario.baneado) {
      return res.status(403).json({ 
        message: 'Usuario baneado. Motivo: ' + (usuario.motivoBaneo || 'No especificado') 
      });
    }
    
    // Agregar usuario al request para usarlo en las rutas
    req.usuario = usuario;
    req.userId = usuario._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado. Por favor, inicie sesión nuevamente.' 
      });
    }
    
    console.error('Error en verificarToken:', error);
    res.status(500).json({ 
      message: 'Error al verificar autenticación.',
      error: error.message 
    });
  }
};

// Middleware para verificar que el usuario sea admin
const verificarAdmin = (req, res, next) => {
  // Este middleware debe usarse DESPUÉS de verificarToken
  if (!req.usuario) {
    return res.status(401).json({ 
      message: 'No autenticado. Use verificarToken primero.' 
    });
  }
  
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  
  next();
};

// Middleware para verificar que el usuario sea enfermero
const verificarEnfermero = (req, res, next) => {
  // Este middleware debe usarse DESPUÉS de verificarToken
  if (!req.usuario) {
    return res.status(401).json({ 
      message: 'No autenticado. Use verificarToken primero.' 
    });
  }
  
  if (req.usuario.rol !== 'enfermero') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de enfermero.' 
    });
  }
  
  next();
};

// Middleware para verificar que el usuario sea admin o enfermero
const verificarAdminOEnfermero = (req, res, next) => {
  // Este middleware debe usarse DESPUÉS de verificarToken
  if (!req.usuario) {
    return res.status(401).json({ 
      message: 'No autenticado. Use verificarToken primero.' 
    });
  }
  
  if (!['admin', 'enfermero'].includes(req.usuario.rol)) {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requieren permisos de administrador o enfermero.' 
    });
  }
  
  next();
};

// Middleware opcional: verificar token pero no requiere autenticación
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id);
      
      if (usuario && usuario.activo && !usuario.baneado) {
        req.usuario = usuario;
        req.userId = usuario._id;
      }
    }
    
    next();
  } catch (error) {
    // Si falla, simplemente continúa sin usuario
    next();
  }
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarEnfermero,
  verificarAdminOEnfermero,
  verificarTokenOpcional
};