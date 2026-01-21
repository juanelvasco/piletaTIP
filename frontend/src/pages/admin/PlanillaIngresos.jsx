// frontend/src/pages/admin/PlanillaIngresos.jsx

import { useState, useEffect } from 'react';
import api from '../../services/api';

function PlanillaIngresos() {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date().toISOString().split('T')[0], // Hoy por defecto
    fechaFin: new Date().toISOString().split('T')[0],
    tipoAbono: 'todos',
    metodoPago: 'todos'
  });

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    montoTotal: 0,
    cantidadIngresos: 0
  });

  // ✅ NUEVO: Estados para tipos de abono dinámicos
  const [tiposAbono, setTiposAbono] = useState([]);
  const [tiposAbonoMap, setTiposAbonoMap] = useState({});

  useEffect(() => {
    cargarTiposAbono();
  }, []);

  useEffect(() => {
    cargarIngresos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // ✅ NUEVO: Cargar tipos de abono desde configuración
  const cargarTiposAbono = async () => {
    try {
      const response = await api.get('/configuracion');
      if (response.data.success) {
        const tipos = response.data.configuracion.tiposAbono;
        setTiposAbono(tipos);
        
        const map = {};
        tipos.forEach(tipo => {
          map[tipo.id] = tipo.nombre;
        });
        setTiposAbonoMap(map);
      }
    } catch (error) {
      console.error('Error al cargar tipos de abono:', error);
    }
  };

  const cargarIngresos = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('fechaInicio', filtros.fechaInicio);
      params.append('fechaFin', filtros.fechaFin);
      if (filtros.tipoAbono !== 'todos') {
        params.append('tipoAbono', filtros.tipoAbono);
      }
      if (filtros.metodoPago !== 'todos') {
        params.append('metodoPago', filtros.metodoPago);
      }

      const response = await api.get(`/reportes/ingresos?${params.toString()}`);
      
      if (response.data.success) {
        setIngresos(response.data.datos);
        setEstadisticas(response.data.estadisticas);
      }
    } catch (err) {
      console.error('Error al cargar ingresos:', err);
      setError('Error al cargar los datos de ingresos');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      tipoAbono: 'todos',
      metodoPago: 'todos'
    });
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Hora', 'Usuario', 'DNI', 'Tipo Abono', 'Monto', 'Método Pago'];
    
    const rows = ingresos.map(ing => [
      new Date(ing.fechaPago).toLocaleDateString('es-AR'),
      new Date(ing.fechaPago).toLocaleTimeString('es-AR'),
      `${ing.usuario.nombre} ${ing.usuario.apellido}`,
      ing.usuario.dni,
      // ✅ CAMBIO: Usar mapa de nombres
      getTipoAbonoLabel(ing.tipoAbono),
      `$${ing.precio}`,
      getMetodoPagoLabel(ing.metodoPago)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ingresos_${filtros.fechaInicio}_${filtros.fechaFin}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatFechaHora = (fecha) => {
    const date = new Date(fecha);
    return {
      fecha: date.toLocaleDateString('es-AR'),
      hora: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // ✅ CAMBIO: Obtener nombre del tipo de abono desde el mapa
  const getTipoAbonoLabel = (tipo) => {
    return tiposAbonoMap[tipo] || tipo;
  };

  const getMetodoPagoLabel = (metodo) => {
    const labels = {
      efectivo: 'Efectivo',
      mercadopago: 'MercadoPago',
      transferencia: 'Transferencia'
    };
    return labels[metodo] || metodo;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Planilla de Ingresos</h1>
                <p className="text-xs text-gray-500">Gestión Financiera</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Monto Total</p>
                <p className="text-3xl font-bold mt-2">{formatPrecio(estadisticas.montoTotal)}</p>
              </div>
              <div className="text-5xl opacity-80">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Cantidad de Ingresos</p>
                <p className="text-3xl font-bold mt-2">{estadisticas.cantidadIngresos}</p>
              </div>
              <div className="text-5xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filtros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tipo Abono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Abono
              </label>
              <select
                name="tipoAbono"
                value={filtros.tipoAbono}
                onChange={(e) => handleFiltroChange('tipoAbono', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                {/* ✅ CAMBIO: Usar tipos dinámicos */}
                {tiposAbono.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                name="metodoPago"
                value={filtros.metodoPago}
                onChange={(e) => handleFiltroChange('metodoPago', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="mercadopago">MercadoPago</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleLimpiarFiltros}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            >
              🔄 Limpiar Filtros
            </button>
            <button
              onClick={exportarCSV}
              disabled={ingresos.length === 0}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabla de Ingresos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Listado de Ingresos
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Cargando ingresos...</p>
            </div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg">No se encontraron ingresos en el período seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Abono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método de Pago
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingresos.map((ingreso, index) => {
                    const { fecha, hora } = formatFechaHora(ingreso.fechaPago);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{fecha}</div>
                          <div className="text-sm text-gray-500">{hora}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ingreso.usuario.nombre} {ingreso.usuario.apellido}
                          </div>
                          <div className="text-sm text-gray-500">DNI: {ingreso.usuario.dni}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* ✅ CAMBIO: Usar función que obtiene nombre dinámico */}
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getTipoAbonoLabel(ingreso.tipoAbono)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatPrecio(ingreso.precio)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                            {getMetodoPagoLabel(ingreso.metodoPago)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PlanillaIngresos;