// backend/controllers/configuracionController.js

const Configuracion = require('../models/Configuracion');

// @desc    Obtener configuración actual
// @route   GET /api/configuracion
// @access  Public
exports.obtenerConfiguracion = async (req, res) => {
  try {
    const config = await Configuracion.obtener();
    
    res.json({
      success: true,
      configuracion: {
        tiposAbono: config.tiposAbono,
        pruebaSalud: config.pruebaSalud,
        abonos: config.abonos,
        sistema: config.sistema,
        ultimaActualizacion: config.ultimaActualizacion
      }
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración'
    });
  }
};

// @desc    Agregar nuevo tipo de abono
// @route   POST /api/configuracion/tipos-abono
// @access  Private/Admin
exports.agregarTipoAbono = async (req, res) => {
  try {
    const { nombre, precio, duracionDias, descripcion } = req.body;
    
    // Validaciones
    if (!nombre || !precio || !duracionDias) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y duración son obligatorios'
      });
    }
    
    if (precio < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio no puede ser negativo'
      });
    }
    
    if (duracionDias < 1) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser al menos 1 día'
      });
    }
    
    const config = await Configuracion.obtener();
    
    // Generar ID único
    const id = nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
      .replace(/^-+|-+$/g, ''); // Quitar guiones al inicio/fin
    
    // Obtener orden máximo
    const maxOrden = config.tiposAbono.reduce((max, t) => Math.max(max, t.orden || 0), 0);
    
    await config.agregarTipoAbono({
      id,
      nombre,
      precio,
      duracionDias,
      descripcion: descripcion || '',
      activo: true,
      orden: maxOrden + 1
    });
    
    res.json({
      success: true,
      message: 'Tipo de abono agregado correctamente',
      tiposAbono: config.tiposAbono
    });
  } catch (error) {
    console.error('Error al agregar tipo de abono:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al agregar tipo de abono'
    });
  }
};

// @desc    Actualizar tipo de abono
// @route   PUT /api/configuracion/tipos-abono/:id
// @access  Private/Admin
exports.actualizarTipoAbono = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, duracionDias, descripcion, activo } = req.body;
    
    const config = await Configuracion.obtener();
    
    const datosActualizados = {};
    if (nombre !== undefined) datosActualizados.nombre = nombre;
    if (precio !== undefined) {
      if (precio < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio no puede ser negativo'
        });
      }
      datosActualizados.precio = precio;
    }
    if (duracionDias !== undefined) {
      if (duracionDias < 1) {
        return res.status(400).json({
          success: false,
          message: 'La duración debe ser al menos 1 día'
        });
      }
      datosActualizados.duracionDias = duracionDias;
    }
    if (descripcion !== undefined) datosActualizados.descripcion = descripcion;
    if (activo !== undefined) datosActualizados.activo = activo;
    
    await config.actualizarTipoAbono(id, datosActualizados);
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    await config.save();
    
    res.json({
      success: true,
      message: 'Tipo de abono actualizado correctamente',
      tiposAbono: config.tiposAbono
    });
  } catch (error) {
    console.error('Error al actualizar tipo de abono:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar tipo de abono'
    });
  }
};

// @desc    Eliminar tipo de abono
// @route   DELETE /api/configuracion/tipos-abono/:id
// @access  Private/Admin
exports.eliminarTipoAbono = async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await Configuracion.obtener();
    
    // Verificar que no sea el único tipo activo
    const tiposActivos = config.tiposAbono.filter(t => t.activo);
    if (tiposActivos.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar el último tipo de abono activo'
      });
    }
    
    await config.eliminarTipoAbono(id);
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    await config.save();
    
    res.json({
      success: true,
      message: 'Tipo de abono eliminado correctamente',
      tiposAbono: config.tiposAbono
    });
  } catch (error) {
    console.error('Error al eliminar tipo de abono:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar tipo de abono'
    });
  }
};

// @desc    Reordenar tipos de abono
// @route   PUT /api/configuracion/tipos-abono/reordenar
// @access  Private/Admin
exports.reordenarTiposAbono = async (req, res) => {
  try {
    const { orden } = req.body; // Array de IDs en el orden deseado
    
    if (!Array.isArray(orden)) {
      return res.status(400).json({
        success: false,
        message: 'El orden debe ser un array de IDs'
      });
    }
    
    const config = await Configuracion.obtener();
    
    // Actualizar el orden
    orden.forEach((id, index) => {
      const tipo = config.tiposAbono.find(t => t.id === id);
      if (tipo) {
        tipo.orden = index + 1;
      }
    });
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    await config.save();
    
    res.json({
      success: true,
      message: 'Orden actualizado correctamente',
      tiposAbono: config.tiposAbono
    });
  } catch (error) {
    console.error('Error al reordenar tipos de abono:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al reordenar tipos de abono'
    });
  }
};

// @desc    Actualizar configuración de sistema
// @route   PUT /api/configuracion/sistema
// @access  Private/Admin
exports.actualizarSistema = async (req, res) => {
  try {
    const { nombrePileta, horarioApertura, horarioCierre, diasLaborables, mensajeBienvenida } = req.body;
    
    const config = await Configuracion.obtener();
    
    if (nombrePileta !== undefined) config.sistema.nombrePileta = nombrePileta;
    if (horarioApertura !== undefined) config.sistema.horarioApertura = horarioApertura;
    if (horarioCierre !== undefined) config.sistema.horarioCierre = horarioCierre;
    if (diasLaborables !== undefined) config.sistema.diasLaborables = diasLaborables;
    if (mensajeBienvenida !== undefined) config.sistema.mensajeBienvenida = mensajeBienvenida;
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Configuración del sistema actualizada',
      sistema: config.sistema
    });
  } catch (error) {
    console.error('Error al actualizar configuración del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración del sistema'
    });
  }
};

// @desc    Actualizar configuración de pruebas de salud
// @route   PUT /api/configuracion/prueba-salud
// @access  Private/Admin
exports.actualizarPruebaSalud = async (req, res) => {
  try {
    const { diasValidez, diasAlertaAntes } = req.body;
    
    const config = await Configuracion.obtener();
    
    if (diasValidez !== undefined) {
      if (diasValidez < 1 || diasValidez > 365) {
        return res.status(400).json({
          success: false,
          message: 'Los días de validez deben estar entre 1 y 365'
        });
      }
      config.pruebaSalud.diasValidez = diasValidez;
    }
    
    if (diasAlertaAntes !== undefined) {
      if (diasAlertaAntes < 0 || diasAlertaAntes > 30) {
        return res.status(400).json({
          success: false,
          message: 'Los días de alerta deben estar entre 0 y 30'
        });
      }
      config.pruebaSalud.diasAlertaAntes = diasAlertaAntes;
    }
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Configuración de pruebas de salud actualizada',
      pruebaSalud: config.pruebaSalud
    });
  } catch (error) {
    console.error('Error al actualizar configuración de prueba de salud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración'
    });
  }
};

// @desc    Actualizar configuración de abonos
// @route   PUT /api/configuracion/abonos
// @access  Private/Admin
exports.actualizarAbonos = async (req, res) => {
  try {
    const { diasAlertaVencimiento, permitirRenovacionAnticipada, diasAnticipadosRenovacion } = req.body;
    
    const config = await Configuracion.obtener();
    
    if (diasAlertaVencimiento !== undefined) {
      if (diasAlertaVencimiento < 0 || diasAlertaVencimiento > 30) {
        return res.status(400).json({
          success: false,
          message: 'Los días de alerta deben estar entre 0 y 30'
        });
      }
      config.abonos.diasAlertaVencimiento = diasAlertaVencimiento;
    }
    
    if (permitirRenovacionAnticipada !== undefined) {
      config.abonos.permitirRenovacionAnticipada = permitirRenovacionAnticipada;
    }
    
    if (diasAnticipadosRenovacion !== undefined) {
      if (diasAnticipadosRenovacion < 0 || diasAnticipadosRenovacion > 30) {
        return res.status(400).json({
          success: false,
          message: 'Los días anticipados deben estar entre 0 y 30'
        });
      }
      config.abonos.diasAnticipadosRenovacion = diasAnticipadosRenovacion;
    }
    
    config.ultimaActualizacion = new Date();
    config.actualizadoPor = req.user._id;
    
    await config.save();
    
    res.json({
      success: true,
      message: 'Configuración de abonos actualizada',
      abonos: config.abonos
    });
  } catch (error) {
    console.error('Error al actualizar configuración de abonos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración'
    });
  }
};