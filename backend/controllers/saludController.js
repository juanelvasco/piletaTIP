const { PruebaSalud, Usuario } = require('../models');

// @desc    Crear o actualizar prueba de salud
// @route   POST /api/salud
// @access  Privado (Admin)
const crearOActualizarPrueba = async (req, res) => {
  try {
    const { usuarioId, notas } = req.body;
    
    if (!usuarioId) {
      return res.status(400).json({ 
        message: 'El ID del usuario es obligatorio' 
      });
    }
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Crear o actualizar usando el método del modelo
    const prueba = await PruebaSalud.crearOActualizar(
      usuarioId,
      req.userId, // Admin que carga la prueba
      notas
    );
    
    res.status(201).json({
      message: prueba.isNew ? 'Prueba de salud creada exitosamente' : 'Prueba de salud renovada exitosamente',
      prueba
    });
    
  } catch (error) {
    console.error('Error en crearOActualizarPrueba:', error);
    res.status(500).json({ 
      message: 'Error al crear/actualizar prueba de salud',
      error: error.message 
    });
  }
};

// @desc    Obtener todas las pruebas de salud
// @route   GET /api/salud
// @access  Privado (Admin)
const obtenerPruebas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      vigente,
      search
    } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (vigente !== undefined) {
      filtros.vigente = vigente === 'true';
    }
    
    // Búsqueda por usuario
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
    
    const pruebas = await PruebaSalud.find(filtros)
      .populate('usuario', 'nombre apellido email dni')
      .populate('cargadoPor', 'nombre apellido')
      .sort({ fechaPrueba: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PruebaSalud.countDocuments(filtros);
    
    res.json({
      pruebas,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error en obtenerPruebas:', error);
    res.status(500).json({ 
      message: 'Error al obtener pruebas de salud',
      error: error.message 
    });
  }
};

// @desc    Obtener prueba de salud por ID
// @route   GET /api/salud/:id
// @access  Privado (Admin o Usuario dueño)
const obtenerPruebaPorId = async (req, res) => {
  try {
    const prueba = await PruebaSalud.findById(req.params.id)
      .populate('usuario', 'nombre apellido email dni telefono')
      .populate('cargadoPor', 'nombre apellido');
    
    if (!prueba) {
      return res.status(404).json({ 
        message: 'Prueba de salud no encontrada' 
      });
    }
    
    // Si no es admin, verificar que sea su propia prueba
    if (req.usuario.rol !== 'admin' && prueba.usuario._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        message: 'No tiene permisos para ver esta prueba' 
      });
    }
    
    res.json({ prueba });
    
  } catch (error) {
    console.error('Error en obtenerPruebaPorId:', error);
    res.status(500).json({ 
      message: 'Error al obtener prueba de salud',
      error: error.message 
    });
  }
};

// @desc    Obtener mi prueba de salud (usuario)
// @route   GET /api/salud/mi-prueba
// @access  Privado (Usuario)
const obtenerMiPrueba = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.userId)
      .populate('pruebaSalud');
    
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    if (!usuario.pruebaSalud) {
      return res.status(404).json({ 
        message: 'No tiene una prueba de salud registrada' 
      });
    }
    
    res.json({ 
      prueba: usuario.pruebaSalud 
    });
    
  } catch (error) {
    console.error('Error en obtenerMiPrueba:', error);
    res.status(500).json({ 
      message: 'Error al obtener prueba de salud',
      error: error.message 
    });
  }
};

// @desc    Renovar prueba de salud
// @route   PUT /api/salud/:id/renovar
// @access  Privado (Admin)
const renovarPrueba = async (req, res) => {
  try {
    const { notas } = req.body;
    
    const prueba = await PruebaSalud.findById(req.params.id);
    
    if (!prueba) {
      return res.status(404).json({ 
        message: 'Prueba de salud no encontrada' 
      });
    }
    
    // Usar el método del modelo
    await prueba.renovar(req.userId, notas);
    
    res.json({
      message: 'Prueba de salud renovada exitosamente',
      prueba
    });
    
  } catch (error) {
    console.error('Error en renovarPrueba:', error);
    res.status(500).json({ 
      message: 'Error al renovar prueba de salud',
      error: error.message 
    });
  }
};

// @desc    Eliminar prueba de salud
// @route   DELETE /api/salud/:id
// @access  Privado (Admin)
const eliminarPrueba = async (req, res) => {
  try {
    const prueba = await PruebaSalud.findById(req.params.id);
    
    if (!prueba) {
      return res.status(404).json({ 
        message: 'Prueba de salud no encontrada' 
      });
    }
    
    // Quitar referencia del usuario
    await Usuario.findByIdAndUpdate(prueba.usuario, {
      pruebaSalud: null
    });
    
    // Eliminar la prueba
    await PruebaSalud.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Prueba de salud eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarPrueba:', error);
    res.status(500).json({ 
      message: 'Error al eliminar prueba de salud',
      error: error.message 
    });
  }
};

// @desc    Obtener pruebas pendientes de alerta
// @route   GET /api/salud/alertas/pendientes
// @access  Privado (Admin)
const obtenerAlertasPendientes = async (req, res) => {
  try {
    const { diasAntes = 2 } = req.query;
    
    const pruebas = await PruebaSalud.obtenerPendientesAlerta(parseInt(diasAntes));
    
    res.json({
      total: pruebas.length,
      pruebas
    });
    
  } catch (error) {
    console.error('Error en obtenerAlertasPendientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener alertas pendientes',
      error: error.message 
    });
  }
};

// @desc    Obtener pruebas vencidas
// @route   GET /api/salud/vencidas
// @access  Privado (Admin)
const obtenerPruebasVencidas = async (req, res) => {
  try {
    const pruebas = await PruebaSalud.obtenerVencidas();
    
    res.json({
      total: pruebas.length,
      pruebas
    });
    
  } catch (error) {
    console.error('Error en obtenerPruebasVencidas:', error);
    res.status(500).json({ 
      message: 'Error al obtener pruebas vencidas',
      error: error.message 
    });
  }
};

// @desc    Actualizar pruebas vencidas (marcarlas como no vigentes)
// @route   PUT /api/salud/actualizar-vencidas
// @access  Privado (Admin)
const actualizarPruebasVencidas = async (req, res) => {
  try {
    const resultado = await PruebaSalud.actualizarVencidas();
    
    res.json({
      message: 'Pruebas vencidas actualizadas exitosamente',
      pruebasActualizadas: resultado.modifiedCount
    });
    
  } catch (error) {
    console.error('Error en actualizarPruebasVencidas:', error);
    res.status(500).json({ 
      message: 'Error al actualizar pruebas vencidas',
      error: error.message 
    });
  }
};

// @desc    Obtener estadísticas de pruebas de salud
// @route   GET /api/salud/estadisticas
// @access  Privado (Admin)
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await PruebaSalud.obtenerEstadisticas();
    
    res.json(estadisticas);
    
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

module.exports = {
  crearOActualizarPrueba,
  obtenerPruebas,
  obtenerPruebaPorId,
  obtenerMiPrueba,
  renovarPrueba,
  eliminarPrueba,
  obtenerAlertasPendientes,
  obtenerPruebasVencidas,
  actualizarPruebasVencidas,
  obtenerEstadisticas
};