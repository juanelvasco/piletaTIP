import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as escaneoService from '../../services/escaneoService';

function Reportes() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Estados
  const [escaneos, setEscaneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    limite: 20,
    total: 0,
    totalPaginas: 0
  });
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    exitoso: '',
    search: ''
  });
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [escaneoSeleccionado, setEscaneoSeleccionado] = useState(null);
  const [motivoRechazoManual, setMotivoRechazoManual] = useState('');
  const [procesandoEdicion, setProcesandoEdicion] = useState(false);

  useEffect(() => {
    cargarEscaneos();
  }, [paginacion.pagina, paginacion.limite, filtros]);

  const cargarEscaneos = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginacion.pagina,
        limit: paginacion.limite,
        ...filtros
      };
      const data = await escaneoService.getEscaneos(params);
      setEscaneos(data.escaneos || []);
      
      // Actualizar información de paginación
      if (data.paginacion) {
        setPaginacion(prev => ({
          ...prev,
          total: data.paginacion.total,
          totalPaginas: data.paginacion.totalPaginas
        }));
      }
    } catch (error) {
      console.error('Error al cargar escaneos:', error);
      alert('Error al cargar los escaneos');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    // Reset a página 1 cuando cambian los filtros
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const handleLimiteChange = (nuevoLimite) => {
    setPaginacion(prev => ({
      ...prev,
      limite: parseInt(nuevoLimite),
      pagina: 1 // Reset a página 1 cuando cambia el límite
    }));
  };

  const irAPagina = (numeroPagina) => {
    setPaginacion(prev => ({
      ...prev,
      pagina: numeroPagina
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      exitoso: '',
      search: ''
    });
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const abrirModalEdicion = (escaneo) => {
    setEscaneoSeleccionado(escaneo);
    setMotivoRechazoManual('');
    setShowEditModal(true);
  };

  const cerrarModalEdicion = () => {
    setShowEditModal(false);
    setEscaneoSeleccionado(null);
    setMotivoRechazoManual('');
  };

  const confirmarRechazo = async () => {
    if (!motivoRechazoManual.trim()) {
      alert('Por favor ingrese el motivo del rechazo');
      return;
    }

    if (!escaneoSeleccionado?._id) return;

    try {
      setProcesandoEdicion(true);
      await escaneoService.rechazarEscaneo(escaneoSeleccionado._id, motivoRechazoManual.trim());
      alert('Escaneo modificado exitosamente');
      cerrarModalEdicion();
      cargarEscaneos();
    } catch (error) {
      console.error('Error al rechazar escaneo:', error);
      alert(error.response?.data?.message || 'Error al modificar el escaneo');
    } finally {
      setProcesandoEdicion(false);
    }
  };

  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerInfoMotivo = (motivoRechazo) => {
    const motivos = {
      'qr_invalido': { texto: 'QR inválido', color: 'bg-red-100 text-red-800' },
      'usuario_inactivo': { texto: 'Usuario inactivo', color: 'bg-orange-100 text-orange-800' },
      'usuario_baneado': { texto: 'Usuario baneado', color: 'bg-red-100 text-red-800' },
      'sin_abono': { texto: 'Sin abono', color: 'bg-yellow-100 text-yellow-800' },
      'abono_no_pagado': { texto: 'Abono no pagado', color: 'bg-yellow-100 text-yellow-800' },
      'abono_vencido': { texto: 'Abono vencido', color: 'bg-red-100 text-red-800' },
      'sin_prueba_salud': { texto: 'Sin apto médico', color: 'bg-purple-100 text-purple-800' },
      'prueba_salud_vencida': { texto: 'Apto médico vencido', color: 'bg-red-100 text-red-800' },
      'rechazo_manual': { texto: 'Rechazado manualmente', color: 'bg-gray-100 text-gray-800' }
    };
    return motivos[motivoRechazo] || { texto: motivoRechazo, color: 'bg-gray-100 text-gray-800' };
  };

  // Generar números de página para mostrar
  const generarNumerosPagina = () => {
    const numeros = [];
    const totalPags = paginacion.totalPaginas;
    const actual = paginacion.pagina;
    
    // Siempre mostrar primera página
    numeros.push(1);
    
    // Si hay más de 7 páginas, usar lógica de "..."
    if (totalPags <= 7) {
      // Mostrar todas las páginas
      for (let i = 2; i <= totalPags; i++) {
        numeros.push(i);
      }
    } else {
      // Mostrar páginas cercanas a la actual
      if (actual <= 3) {
        // Cerca del inicio
        for (let i = 2; i <= 5; i++) numeros.push(i);
        numeros.push('...');
        numeros.push(totalPags);
      } else if (actual >= totalPags - 2) {
        // Cerca del final
        numeros.push('...');
        for (let i = totalPags - 4; i <= totalPags; i++) numeros.push(i);
      } else {
        // En el medio
        numeros.push('...');
        for (let i = actual - 1; i <= actual + 1; i++) numeros.push(i);
        numeros.push('...');
        numeros.push(totalPags);
      }
    }
    
    return numeros;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/escanear')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Volver al Escáner
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📋 Historial de Escaneos</h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">🔍 Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Estado</label>
              <select
                value={filtros.exitoso}
                onChange={(e) => handleFiltroChange('exitoso', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos</option>
                <option value="true">Exitosos</option>
                <option value="false">Rechazados</option>
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Buscar Usuario</label>
              <input
                type="text"
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
                placeholder="Nombre, DNI..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Limpiar Filtros
            </button>
            <div className="flex-1"></div>
            {/* Selector de items por página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mostrar:</label>
              <select
                value={paginacion.limite}
                onChange={(e) => handleLimiteChange(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Indicador de resultados */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {escaneos.length > 0 ? ((paginacion.pagina - 1) * paginacion.limite + 1) : 0} - {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total} escaneos
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Cargando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Escaneos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && escaneos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Cargando escaneos...</p>
            </div>
          ) : escaneos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No se encontraron escaneos con los filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apto Médico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo Rechazo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {escaneos.map((escaneo) => (
                    <tr key={escaneo._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFechaHora(escaneo.fechaHora)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {escaneo.usuario?.nombre} {escaneo.usuario?.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {escaneo.usuario?.dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          escaneo.exitoso
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {escaneo.exitoso ? '✅ Exitoso' : '❌ Rechazado'}
                        </span>
                        {escaneo.rechazadoManualmente && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            📝 Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {escaneo.abono ? (
                          <span className="text-green-600">✓ Vigente</span>
                        ) : (
                          <span className="text-red-600">✗ Sin abono</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {escaneo.usuario?.pruebaSalud ? (
                          escaneo.usuario.pruebaSalud.vigente ? (
                            <span className="text-green-600">✓ Vigente</span>
                          ) : (
                            <span className="text-red-600">✗ Vencido</span>
                          )
                        ) : (
                          <span className="text-gray-500">✗ Sin apto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {escaneo.motivoRechazo ? (
                          <div>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${obtenerInfoMotivo(escaneo.motivoRechazo).color}`}>
                              {obtenerInfoMotivo(escaneo.motivoRechazo).texto}
                            </span>
                            {escaneo.motivoRechazoManual && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                "{escaneo.motivoRechazoManual}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {escaneo.exitoso && !escaneo.rechazadoManualmente ? (
                          <button
                            onClick={() => abrirModalEdicion(escaneo)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            ✏️ Modificar
                          </button>
                        ) : escaneo.rechazadoManualmente ? (
                          <span className="text-gray-400">Modificado</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Controles de Paginación */}
        {paginacion.totalPaginas > 1 && (
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <div className="flex items-center justify-between">
              {/* Botón Anterior */}
              <button
                onClick={() => irAPagina(paginacion.pagina - 1)}
                disabled={paginacion.pagina === 1}
                className="px-4 py-2 border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Anterior
              </button>

              {/* Números de página */}
              <div className="flex gap-2">
                {generarNumerosPagina().map((num, idx) => (
                  num === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-2">...</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => irAPagina(num)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        paginacion.pagina === num
                          ? 'bg-blue-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  )
                ))}
              </div>

              {/* Botón Siguiente */}
              <button
                onClick={() => irAPagina(paginacion.pagina + 1)}
                disabled={paginacion.pagina === paginacion.totalPaginas}
                className="px-4 py-2 border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Edición */}
      {showEditModal && escaneoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 bg-red-500 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                ⚠️ Modificar Escaneo
              </h2>
              <p className="text-red-50">
                Cambiar a rechazado
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Usuario</p>
                <p className="text-lg font-bold text-gray-900">
                  {escaneoSeleccionado.usuario?.nombre} {escaneoSeleccionado.usuario?.apellido}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  DNI: {escaneoSeleccionado.usuario?.dni}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Escaneado: {formatFechaHora(escaneoSeleccionado.fechaHora)}
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Este escaneo fue aprobado automáticamente. Al modificarlo, se marcará como rechazado manualmente.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoRechazoManual}
                  onChange={(e) => setMotivoRechazoManual(e.target.value)}
                  placeholder="Ej: La foto no coincide con la persona, DNI no corresponde, abono de otra persona..."
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  disabled={procesandoEdicion}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este motivo quedará registrado en el historial
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cerrarModalEdicion}
                  disabled={procesandoEdicion}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRechazo}
                  disabled={procesandoEdicion || !motivoRechazoManual.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoEdicion ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;