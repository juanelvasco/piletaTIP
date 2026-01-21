const { Abono, Usuario, Configuracion } = require('../models');

// @desc    Crear nuevo abono
// @route   POST /api/abonos
// @access  Privado (Admin)
const crearAbono = async (req, res) => {
  try {
    const { usuarioId, tipoAbono, precio } = req.body;
    
    // Validar campos obligatorios
    if (!usuarioId || !tipoAbono) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: usuarioId, tipoAbono' 
      });
    }
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Obtener precio de la configuración si no se especificó
    let precioFinal = precio;
    if (!precio) {
      const config = await Configuracion.obtener();
      precioFinal = config.obtenerPrecio(tipoAbono);
    }
    
    if (!precioFinal) {
      return res.status(400).json({ 
        message: 'Tipo de abono inválido o precio no configurado' 
      });
    }
    
    // Crear el abono usando el método estático
    const abono = await Abono.crearAbono(usuarioId, tipoAbono, precioFinal);
    
    res.status(201).json({
      message: 'Abono creado exitosamente',
      abono
    });
    
  } catch (error) {
    console.error('Error en crearAbono:', error);
    res.status(500).json({ 
      message: 'Error al crear abono',
      error: error.message 
    });
  }
};

// @desc    Obtener todos los abonos
// @route   GET /api/abonos
// @access  Privado (Admin)
const obtenerAbonos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      tipoAbono,
      pagado,
      activo,
      search
    } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (tipoAbono) filtros.tipoAbono = tipoAbono;
    if (pagado !== undefined) filtros.pagado = pagado === 'true';
    if (activo !== undefined) filtros.activo = activo === 'true';
    
    // Búsqueda por usuario (nombre, apellido, email, dni)
    if (search) {
      const usuarios = await Usuario.find({
        $or: [
          { nombre: { $regex: search, $options: 'i' } },
          { apellido: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { dni: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filtros.usuario = { $in: usuarios.map(u => u._id) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const abonos = await Abono.find(filtros)
      .populate('usuario', 'nombre apellido email dni')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Abono.countDocuments(filtros);
    
    res.json({
      abonos,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error en obtenerAbonos:', error);
    res.status(500).json({ 
      message: 'Error al obtener abonos',
      error: error.message 
    });
  }
};

// @desc    Obtener abono por ID
// @route   GET /api/abonos/:id
// @access  Privado (Admin o Usuario dueño)
const obtenerAbonoPorId = async (req, res) => {
  try {
    const abono = await Abono.findById(req.params.id)
      .populate('usuario', 'nombre apellido email dni telefono');
    
    if (!abono) {
      return res.status(404).json({ 
        message: 'Abono no encontrado' 
      });
    }
    
    // Si no es admin, verificar que sea su propio abono
    if (req.usuario.rol !== 'admin' && abono.usuario._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        message: 'No tiene permisos para ver este abono' 
      });
    }
    
    res.json({ abono });
    
  } catch (error) {
    console.error('Error en obtenerAbonoPorId:', error);
    res.status(500).json({ 
      message: 'Error al obtener abono',
      error: error.message 
    });
  }
};

// @desc    Obtener abono actual del usuario logueado
// @route   GET /api/abonos/mi-abono
// @access  Privado (Usuario)
const obtenerMiAbono = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.userId)
      .populate('abonoActual');
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    if (!usuario.abonoActual) {
      return res.status(404).json({ 
        message: 'No tiene un abono asignado actualmente' 
      });
    }
    
    res.json({ 
      abono: usuario.abonoActual 
    });
    
  } catch (error) {
    console.error('Error en obtenerMiAbono:', error);
    res.status(500).json({ 
      message: 'Error al obtener abono',
      error: error.message 
    });
  }
};

// @desc    Obtener historial de abonos del usuario
// @route   GET /api/abonos/mi-historial
// @access  Privado (Usuario)
const obtenerMiHistorial = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const abonos = await Abono.find({ usuario: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Abono.countDocuments({ usuario: req.userId });
    
    res.json({
      abonos,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error en obtenerMiHistorial:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial',
      error: error.message 
    });
  }
};

// @desc    Actualizar abono
// @route   PUT /api/abonos/:id
// @access  Privado (Admin)
const actualizarAbono = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, precio, metodoPago, notas } = req.body;
    
    const abono = await Abono.findById(req.params.id);
    
    if (!abono) {
      return res.status(404).json({ 
        message: 'Abono no encontrado' 
      });
    }
    
    // Actualizar campos
    if (fechaInicio) abono.fechaInicio = fechaInicio;
    if (fechaFin) abono.fechaFin = fechaFin;
    if (precio) abono.precio = precio;
    if (metodoPago) abono.metodoPago = metodoPago;
    if (notas !== undefined) abono.notas = notas;
    
    await abono.save();
    
    res.json({
      message: 'Abono actualizado exitosamente',
      abono
    });
    
  } catch (error) {
    console.error('Error en actualizarAbono:', error);
    res.status(500).json({ 
      message: 'Error al actualizar abono',
      error: error.message 
    });
  }
};

// @desc    Marcar abono como pagado
// @route   PUT /api/abonos/:id/pagar
// @access  Privado (Admin)
const marcarComoPagado = async (req, res) => {
  try {
    const { metodoPago, mercadoPagoId } = req.body;
    
    if (!metodoPago) {
      return res.status(400).json({ 
        message: 'El método de pago es obligatorio' 
      });
    }
    
    const abono = await Abono.findById(req.params.id);
    
    if (!abono) {
      return res.status(404).json({ 
        message: 'Abono no encontrado' 
      });
    }
    
    if (abono.pagado) {
      return res.status(400).json({ 
        message: 'El abono ya está pagado' 
      });
    }
    
    // Usar el método del modelo
    await abono.marcarComoPagado(metodoPago, mercadoPagoId);
    
    res.json({
      message: 'Abono marcado como pagado exitosamente',
      abono
    });
    
  } catch (error) {
    console.error('Error en marcarComoPagado:', error);
    res.status(500).json({ 
      message: 'Error al marcar abono como pagado',
      error: error.message 
    });
  }
};

// @desc    Eliminar abono
// @route   DELETE /api/abonos/:id
// @access  Privado (Admin)
const eliminarAbono = async (req, res) => {
  try {
    const abono = await Abono.findById(req.params.id);
    
    if (!abono) {
      return res.status(404).json({ 
        message: 'Abono no encontrado' 
      });
    }
    
    // Si era el abono actual del usuario, quitarlo
    await Usuario.findByIdAndUpdate(abono.usuario, {
      abonoActual: null
    });
    
    // Eliminar el abono
    await Abono.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Abono eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarAbono:', error);
    res.status(500).json({ 
      message: 'Error al eliminar abono',
      error: error.message 
    });
  }
};

// @desc    Obtener reporte de ventas
// @route   GET /api/abonos/reportes/ventas
// @access  Privado (Admin)
const obtenerReporteVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const filtros = { pagado: true };
    
    if (fechaInicio && fechaFin) {
      filtros.fechaPago = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }
    
    // Estadísticas generales
    const totalVentas = await Abono.countDocuments(filtros);
    const totalRecaudado = await Abono.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' }
        }
      }
    ]);
    
    // Ventas por tipo de abono
    const ventasPorTipo = await Abono.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: '$tipoAbono',
          cantidad: { $sum: 1 },
          totalRecaudado: { $sum: '$precio' }
        }
      },
      {
        $sort: { totalRecaudado: -1 }
      }
    ]);
    
    // Ventas por método de pago
    const ventasPorMetodo = await Abono.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: '$metodoPago',
          cantidad: { $sum: 1 },
          totalRecaudado: { $sum: '$precio' }
        }
      }
    ]);
    
    res.json({
      totalVentas,
      totalRecaudado: totalRecaudado.length > 0 ? totalRecaudado[0].total : 0,
      ventasPorTipo,
      ventasPorMetodo,
      periodo: fechaInicio && fechaFin ? {
        desde: fechaInicio,
        hasta: fechaFin
      } : null
    });
    
  } catch (error) {
    console.error('Error en obtenerReporteVentas:', error);
    res.status(500).json({ 
      message: 'Error al obtener reporte de ventas',
      error: error.message 
    });
  }
};

// @desc    Obtener estadísticas de abonos
// @route   GET /api/abonos/estadisticas
// @access  Privado (Admin)
const obtenerEstadisticas = async (req, res) => {
  try {
    const total = await Abono.countDocuments();
    const activos = await Abono.countDocuments({ activo: true });
    const pagados = await Abono.countDocuments({ pagado: true });
    const pendientes = await Abono.countDocuments({ pagado: false });
    
    // Abonos próximos a vencer (7 días)
    const proximosVencer = new Date();
    proximosVencer.setDate(proximosVencer.getDate() + 7);
    
    const porVencer = await Abono.countDocuments({
      activo: true,
      fechaFin: {
        $gte: new Date(),
        $lte: proximosVencer
      }
    });
    
    // Total recaudado
    const recaudacion = await Abono.aggregate([
      { $match: { pagado: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$precio' }
        }
      }
    ]);
    
    res.json({
      total,
      activos,
      inactivos: total - activos,
      pagados,
      pendientes,
      porVencer,
      totalRecaudado: recaudacion.length > 0 ? recaudacion[0].total : 0
    });
    
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

// @desc    Obtener tipos de abono únicos (tanto activos como históricos)
// @route   GET /api/abonos/tipos-unicos
// @access  Private/Admin
const obtenerTiposUnicos = async (req, res) => {
  try {
    // Obtener todos los tipos únicos de abonos existentes en la BD
    const tiposHistoricos = await Abono.distinct('tipoAbono');
    
    // Obtener tipos activos de la configuración
    const config = await Configuracion.obtener();
    const tiposActivos = config.tiposAbono
      .filter(t => t.activo)
      .map(t => ({ id: t.id, nombre: t.nombre, activo: true }));
    
    // Crear mapa para evitar duplicados y combinar info
    const tiposMap = {};
    
    // Agregar tipos activos primero
    tiposActivos.forEach(tipo => {
      tiposMap[tipo.id] = tipo;
    });
    
    // Agregar tipos históricos que no estén en activos
    tiposHistoricos.forEach(tipoId => {
      if (!tiposMap[tipoId]) {
        // Buscar si existe en configuración pero está inactivo
        const tipoConfig = config.tiposAbono.find(t => t.id === tipoId);
        
        tiposMap[tipoId] = {
          id: tipoId,
          nombre: tipoConfig ? tipoConfig.nombre : tipoId,
          activo: false,
          historico: true
        };
      }
    });
    
    // Convertir a array y ordenar
    const tipos = Object.values(tiposMap).sort((a, b) => {
      // Primero activos, luego históricos
      if (a.activo && !b.activo) return -1;
      if (!a.activo && b.activo) return 1;
      // Alfabéticamente por nombre
      return a.nombre.localeCompare(b.nombre);
    });
    
    res.json({
      success: true,
      tipos
    });
  } catch (error) {
    console.error('Error al obtener tipos únicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de abono',
      error: error.message
    });
  }
};

module.exports = {
  crearAbono,
  obtenerAbonos,
  obtenerAbonoPorId,
  obtenerMiAbono,
  obtenerMiHistorial,
  actualizarAbono,
  marcarComoPagado,
  eliminarAbono,
  obtenerReporteVentas,
  obtenerEstadisticas,
  obtenerTiposUnicos
};