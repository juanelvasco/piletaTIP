import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as abonoService from '../../services/abonoService';
import * as userService from '../../services/userService';

function Abonos() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estados
  const [abonos, setAbonos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroPagado, setFiltroPagado] = useState('');

  // Modal crear abono
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    usuarioId: '',
    tipoAbono: 'mensual',
    precio: 0
  });

  // Modal historial
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialUsuario, setHistorialUsuario] = useState(null);
  const [abonosHistorial, setAbonosHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Precios sugeridos por tipo
  const preciosSugeridos = {
    mensual: 5000,
    trimestral: 14000,
    semestral: 26000,
    anual: 48000
  };

  // Cargar abonos
  const cargarAbonos = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        tipoAbono: filtroTipo
      };

      if (filtroPagado === 'pagado') {
        params.pagado = 'true';
      } else if (filtroPagado === 'pendiente') {
        params.pagado = 'false';
      }
      
      const data = await abonoService.getAbonos(params);
      setAbonos(data.abonos);
      setTotalPages(data.paginacion.totalPaginas);
      setError('');
    } catch (err) {
      setError('Error al cargar abonos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de usuarios para el select
  const cargarUsuarios = async () => {
    try {
      const data = await userService.getUsers({ limit: 1000 }); // Traer todos los usuarios
      setUsuarios(data.usuarios);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // Cargar historial de un usuario específico
  const cargarHistorialUsuario = async (usuario) => {
    try {
      setLoadingHistorial(true);
      setHistorialUsuario(usuario);
      setShowHistorial(true);
      
      // Obtener todos los abonos del usuario
      const data = await abonoService.getAbonos({ 
        search: usuario.dni,
        limit: 100
      });
      setAbonosHistorial(data.abonos);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setAbonosHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    cargarAbonos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroTipo, filtroPagado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        cargarAbonos();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Abrir modal para crear
  const handleCrear = async () => {
    await cargarUsuarios();
    setFormData({
      usuarioId: '',
      tipoAbono: 'mensual',
      precio: preciosSugeridos.mensual
    });
    setShowModal(true);
  };

  // Cambiar tipo de abono y actualizar precio sugerido
  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      tipoAbono: tipo,
      precio: preciosSugeridos[tipo]
    });
  };

  // Guardar abono
  const handleGuardar = async (e) => {
    e.preventDefault();
    
    if (!formData.usuarioId) {
      alert('Debe seleccionar un usuario');
      return;
    }

    try {
      await abonoService.createAbono(formData);
      setShowModal(false);
      cargarAbonos();
      alert('Abono creado exitosamente');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear abono');
    }
  };

  // Marcar como pagado
  const handleMarcarPagado = async (abono) => {
    const metodoPago = prompt('Método de pago:\n\n1. efectivo\n2. mercadopago\n3. transferencia\n\nIngrese el método:');
    
    if (!metodoPago) return;

    const metodosValidos = ['efectivo', 'mercadopago', 'transferencia'];
    if (!metodosValidos.includes(metodoPago.toLowerCase())) {
      alert('Método de pago inválido');
      return;
    }

    try {
      await abonoService.marcarComoPagado(abono._id, metodoPago.toLowerCase());
      cargarAbonos();
      alert('Abono marcado como pagado');
    } catch (err) {
      alert('Error al marcar como pagado');
    }
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  // Calcular días restantes
  const calcularDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  // Obtener estado del abono
  const obtenerEstadoAbono = (abono) => {
    if (!abono.pagado) {
      return {
        texto: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800'
      };
    }

    const diasRestantes = calcularDiasRestantes(abono.fechaFin);
    
    if (diasRestantes === 0) {
      return {
        texto: 'Vencido',
        color: 'bg-red-100 text-red-800'
      };
    }

    if (diasRestantes <= 3) {
      return {
        texto: 'Por vencer',
        color: 'bg-orange-100 text-orange-800'
      };
    }

    return {
      texto: 'Activo',
      color: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Abonos</h1>
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
        {/* Barra de acciones */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Filtros */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>

            <select
              value={filtroPagado}
              onChange={(e) => setFiltroPagado(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pendientes</option>
            </select>

            {/* Botón crear */}
            <button
              onClick={handleCrear}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              + Nuevo Abono
            </button>
          </div>
        </div>

        {/* Tabla de abonos */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando abonos...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={cargarAbonos}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : abonos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No se encontraron abonos</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {abonos.map((abono) => {
                    const estado = obtenerEstadoAbono(abono);
                    return (
                      <tr key={abono._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {abono.usuario?.nombre} {abono.usuario?.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {abono.usuario?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                            {abono.tipoAbono}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrecio(abono.precio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{formatFecha(abono.fechaInicio)}</div>
                          <div className="text-xs text-gray-500">hasta {formatFecha(abono.fechaFin)}</div>
                          {abono.pagado && (
                            <div className="text-xs text-purple-600 font-medium mt-1">
                              {calcularDiasRestantes(abono.fechaFin)} días restantes
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${estado.color}`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {!abono.pagado && (
                            <button
                              onClick={() => handleMarcarPagado(abono)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Marcar Pagado
                            </button>
                          )}
                          <button
                            onClick={() => cargarHistorialUsuario(abono.usuario)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Historial
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal Crear Abono */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Nuevo Abono
            </h2>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Usuario *</label>
                <select
                  required
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccione un usuario</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario._id} value={usuario._id}>
                      {usuario.nombre} {usuario.apellido} - {usuario.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Tipo de Abono *</label>
                <select
                  value={formData.tipoAbono}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral (3 meses)</option>
                  <option value="semestral">Semestral (6 meses)</option>
                  <option value="anual">Anual (12 meses)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Precio *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio sugerido: {formatPrecio(preciosSugeridos[formData.tipoAbono])}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📅 Nota:</strong> El abono comenzará hoy y finalizará según el tipo seleccionado. El usuario deberá pagar para activarlo.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Crear Abono
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Usuario */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    📋 Historial de Abonos
                  </h2>
                  {historialUsuario && (
                    <p className="text-gray-600 mt-1">
                      {historialUsuario.nombre} {historialUsuario.apellido} - {historialUsuario.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowHistorial(false);
                    setHistorialUsuario(null);
                    setAbonosHistorial([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistorial ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando historial...</p>
                </div>
              ) : abonosHistorial.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600">Este usuario no tiene abonos registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Total Abonos</p>
                      <p className="text-2xl font-bold text-blue-900">{abonosHistorial.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Pagados</p>
                      <p className="text-2xl font-bold text-green-900">
                        {abonosHistorial.filter(a => a.pagado).length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {abonosHistorial.filter(a => !a.pagado).length}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Total Recaudado</p>
                      <p className="text-lg font-bold text-purple-900">
                        {formatPrecio(abonosHistorial.filter(a => a.pagado).reduce((sum, a) => sum + a.precio, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Lista de abonos */}
                  {abonosHistorial.map((abonoHist) => {
                    const estadoHist = obtenerEstadoAbono(abonoHist);
                    return (
                      <div
                        key={abonoHist._id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-lg font-semibold capitalize">
                              {abonoHist.tipoAbono}
                            </span>
                            <p className="text-sm text-gray-600">
                              {formatFecha(abonoHist.fechaInicio)} - {formatFecha(abonoHist.fechaFin)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoHist.color}`}>
                            {estadoHist.texto}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Precio</p>
                            <p className="font-semibold">{formatPrecio(abonoHist.precio)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estado de Pago</p>
                            <p className="font-semibold">
                              {abonoHist.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                            </p>
                          </div>
                          {abonoHist.metodoPago && abonoHist.metodoPago !== 'pendiente' && (
                            <div>
                              <p className="text-gray-600">Método de Pago</p>
                              <p className="font-semibold capitalize">{abonoHist.metodoPago}</p>
                            </div>
                          )}
                          {abonoHist.pagado && (
                            <>
                              <div>
                                <p className="text-gray-600">Fecha de Pago</p>
                                <p className="font-semibold">{formatFecha(abonoHist.fechaPago)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Días Restantes</p>
                                <p className="font-semibold">
                                  {calcularDiasRestantes(abonoHist.fechaFin)} días
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowHistorial(false);
                  setHistorialUsuario(null);
                  setAbonosHistorial([]);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Abonos;