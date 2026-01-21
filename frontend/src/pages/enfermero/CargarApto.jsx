import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

function CargarApto() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Form data
  const [diasValidez, setDiasValidez] = useState('15');
  const [diasCustom, setDiasCustom] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estados para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Estados para escáner QR
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  // ✅ NUEVO: Modal de confirmación con foto
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [usuarioEscaneado, setUsuarioEscaneado] = useState(null);

  // Opciones predefinidas de días
  const opcionesDias = [
    { valor: '1', etiqueta: '1 día' },
    { valor: '3', etiqueta: '3 días' },
    { valor: '7', etiqueta: '7 días (1 semana)' },
    { valor: '14', etiqueta: '14 días (2 semanas)' },
    { valor: '15', etiqueta: '15 días' },
    { valor: '30', etiqueta: '30 días (1 mes)' },
    { valor: 'custom', etiqueta: 'Personalizado...' }
  ];

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          limit: 1000,
          activo: true
        }
      });
      setUsuarios(response.data.usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
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
          "qr-reader-apto",
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

  // ✅ NUEVO: Confirmar usuario escaneado
  const confirmarUsuarioEscaneado = () => {
    if (!usuarioEscaneado) return;
    handleSeleccionarUsuario(usuarioEscaneado);
    setShowConfirmModal(false);
  };

  // ============================================================================
  // FUNCIONES ORIGINALES
  // ============================================================================

  const handleSeleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModal(true);
    setDiasValidez('15');
    setDiasCustom('');
    setNotas('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCargando(true);
      
      let dias = parseInt(diasValidez);
      if (diasValidez === 'custom') {
        dias = parseInt(diasCustom);
        if (isNaN(dias) || dias < 1) {
          alert('Por favor ingresa un número válido de días');
          return;
        }
      }

      const response = await api.post('/pruebas-salud', {
        usuarioId: usuarioSeleccionado._id,
        diasValidez: dias,
        notas: notas.trim() || undefined
      });

      setMostrarModal(false);
      setSuccessData(response.data.pruebaSalud);
      setShowSuccessModal(true);
      
      await cargarUsuarios();
      
    } catch (error) {
      console.error('Error al cargar apto:', error);
      alert(error.response?.data?.message || 'Error al cargar el apto médico');
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      usuario.nombre?.toLowerCase().includes(searchLower) ||
      usuario.apellido?.toLowerCase().includes(searchLower) ||
      usuario.dni?.includes(busqueda) ||
      usuario.email?.toLowerCase().includes(searchLower)
    );
  });

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
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
              <Link
                to="/enfermero/dashboard"
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Cargar Apto Médico</h1>
                <p className="text-xs text-gray-500">Panel de Enfermería</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            🩺 Registrar Apto Médico
          </h2>
          <p className="text-gray-600">
            Selecciona un usuario para cargar su certificado de aptitud física
          </p>
        </div>

        {/* Búsqueda y botón scanner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Usuario
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, apellido, DNI o email..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={iniciarScanner}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">📱</span>
              <span>Escanear QR</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {usuariosFiltrados.length} usuario(s) encontrado(s)
          </p>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apto Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {usuario.nombre?.[0]}{usuario.apellido?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nombre} {usuario.apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {usuario.dni}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.pruebaSalud?.vigente ? (
                          <div>
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ Vigente
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Vence: {formatFecha(usuario.pruebaSalud.fechaVencimiento)}
                            </div>
                          </div>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Vencido o Sin Apto
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSeleccionarUsuario(usuario)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          📋 Cargar Apto
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
                  <li>• Se abrirá el formulario de apto médico</li>
                </ul>
              </div>

              <div id="qr-reader-apto" className="w-full"></div>

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

      {/* Modal Cargar Apto */}
      {mostrarModal && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                📋 Cargar Apto Médico
              </h2>
              <p className="text-blue-100 mt-1">
                {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">DNI:</p>
                    <p className="font-semibold">{usuarioSeleccionado.dni}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email:</p>
                    <p className="font-semibold text-xs">{usuarioSeleccionado.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validez del Apto *
                </label>
                <select
                  required
                  value={diasValidez}
                  onChange={(e) => setDiasValidez(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {opcionesDias.map(opcion => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              {diasValidez === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de validez (personalizado) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="365"
                    value={diasCustom}
                    onChange={(e) => setDiasCustom(e.target.value)}
                    placeholder="Ingresa número de días"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  disabled={cargando}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? '⏳ Cargando...' : '✅ Confirmar Apto'}
                </button>
              </div>
            </form>
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
                ¡Apto Médico Cargado!
              </h2>
              <p className="text-green-50">
                El certificado fue registrado correctamente
              </p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Vence el:</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatFecha(successData.fechaVencimiento)}
                </p>
              </div>

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

export default CargarApto;