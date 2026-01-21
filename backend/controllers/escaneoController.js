const { Escaneo, Usuario, Abono, PruebaSalud } = require('../models');

// @desc    Escanear código QR y validar acceso
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
    await escaneo.populate('usuario', 'nombre apellido dni qrCode fotoPerfil');
    await escaneo.populate('abono', 'tipoAbono fechaFin');
    await escaneo.populate('escaneadoPor', 'nombre apellido');
    
    // 👇 PREPARAR DATOS DEL USUARIO (SIEMPRE INCLUIR ABONO Y PRUEBA SALUD)
    const usuarioData = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      fotoPerfil: usuario.fotoPerfil,
      // SIEMPRE incluir info del abono (aunque esté vencido o no pagado)
      abono: usuario.abonoActual ? {
        tipo: usuario.abonoActual.tipoAbono,
        vence: usuario.abonoActual.fechaFin,
        diasRestantes: Math.ceil((usuario.abonoActual.fechaFin - new Date()) / (1000 * 60 * 60 * 24)),
        pagado: usuario.abonoActual.pagado
      } : null,
      // SIEMPRE incluir info de prueba de salud (aunque esté vencida)
      pruebaSalud: usuario.pruebaSalud ? {
        vence: usuario.pruebaSalud.fechaVencimiento,
        diasRestantes: Math.ceil((usuario.pruebaSalud.fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24))
      } : null
    };
    
    if (exitoso) {
      return res.json({
        exitoso: true,
        message: '✅ Acceso permitido',
        escaneo,
        usuario: usuarioData
      });
    } else {
      return res.status(403).json({
        exitoso: false,
        message: escaneo.motivoLegible,
        motivoRechazo,
        escaneo,
        usuario: usuarioData  // 👈 TAMBIÉN incluir en caso de rechazo
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
      fechaInicio,
      fechaFin,
      search
    } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (exitoso !== undefined) {
      filtros.exitoso = exitoso === 'true';
    }
    
    // Filtrar por rango de fechas
    if (fechaInicio || fechaFin) {
      filtros.fechaHora = {};
      
      if (fechaInicio) {
        // Crear fecha en formato UTC para evitar problemas de zona horaria
        const [year, month, day] = fechaInicio.split('-');
        const inicio = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
        filtros.fechaHora.$gte = inicio;
      }
      
      if (fechaFin) {
        // Crear fecha en formato UTC para evitar problemas de zona horaria
        const [year, month, day] = fechaFin.split('-');
        const fin = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
        filtros.fechaHora.$lte = fin;
      }
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
      .populate({
        path: 'usuario',
        select: 'nombre apellido dni',
        populate: {
          path: 'pruebaSalud',
          select: 'fechaVencimiento vigente'
        }
      })
      .populate('abono', 'tipoAbono fechaFin')
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
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    const escaneos = await Escaneo.find({
      fechaHora: {
        $gte: hoy,
        $lt: manana
      }
    })
    .populate('usuario', 'nombre apellido dni')
    .populate('escaneadoPor', 'nombre apellido')
    .sort({ fechaHora: -1 });
    
    const exitosos = escaneos.filter(e => e.exitoso).length;
    const rechazados = escaneos.filter(e => !e.exitoso).length;
    const total = escaneos.length;
    
    // ✅ Calcular porcentaje de éxito
    const porcentajeExito = total > 0 
      ? Math.round((exitosos / total) * 100) 
      : 0;
    
    res.json({
      total,
      exitosos,
      rechazados,
      porcentajeExito,
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
    
    const filtros = {};
    
    if (fechaInicio || fechaFin) {
      filtros.fechaHora = {};
      if (fechaInicio) {
        const [year, month, day] = fechaInicio.split('-');
        filtros.fechaHora.$gte = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
      }
      if (fechaFin) {
        const [year, month, day] = fechaFin.split('-');
        filtros.fechaHora.$lte = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
      }
    }
    
    const total = await Escaneo.countDocuments(filtros);
    const exitosos = await Escaneo.countDocuments({ ...filtros, exitoso: true });
    const rechazados = await Escaneo.countDocuments({ ...filtros, exitoso: false });
    
    // Contar por motivos de rechazo
    const motivosRechazo = await Escaneo.aggregate([
      { $match: { ...filtros, exitoso: false } },
      { $group: { _id: '$motivoRechazo', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      total,
      exitosos,
      rechazados,
      tasaExito: total > 0 ? ((exitosos / total) * 100).toFixed(2) : 0,
      motivosRechazo
    });
    
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

// @desc    Obtener reporte de rechazos por motivo
// @route   GET /api/escaneos/reportes/rechazos
// @access  Privado (Admin)
const obtenerReporteRechazos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const filtros = { exitoso: false };
    
    if (fechaInicio || fechaFin) {
      filtros.fechaHora = {};
      if (fechaInicio) {
        const [year, month, day] = fechaInicio.split('-');
        filtros.fechaHora.$gte = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
      }
      if (fechaFin) {
        const [year, month, day] = fechaFin.split('-');
        filtros.fechaHora.$lte = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
      }
    }
    
    const rechazos = await Escaneo.find(filtros)
      .populate('usuario', 'nombre apellido dni')
      .sort({ fechaHora: -1 });
    
    // Agrupar por motivo
    const porMotivo = {};
    rechazos.forEach(rechazo => {
      const motivo = rechazo.motivoRechazo || 'sin_motivo';
      if (!porMotivo[motivo]) {
        porMotivo[motivo] = [];
      }
      porMotivo[motivo].push(rechazo);
    });
    
    res.json({
      total: rechazos.length,
      porMotivo,
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

// @desc    Rechazar escaneo manualmente
// @route   PUT /api/escaneos/:id/rechazar
// @access  Privado (Admin)
const rechazarEscaneoManual = async (req, res) => {
  try {
    const { motivoRechazoManual } = req.body;
    
    if (!motivoRechazoManual || !motivoRechazoManual.trim()) {
      return res.status(400).json({ 
        message: 'El motivo del rechazo es obligatorio' 
      });
    }
    
    const escaneo = await Escaneo.findById(req.params.id);
    
    if (!escaneo) {
      return res.status(404).json({ 
        message: 'Escaneo no encontrado' 
      });
    }
    
    if (!escaneo.exitoso) {
      return res.status(400).json({ 
        message: 'Este escaneo ya está rechazado' 
      });
    }
    
    if (escaneo.rechazadoManualmente) {
      return res.status(400).json({ 
        message: 'Este escaneo ya fue modificado manualmente' 
      });
    }
    
    // Actualizar el escaneo
    escaneo.exitoso = false;
    escaneo.motivoRechazo = 'rechazo_manual';
    escaneo.motivoRechazoManual = motivoRechazoManual.trim();
    escaneo.rechazadoManualmente = true;
    escaneo.rechazadoPor = req.userId;
    escaneo.fechaRechazoManual = new Date();
    
    await escaneo.save();
    
    // Populate para la respuesta
    await escaneo.populate('usuario', 'nombre apellido dni');
    await escaneo.populate('rechazadoPor', 'nombre apellido');
    
    res.json({
      message: 'Escaneo modificado exitosamente',
      escaneo
    });
    
  } catch (error) {
    console.error('Error en rechazarEscaneoManual:', error);
    res.status(500).json({ 
      message: 'Error al rechazar escaneo',
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
  obtenerReporteRechazos,
  rechazarEscaneoManual
};

