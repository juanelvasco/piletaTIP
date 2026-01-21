
const Escaneo = require('../models/Escaneo');
const moment = require('moment'); // npm install moment

// Obtener reporte de ingresos
exports.obtenerIngresos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoAbono, metodoPago } = req.query;

    // Configurar filtros
    const filtros = {
      exitoso: true // Solo escaneos exitosos
    };

    // Filtro de fechas
    if (fechaInicio && fechaFin) {
      filtros.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin + 'T23:59:59.999Z') // Incluir todo el día
      };
    } else {
      // Por defecto: hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);
      
      filtros.fechaHora = {
        $gte: hoy,
        $lte: finHoy
      };
    }

    // Obtener escaneos con populate
    let escaneos = await Escaneo.find(filtros)
      .populate({
        path: 'usuario',
        select: 'nombre apellido dni'
      })
      .populate({
        path: 'abono',
        select: 'tipoAbono precio metodoPago fechaPago'
      })
      .sort({ fechaHora: -1 })
      .lean();

    // Filtrar por tipoAbono si se especificó
    if (tipoAbono && tipoAbono !== 'todos') {
      escaneos = escaneos.filter(e => e.abono && e.abono.tipoAbono === tipoAbono);
    }

    // Filtrar por metodoPago si se especificó
    if (metodoPago && metodoPago !== 'todos') {
      escaneos = escaneos.filter(e => e.abono && e.abono.metodoPago === metodoPago);
    }

    // Calcular estadísticas
    const montoTotal = escaneos.reduce((sum, e) => {
      return sum + (e.abono ? e.abono.precio : 0);
    }, 0);

    const cantidadIngresos = escaneos.length;

    // Formatear datos para la tabla
    const datosTabla = escaneos.map(e => ({
      _id: e._id,
      fecha: e.fechaHora,
      usuario: e.usuario ? `${e.usuario.nombre} ${e.usuario.apellido}` : 'N/A',
      dni: e.usuario ? e.usuario.dni : 'N/A',
      tipoAbono: e.abono ? e.abono.tipoAbono : 'N/A',
      precio: e.abono ? e.abono.precio : 0,
      metodoPago: e.abono ? e.abono.metodoPago : 'N/A',
      fechaPago: e.abono ? e.abono.fechaPago : null
    }));

    res.json({
      success: true,
      datos: datosTabla,
      estadisticas: {
        montoTotal,
        cantidadIngresos
      }
    });

  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el reporte de ingresos'
    });
  }
};

// Obtener resumen de ingresos por tipo de abono
exports.obtenerResumenPorTipo = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const filtros = {
      exitoso: true
    };

    // Filtro de fechas (por defecto hoy)
    if (fechaInicio && fechaFin) {
      filtros.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin + 'T23:59:59.999Z')
      };
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const finHoy = new Date();
      finHoy.setHours(23, 59, 59, 999);
      
      filtros.fechaHora = {
        $gte: hoy,
        $lte: finHoy
      };
    }

    const escaneos = await Escaneo.find(filtros)
      .populate('abono', 'tipoAbono precio metodoPago')
      .lean();

    // Agrupar por tipo de abono
    const resumen = {
      mensual: { cantidad: 0, monto: 0 },
      trimestral: { cantidad: 0, monto: 0 },
      semestral: { cantidad: 0, monto: 0 },
      anual: { cantidad: 0, monto: 0 }
    };

    escaneos.forEach(e => {
      if (e.abono && e.abono.tipoAbono) {
        const tipo = e.abono.tipoAbono;
        resumen[tipo].cantidad++;
        resumen[tipo].monto += e.abono.precio;
      }
    });

    res.json({
      success: true,
      resumen
    });

  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el resumen'
    });
  }
};

module.exports = exports;
