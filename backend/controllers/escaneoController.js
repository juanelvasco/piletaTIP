const { Escaneo, Usuario, Abono, PruebaSalud } = require('../models');

// @desc    Escanear QR y validar acceso
// @route   POST /api/escaneos/escanear
// @access  Privado (Admin)
const escanearQR = async (req, res) => {
  try {
    const { qrCode, notas } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ 
        message: 'El código QR es obligatorio' 
      });
    }
    
    // Buscar usuario por QR
    const usuario = await Usuario.findOne({ qrCode })
      .populate('abonoActual')
      .populate('pruebaSalud');
    
    if (!usuario) {
      // Registrar escaneo fallido
      await Escaneo.registrarAcceso({
        usuarioId: null,
        abonoId: null,
        exitoso: false,
        motivoRechazo: 'qr_invalido',
        adminId: req.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        notas
      });
      
      return res.status(404).json({ 
        exitoso: false,
        message: 'Código QR inválido o no existe',
        motivoRechazo: 'qr_invalido'
      });
    }
    
    // VALIDACIONES
    let exitoso = true;
    let motivoRechazo = null;
    
    // 1. Verificar que el usuario esté activo
    if (!usuario.activo) {
      exitoso = false;
      motivoRechazo = 'usuario_inactivo';
    }
    
    // 2. Verificar que no esté baneado
    if (usuario.baneado) {
      exitoso = false;
      motivoRechazo = 'usuario_baneado';
    }
    
    // 3. Verificar que tenga abono
    if (exitoso && !usuario.abonoActual) {
      exitoso = false;
      motivoRechazo = 'sin_abono';
    }
    
    // 4. Verificar que el abono esté pagado
    if (exitoso && usuario.abonoActual && !usuario.abonoActual.pagado) {
      exitoso = false;
      motivoRechazo = 'abono_no_pagado';
    }
    
    // 5. Verificar que el abono esté vigente
    if (exitoso && usuario.abonoActual) {
      const hoy = new Date();
      if (usuario.abonoActual.fechaFin < hoy) {
        exitoso = false;
        motivoRechazo = 'abono_vencido';
      }
    }
    
    // 6. Verificar que tenga prueba de salud
    if (exitoso && !usuario.pruebaSalud) {
      exitoso = false;
      motivoRechazo = 'sin_prueba_salud';
    }
    
    // 7. Verificar que la prueba de salud esté vigente
    if (exitoso && usuario.pruebaSalud) {
      const hoy = new Date();
      if (usuario.pruebaSalud.fechaVencimiento < hoy) {
        exitoso = false;
        motivoRechazo = 'prueba_salud_vencida';
      }
    }
    
    // Registrar el escaneo
    const escaneo = await Escaneo.registrarAcceso({
      usuarioId: usuario._id,
      abonoId: usuario.abonoActual ? usuario.abonoActual._id : null,
      exitoso,
      motivoRechazo,
      adminId: req.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      notas
    });
    
    // Populate para la respuesta
    await escaneo.populate('usuario', 'nombre apellido dni qrCode');
    await escaneo.populate('abono', 'tipoAbono fechaFin');
    await escaneo.populate('escaneadoPor', 'nombre apellido');
    
    if (exitoso) {
      return res.json({
        exitoso: true,
        message: '✅ Acceso permitido',
        escaneo,
        usuario: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: usuario.dni,
          abono: usuario.abonoActual ? {
            tipo: usuario.abonoActual.tipoAbono,
            vence: usuario.abonoActual.fechaFin,
            diasRestantes: Math.ceil((usuario.abonoActual.fechaFin - new Date()) / (1000 * 60 * 60 * 24))
          } : null,
          pruebaSalud: usuario.pruebaSalud ? {
            vence: usuario.pruebaSalud.fechaVencimiento,
            diasRestantes: Math.ceil((usuario.pruebaSalud.fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24))
          } : null
        }
      });
    } else {
      return res.status(403).json({
        exitoso: false,
        message: escaneo.motivoLegible,
        motivoRechazo,
        escaneo,
        usuario: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: usuario.dni
        }
      });
    }
    
  } catch (error) {
    console.error('Error en escanearQR:', error);
    res.status(500).json({ 
      message: 'Error al procesar escaneo',
      error: error.message 
    });
  }
};

// @desc    Obtener todos los escaneos
// @route   GET /api/escaneos
// @access  Privado (Admin)
const obtenerEscaneos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      exitoso,
      fecha,
      search
    } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (exitoso !== undefined) {
      filtros.exitoso = exitoso === 'true';
    }
    
    // Filtrar por fecha (día específico)
    if (fecha) {
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);
      
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);
      
      filtros.fechaHora = {
        $gte: inicioDia,
        $lte: finDia
      };
    }
    
    // Búsqueda por usuario
    if (search) {
      const usuarios = await Usuario.find({
        $or: [
          { nombre: { $regex: search, $options: 'i' } },
          { apellido: { $regex: search, $options: 'i' } },
          { dni: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filtros.usuario = { $in: usuarios.map(u => u._id) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const escaneos = await Escaneo.find(filtros)
      .populate('usuario', 'nombre apellido dni')
      .populate('escaneadoPor', 'nombre apellido')
      .sort({ fechaHora: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Escaneo.countDocuments(filtros);
    
    res.json({
      escaneos,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error en obtenerEscaneos:', error);
    res.status(500).json({ 
      message: 'Error al obtener escaneos',
      error: error.message 
    });
  }
};

// @desc    Obtener escaneo por ID
// @route   GET /api/escaneos/:id
// @access  Privado (Admin)
const obtenerEscaneoPorId = async (req, res) => {
  try {
    const escaneo = await Escaneo.findById(req.params.id)
      .populate('usuario', 'nombre apellido email dni telefono')
      .populate('abono', 'tipoAbono fechaInicio fechaFin precio pagado')
      .populate('escaneadoPor', 'nombre apellido email');
    
    if (!escaneo) {
      return res.status(404).json({ 
        message: 'Escaneo no encontrado' 
      });
    }
    
    res.json({ escaneo });
    
  } catch (error) {
    console.error('Error en obtenerEscaneoPorId:', error);
    res.status(500).json({ 
      message: 'Error al obtener escaneo',
      error: error.message 
    });
  }
};

// @desc    Obtener historial de un usuario
// @route   GET /api/escaneos/usuario/:usuarioId
// @access  Privado (Admin)
const obtenerHistorialUsuario = async (req, res) => {
  try {
    const { limite = 50 } = req.query;
    
    const escaneos = await Escaneo.historialUsuario(
      req.params.usuarioId,
      parseInt(limite)
    );
    
    res.json({
      total: escaneos.length,
      escaneos
    });
    
  } catch (error) {
    console.error('Error en obtenerHistorialUsuario:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial',
      error: error.message 
    });
  }
};

// @desc    Obtener mi historial de escaneos
// @route   GET /api/escaneos/mi-historial
// @access  Privado (Usuario)
const obtenerMiHistorial = async (req, res) => {
  try {
    const { limite = 50 } = req.query;
    
    const escaneos = await Escaneo.historialUsuario(
      req.userId,
      parseInt(limite)
    );
    
    res.json({
      total: escaneos.length,
      escaneos
    });
    
  } catch (error) {
    console.error('Error en obtenerMiHistorial:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial',
      error: error.message 
    });
  }
};

// @desc    Obtener escaneos del día
// @route   GET /api/escaneos/hoy
// @access  Privado (Admin)
const obtenerEscaneosHoy = async (req, res) => {
  try {
    const escaneos = await Escaneo.accesosDia();
    
    // Calcular estadísticas del día
    const exitosos = escaneos.filter(e => e.exitoso).length;
    const rechazados = escaneos.filter(e => !e.exitoso).length;
    
    res.json({
      total: escaneos.length,
      exitosos,
      rechazados,
      porcentajeExito: escaneos.length > 0 
        ? ((exitosos / escaneos.length) * 100).toFixed(2)
        : 0,
      escaneos
    });
    
  } catch (error) {
    console.error('Error en obtenerEscaneosHoy:', error);
    res.status(500).json({ 
      message: 'Error al obtener escaneos de hoy',
      error: error.message 
    });
  }
};

// @desc    Obtener estadísticas de escaneos
// @route   GET /api/escaneos/estadisticas
// @access  Privado (Admin)
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const estadisticas = await Escaneo.obtenerEstadisticas({
      fechaInicio,
      fechaFin
    });
    
    res.json(estadisticas);
    
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

// @desc    Obtener rechazos por motivo
// @route   GET /api/escaneos/reportes/rechazos
// @access  Privado (Admin)
const obtenerReporteRechazos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        message: 'Se requieren fechaInicio y fechaFin' 
      });
    }
    
    const rechazos = await Escaneo.rechazosPorMotivo(fechaInicio, fechaFin);
    
    res.json({
      periodo: {
        desde: fechaInicio,
        hasta: fechaFin
      },
      rechazos
    });
    
  } catch (error) {
    console.error('Error en obtenerReporteRechazos:', error);
    res.status(500).json({ 
      message: 'Error al obtener reporte de rechazos',
      error: error.message 
    });
  }
};

module.exports = {
  escanearQR,
  obtenerEscaneos,
  obtenerEscaneoPorId,
  obtenerHistorialUsuario,
  obtenerMiHistorial,
  obtenerEscaneosHoy,
  obtenerEstadisticas,
  obtenerReporteRechazos
};