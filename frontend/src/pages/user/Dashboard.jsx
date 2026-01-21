import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as abonoService from '../../services/abonoService';
import * as escaneoService from '../../services/escaneoService';
import api from '../../services/api';
import QRCode from 'qrcode';

function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const qrCanvasRef = useRef(null);

  const [abono, setAbono] = useState(null);
  const [loadingAbono, setLoadingAbono] = useState(true);
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  
  const [pruebaSalud, setPruebaSalud] = useState(null);
  const [loadingPruebaSalud, setLoadingPruebaSalud] = useState(true);
  
  const [escaneos, setEscaneos] = useState([]);
  const [loadingEscaneos, setLoadingEscaneos] = useState(true);

  // ✅ NUEVO: Estado para tipos de abono
  const [tiposAbonoMap, setTiposAbonoMap] = useState({});

  // Estados para editar perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fotoPerfil: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (user?.qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, user.qrCode, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        }
      });
    }
  }, [user?.qrCode]);

  // ✅ NUEVO: Cargar tipos de abono
  const cargarTiposAbono = useCallback(async () => {
    try {
      const response = await api.get('/configuracion');
      if (response.data.success) {
        const map = {};
        response.data.configuracion.tiposAbono.forEach(tipo => {
          map[tipo.id] = tipo.nombre;
        });
        setTiposAbonoMap(map);
      }
    } catch (error) {
      console.error('Error al cargar tipos de abono:', error);
    }
  }, []);

  const cargarAbono = useCallback(async () => {
    try {
      setLoadingAbono(true);
      const data = await abonoService.getMiAbono();
      setAbono(data.abono);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar abono:', error);
      }
      setAbono(null);
    } finally {
      setLoadingAbono(false);
    }
  }, []);

  const cargarPruebaSalud = useCallback(async () => {
    try {
      setLoadingPruebaSalud(true);
      const response = await api.get('/salud/mi-prueba');
      setPruebaSalud(response.data.prueba);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar prueba de salud:', error);
      }
      setPruebaSalud(null);
    } finally {
      setLoadingPruebaSalud(false);
    }
  }, []);

  const cargarEscaneos = useCallback(async () => {
    try {
      setLoadingEscaneos(true);
      const data = await escaneoService.getMiHistorial(10);
      const escaneos = (data.escaneos || []).map(e => ({
        ...e,
        exitoso: Boolean(e.exitoso)
      }));
      setEscaneos(escaneos);
    } catch (error) {
      console.error('Error al cargar escaneos:', error);
      setEscaneos([]);
    } finally {
      setLoadingEscaneos(false);
    }
  }, []);

  useEffect(() => {
    cargarAbono();
    cargarPruebaSalud();
    cargarEscaneos();
    cargarTiposAbono(); // ✅ NUEVO
  }, [cargarAbono, cargarPruebaSalud, cargarEscaneos, cargarTiposAbono]);

  const handleVerHistorial = async () => {
    try {
      setLoadingHistorial(true);
      setShowHistorial(true);
      const data = await abonoService.getMiHistorial();
      setHistorial(data.abonos || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      fotoPerfil: user?.fotoPerfil || ''
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      setEditLoading(true);
      
      const response = await api.put('/auth/perfil', editFormData);
      
      if (response.data.usuario) {
        updateProfile(response.data.usuario);
        setShowEditModal(false);
        alert('Perfil actualizado correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setEditLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const calcularDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  const obtenerEstadoAbono = (abonoData = abono) => {
    if (!abonoData) {
      return {
        texto: 'Sin abono',
        color: 'bg-gray-100 text-gray-800',
        icono: '⚠️'
      };
    }

    if (!abonoData.pagado) {
      return {
        texto: 'Pendiente de pago',
        color: 'bg-yellow-100 text-yellow-800',
        icono: '⏳'
      };
    }

    const diasRestantes = calcularDiasRestantes(abonoData.fechaFin);
    
    if (diasRestantes === 0) {
      return {
        texto: 'Vencido',
        color: 'bg-red-100 text-red-800',
        icono: '❌'
      };
    }

    if (diasRestantes <= 3) {
      return {
        texto: 'Por vencer',
        color: 'bg-orange-100 text-orange-800',
        icono: '⚠️'
      };
    }

    if (diasRestantes <= 7) {
      return {
        texto: 'Próximo a vencer',
        color: 'bg-yellow-100 text-yellow-800',
        icono: '⏰'
      };
    }

    return {
      texto: 'Activo',
      color: 'bg-green-100 text-green-800',
      icono: '✓'
    };
  };

  const obtenerEstadoPruebaSalud = () => {
    if (!pruebaSalud) {
      return {
        texto: 'Sin registrar',
        color: 'bg-gray-100 text-gray-800',
        detalle: 'No tienes un apto médico registrado'
      };
    }

    if (!pruebaSalud.vigente) {
      return {
        texto: 'Vencido',
        color: 'bg-red-100 text-red-800',
        detalle: `Venció el ${formatFecha(pruebaSalud.fechaVencimiento)}`
      };
    }

    const diasRestantes = calcularDiasRestantes(pruebaSalud.fechaVencimiento);

    if (diasRestantes <= 3) {
      return {
        texto: 'Por vencer',
        color: 'bg-orange-100 text-orange-800',
        detalle: `Quedan ${diasRestantes} días`
      };
    }

    if (diasRestantes <= 7) {
      return {
        texto: 'Próximo a vencer',
        color: 'bg-yellow-100 text-yellow-800',
        detalle: `Quedan ${diasRestantes} días`
      };
    }

    return {
      texto: 'Vigente',
      color: 'bg-green-100 text-green-800',
      detalle: `Válido hasta ${formatFecha(pruebaSalud.fechaVencimiento)}`
    };
  };

  // ✅ NUEVO: Función para obtener nombre del tipo de abono
  const obtenerNombreTipoAbono = (tipoId) => {
    return tiposAbonoMap[tipoId] || tipoId;
  };

  const estadoAbono = obtenerEstadoAbono();
  const estadoPruebaSalud = obtenerEstadoPruebaSalud();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.nombre}! 🏊
            </h1>
            <p className="text-gray-600 mt-1">Panel de Usuario</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold">Mi Perfil</h2>
            <button
              onClick={handleOpenEditModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              ✏️ Editar Perfil
            </button>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <img
              src={user?.fotoPerfil || `https://ui-avatars.com/api/?name=${user?.nombre}+${user?.apellido}&background=3B82F6&color=fff&size=128`}
              alt="Foto de perfil"
              className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
            />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {user?.nombre} {user?.apellido}
              </h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">DNI</p>
                <p className="font-semibold">{user?.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-semibold">{user?.telefono || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Activo
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <p className="text-sm text-gray-700 mb-3 font-semibold">📱 Mi Código QR</p>
              {user?.qrCode ? (
                <>
                  <div className="bg-white p-3 rounded-lg shadow-md mb-3">
                    <canvas ref={qrCanvasRef} />
                  </div>
                  
                  <button
                    onClick={() => navigate('/usuario/mi-qr')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-xs font-medium shadow-sm"
                  >
                    🔍 Ver QR Grande
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">No generado</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">💳 Mi Abono</h2>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoAbono.color}`}>
                {estadoAbono.icono} {estadoAbono.texto}
              </span>
              {abono && (
                <button
                  onClick={handleVerHistorial}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                >
                  📋 Ver Historial
                </button>
              )}
            </div>
          </div>

          {loadingAbono ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando información del abono...</p>
            </div>
          ) : abono ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">Tipo de Abono</p>
                  {/* ✅ CAMBIO: Mostrar nombre en lugar de ID */}
                  <p className="text-lg font-bold text-blue-900">{obtenerNombreTipoAbono(abono.tipoAbono)}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium mb-1">Precio</p>
                  <p className="text-lg font-bold text-green-900">{formatPrecio(abono.precio)}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium mb-1">Días Restantes</p>
                  <p className="text-lg font-bold text-purple-900">
                    {abono.pagado ? calcularDiasRestantes(abono.fechaFin) : '-'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                    <p className="font-semibold text-gray-900">{formatFecha(abono.fechaInicio)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Vencimiento</p>
                    <p className="font-semibold text-gray-900">{formatFecha(abono.fechaFin)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estado de Pago</p>
                    <p className={`font-semibold ${abono.pagado ? 'text-green-600' : 'text-yellow-600'}`}>
                      {abono.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                    </p>
                  </div>
                  {abono.metodoPago && abono.metodoPago !== 'pendiente' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Método de Pago</p>
                      <p className="font-semibold text-gray-900 capitalize">{abono.metodoPago}</p>
                    </div>
                  )}
                  {abono.pagado && abono.fechaPago && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fecha de Pago</p>
                      <p className="font-semibold text-gray-900">{formatFecha(abono.fechaPago)}</p>
                    </div>
                  )}
                </div>
              </div>

              {abono.pagado && calcularDiasRestantes(abono.fechaFin) <= 7 && calcularDiasRestantes(abono.fechaFin) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 font-semibold flex items-center gap-2">
                    ⚠️ Tu abono está próximo a vencer
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    Quedan {calcularDiasRestantes(abono.fechaFin)} días. Contacta con administración para renovar tu abono.
                  </p>
                </div>
              )}

              {!abono.pagado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold flex items-center gap-2">
                    💰 Abono pendiente de pago
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Para activar tu abono, realiza el pago en recepción. Una vez confirmado, podrás acceder a la pileta.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin abono activo</h3>
              <p className="text-gray-600 mb-4">
                Actualmente no tienes un abono asignado. Contacta con administración para adquirir uno.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 font-medium text-sm">
                  📞 Contacta con recepción para más información sobre los planes disponibles.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resto del componente continúa igual... */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🩺 Apto Médico</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoPruebaSalud.color}`}>
              {estadoPruebaSalud.texto}
            </span>
          </div>

          {loadingPruebaSalud ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando información médica...</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700">{estadoPruebaSalud.detalle}</p>
              {!pruebaSalud && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium text-sm">
                    ⚠️ Para ingresar a la pileta necesitas un certificado de aptitud física vigente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Últimos Accesos</h2>
          
          {loadingEscaneos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : escaneos.length > 0 ? (
            <div className="space-y-3">
              {escaneos.map((escaneo) => (
                <div key={escaneo._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{formatFecha(escaneo.fechaHora)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(escaneo.fechaHora).toLocaleTimeString('es-AR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    escaneo.exitoso === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {escaneo.exitoso === true ? '✓ Acceso Permitido' : '✗ Acceso Denegado'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No hay escaneos registrados</p>
          )}
        </div>
      </main>

      {/* Modal Historial */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">📋 Historial de Abonos</h2>
                <button
                  onClick={() => setShowHistorial(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingHistorial ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : historial.length > 0 ? (
                <div className="space-y-4">
                  {historial.map((item) => (
                    <div key={item._id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        {/* ✅ CAMBIO: Mostrar nombre del tipo */}
                        <h3 className="font-bold text-lg">{obtenerNombreTipoAbono(item.tipoAbono)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${obtenerEstadoAbono(item).color}`}>
                          {obtenerEstadoAbono(item).icono} {obtenerEstadoAbono(item).texto}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Precio:</p>
                          <p className="font-semibold">{formatPrecio(item.precio)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Vigencia:</p>
                          <p className="font-semibold">
                            {formatFecha(item.fechaInicio)} - {formatFecha(item.fechaFin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No hay historial de abonos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">✏️ Editar Perfil</h2>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo el administrador puede cambiar el nombre</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={editFormData.apellido}
                    onChange={(e) => setEditFormData({ ...editFormData, apellido: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo el administrador puede cambiar el apellido</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;