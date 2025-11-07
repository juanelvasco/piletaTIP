const { Configuracion } = require('../models');

// @desc    Obtener configuración pública (tarifas, horarios)
// @route   GET /api/config/public
// @access  Público
const obtenerConfigPublica = async (req, res) => {
  try {
    const config = await Configuracion.obtenerTarifasPublicas();
    res.json(config);
  } catch (error) {
    console.error('Error en obtenerConfigPublica:', error);
    res.status(500).json({ 
      message: 'Error al obtener configuración',
      error: error.message 
    });
  }
};

// @desc    Obtener configuración completa
// @route   GET /api/config
// @access  Privado (Admin)
const obtenerConfig = async (req, res) => {
  try {
    const config = await Configuracion.obtener();
    res.json({ config });
  } catch (error) {
    console.error('Error en obtenerConfig:', error);
    res.status(500).json({ 
      message: 'Error al obtener configuración',
      error: error.message 
    });
  }
};

// @desc    Actualizar tarifas
// @route   PUT /api/config/tarifas
// @access  Privado (Admin)
const actualizarTarifas = async (req, res) => {
  try {
    const { mensual, trimestral, semestral, anual } = req.body;
    
    const config = await Configuracion.obtener();
    
    await config.actualizarTarifas(
      { mensual, trimestral, semestral, anual },
      req.userId
    );
    
    res.json({
      message: 'Tarifas actualizadas exitosamente',
      tarifas: config.tarifas
    });
  } catch (error) {
    console.error('Error en actualizarTarifas:', error);
    res.status(500).json({ 
      message: 'Error al actualizar tarifas',
      error: error.message 
    });
  }
};

// @desc    Actualizar configuración general
// @route   PUT /api/config
// @access  Privado (Admin)
const actualizarConfig = async (req, res) => {
  try {
    const config = await Configuracion.obtener();
    
    // Actualizar campos permitidos
    if (req.body.pruebaSalud) {
      config.pruebaSalud = { ...config.pruebaSalud, ...req.body.pruebaSalud };
    }
    
    if (req.body.abonos) {
      config.abonos = { ...config.abonos, ...req.body.abonos };
    }
    
    if (req.body.sistema) {
      config.sistema = { ...config.sistema, ...req.body.sistema };
    }
    
    config.actualizadoPor = req.userId;
    await config.save();
    
    res.json({
      message: 'Configuración actualizada exitosamente',
      config
    });
  } catch (error) {
    console.error('Error en actualizarConfig:', error);
    res.status(500).json({ 
      message: 'Error al actualizar configuración',
      error: error.message 
    });
  }
};

module.exports = {
  obtenerConfigPublica,
  obtenerConfig,
  actualizarTarifas,
  actualizarConfig
};