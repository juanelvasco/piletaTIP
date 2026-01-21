import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as abonoService from '../../services/abonoService';
import * as userService from '../../services/userService';
import api from '../../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

function Abonos() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estados principales
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
    tipoAbono: '',
    precio: 0
  });

  // Estados para escáner QR
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  // ✅ NUEVO: Modal de confirmación con foto
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [usuarioEscaneado, setUsuarioEscaneado] = useState(null);

  // Modal historial
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialUsuario, setHistorialUsuario] = useState(null);
  const [abonosHistorial, setAbonosHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Estados para modales de éxito y pago
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [successType, setSuccessType] = useState('create');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [abonoToPay, setAbonoToPay] = useState(null);
  const [metodoPago, setMetodoPago] = useState('');

  // Tipos de abono dinámicos
  const [tiposFiltro, setTiposFiltro] = useState([]);
  const [tiposAbono, setTiposAbono] = useState([]);
  const [tiposAbonoMap, setTiposAbonoMap] = useState({});

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  const cargarTiposFiltro = async () => {
    try {
      const response = await api.get('/abonos/tipos-unicos');
      if (response.data.success) {
        setTiposFiltro(response.data.tipos);
      }
    } catch (err) {
      console.error('Error al cargar tipos para filtro:', err);
    }
  };

  const cargarTiposAbono = async () => {
    try {
      const response = await api.get('/configuracion');
      if (response.data.success) {
        const tipos = response.data.configuracion.tiposAbono.filter(t => t.activo);
        setTiposAbono(tipos);
        
        const map = {};
        response.data.configuracion.tiposAbono.forEach(tipo => {
          map[tipo.id] = tipo;
        });
        setTiposAbonoMap(map);
        
        if (tipos.length > 0) {
          setFormData(prev => ({
            ...prev,
            tipoAbono: tipos[0].id,
            precio: tipos[0].precio
          }));
        }
      }
    } catch (err) {
      console.error('Error al cargar tipos de abono:', err);
    }
  };
  
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

  const cargarUsuarios = async () => {
    try {
      const data = await userService.getUsers({ limit: 1000 });
      setUsuarios(data.usuarios);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const cargarHistorialUsuario = async (usuario) => {
    try {
      setLoadingHistorial(true);
      setHistorialUsuario(usuario);
      setShowHistorial(true);
      
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

  // ============================================================================
  // FUNCIONES DE ESCÁNER QR
  // ============================================================================

  const iniciarScanner = () => {
    setShowScannerModal(true);
    setScannerError('');
    
    setTimeout(() => {
      if (!html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );
        
        html5QrcodeScannerRef.current.render(onScanSuccess, onScanError);
      }
    }, 100);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR escaneado:', decodedText);
    
    try {
      const response = await api.get(`/users/qr/${decodedText}`);
      
      if (response.data.usuario) {
        const usuario = response.data.usuario;
        
        // Cerrar scanner
        detenerScanner();
        setShowScannerModal(false);
        
        // ✅ NUEVO: Mostrar modal de confirmación con foto
        setUsuarioEscaneado(usuario);
        setShowConfirmModal(true);
      }
    } catch (err) {
      console.error('Error al buscar usuario:', err);
      setScannerError('Usuario no encontrado. Verifica el código QR.');
    }
  };

  const onScanError = (error) => {
    if (!error.includes('NotFoundException')) {
      console.warn('Error en scanner:', error);
    }
  };

  const detenerScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.error('Error al limpiar scanner:', err);
      });
      html5QrcodeScannerRef.current = null;
    }
  };

  const cerrarScanner = () => {
    detenerScanner();
    setShowScannerModal(false);
    setScannerError('');
  };

  // ✅ NUEVO: Confirmar usuario y abrir modal de crear abono
  const confirmarUsuarioEscaneado = async () => {
    if (!usuarioEscaneado) return;

    // Cargar lista de usuarios si no está cargada
    if (usuarios.length === 0) {
      await cargarUsuarios();
    }
    
    // Abrir modal de crear abono con usuario pre-seleccionado
    if (tiposAbono.length > 0) {
      setFormData({
        usuarioId: usuarioEscaneado._id,
        tipoAbono: tiposAbono[0].id,
        precio: tiposAbono[0].precio
      });
    }
    
    setShowConfirmModal(false);
    setShowModal(true);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    cargarTiposAbono();
    cargarTiposFiltro();
  }, []);
  
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

  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  // ============================================================================
  // HANDLERS DE MODALES
  // ============================================================================

  const handleCrear = async () => {
    await cargarUsuarios();
    if (tiposAbono.length > 0) {
      setFormData({
        usuarioId: '',
        tipoAbono: tiposAbono[0].id,
        precio: tiposAbono[0].precio
      });
    }
    setShowModal(true);
  };

  const handleTipoChange = (tipoId) => {
    const tipo = tiposAbonoMap[tipoId];
    if (tipo) {
      setFormData({
        ...formData,
        tipoAbono: tipoId,
        precio: tipo.precio
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.usuarioId) {
      alert('Debes seleccionar un usuario');
      return;
    }

    try {
      const data = await abonoService.createAbono(formData);
      
      setShowModal(false);
      setSuccessData(data.abono);
      setSuccessType('create');
      setShowSuccessModal(true);
      
      cargarAbonos();
    } catch (err) {
      console.error('Error al crear abono:', err);
      alert(err.response?.data?.message || 'Error al crear el abono');
    }
  };

  const handleAbrirPago = (abono) => {
    setAbonoToPay(abono);
    setMetodoPago('');
    setShowPaymentModal(true);
  };

  const handleMarcarPagado = async () => {
    if (!metodoPago) {
      alert('Debes seleccionar un método de pago');
      return;
    }

    try {
      const data = await abonoService.marcarComoPagado(abonoToPay._id, {
        metodoPago
      });
      
      setShowPaymentModal(false);
      setSuccessData(data.abono);
      setSuccessType('payment');
      setShowSuccessModal(true);
      
      cargarAbonos();
    } catch (err) {
      console.error('Error al marcar como pagado:', err);
      alert(err.response?.data?.message || 'Error al procesar el pago');
    }
  };

  const handleEliminar = async (abonoId) => {
    if (!confirm('¿Estás seguro de eliminar este abono?')) return;

    try {
      await abonoService.deleteAbono(abonoId);
      cargarAbonos();
      alert('Abono eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert(err.response?.data?.message || 'Error al eliminar el abono');
    }
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getBadgeColor = (tipo) => {
    const colors = {
      'diario': 'bg-purple-100 text-purple-800',
      'mensual': 'bg-blue-100 text-blue-800',
      'trimestral': 'bg-green-100 text-green-800',
      'semestral': 'bg-yellow-100 text-yellow-800',
      'anual': 'bg-red-100 text-red-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getMetodoPagoIcon = (metodo) => {
    const icons = {
      efectivo: '💵',
      mercadopago: '💳',
      transferencia: '🏦',
      pendiente: '⏳'
    };
    return icons[metodo] || '❓';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && abonos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando abonos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Gestión de Abonos</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con botones */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Abonos</h2>
            <p className="text-gray-600">Gestiona los abonos de los usuarios</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={iniciarScanner}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">📱</span>
              <span>Escanear QR</span>
            </button>
            
            <button
              onClick={handleCrear}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              ➕ Crear Abono
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por DNI o Nombre
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Abono
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {tiposFiltro.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                    {tipo.historico && !tipo.activo && ' (⚠️ Descontinuado)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Pago
              </label>
              <select
                value={filtroPagado}
                onChange={(e) => setFiltroPagado(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setFiltroTipo('');
                  setFiltroPagado('');
                }}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                🔄 Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de abonos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abonos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron abonos
                    </td>
                  </tr>
                ) : (
                  abonos.map((abono) => (
                    <tr key={abono._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {abono.usuario?.nombre} {abono.usuario?.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {abono.usuario?.dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(abono.tipoAbono)}`}>
                          {tiposAbonoMap[abono.tipoAbono]?.nombre || abono.tipoAbono}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrecio(abono.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatFecha(abono.fechaInicio)}</div>
                        <div>{formatFecha(abono.fechaFin)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {abono.pagado ? (
                          <div>
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {getMetodoPagoIcon(abono.metodoPago)} Pagado
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatFecha(abono.fechaPago)}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAbrirPago(abono)}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-full transition-colors"
                          >
                            ⏳ Marcar Pagado
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEliminar(abono._id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{page}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Escáner QR */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">📱 Escanear QR del Usuario</h2>
                <button
                  onClick={cerrarScanner}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {scannerError && (
                <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">❌ {scannerError}</p>
                </div>
              )}

              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Instrucciones:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Coloca el código QR del usuario frente a la cámara</li>
                  <li>• Espera a que se escanee automáticamente</li>
                  <li>• Se abrirá el formulario con el usuario seleccionado</li>
                </ul>
              </div>

              <div id="qr-reader" className="w-full"></div>

              <button
                onClick={cerrarScanner}
                className="w-full mt-4 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Modal de Confirmación con Foto */}
      {showConfirmModal && usuarioEscaneado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl text-center">
              <h2 className="text-2xl font-bold text-white mb-2">✅ Usuario Identificado</h2>
              <p className="text-blue-100">Verifica que sea la persona correcta</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={usuarioEscaneado.fotoPerfil || `https://ui-avatars.com/api/?name=${usuarioEscaneado.nombre}+${usuarioEscaneado.apellido}&background=3B82F6&color=fff&size=200`}
                  alt={`${usuarioEscaneado.nombre} ${usuarioEscaneado.apellido}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-4"
                />
                <h3 className="text-2xl font-bold text-gray-900">
                  {usuarioEscaneado.nombre} {usuarioEscaneado.apellido}
                </h3>
                <p className="text-gray-600 mt-1">DNI: {usuarioEscaneado.dni}</p>
                <p className="text-gray-500 text-sm">{usuarioEscaneado.email}</p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 text-center">
                  <strong>¿Es esta la persona correcta?</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setUsuarioEscaneado(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ✕ Cancelar
                </button>
                <button
                  onClick={confirmarUsuarioEscaneado}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✓ Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Abono */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">➕ Crear Nuevo Abono</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario *
                </label>
                <select
                  required
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.nombre} {user.apellido} - DNI: {user.dni}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Abono *
                </label>
                <select
                  required
                  value={formData.tipoAbono}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {tiposAbono.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} - {tipo.duracionDias} días
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio del Abono
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Precio configurado:</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatPrecio(tiposAbonoMap[formData.tipoAbono]?.precio || 0)}
                      </p>
                    </div>
                    <div className="text-5xl">💰</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Este precio está definido en la configuración del sistema
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✅ Crear Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Marcar Pagado */}
      {showPaymentModal && abonoToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">💳 Registrar Pago</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Usuario:</p>
                <p className="font-semibold">{abonoToPay.usuario?.nombre} {abonoToPay.usuario?.apellido}</p>
                <p className="text-sm text-gray-600 mt-2">Monto:</p>
                <p className="font-semibold text-lg">{formatPrecio(abonoToPay.precio)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Seleccionar método</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="mercadopago">💳 MercadoPago</option>
                  <option value="transferencia">🏦 Transferencia</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMarcarPagado}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✅ Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-6xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {successType === 'create' ? '¡Abono Creado!' : '¡Pago Registrado!'}
              </h2>
              <p className="text-green-50">
                {successType === 'create' ? 'El abono se creó correctamente' : 'El pago se registró correctamente'}
              </p>
            </div>

            <div className="p-6">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                ✓ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Abonos;