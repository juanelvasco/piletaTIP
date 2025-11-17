import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as abonoService from '../../services/abonoService';
import * as escaneoService from '../../services/escaneoService';
import QRCode from 'qrcode';

function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const qrCanvasRef = useRef(null);

  // Estados para el abono
  const [abono, setAbono] = useState(null);
  const [loadingAbono, setLoadingAbono] = useState(true);
  
  // Estados para el historial de abonos
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Estados para historial de accesos
  const [historialAccesos, setHistorialAccesos] = useState([]);
  const [loadingAccesos, setLoadingAccesos] = useState(true);

  // Estados para modal de editar perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    fotoPerfil: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generar QR cuando se monta el componente
  useEffect(() => {
    if (user?.qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, user.qrCode, {
        width: 140,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [user]);

  // Cargar abono actual
  useEffect(() => {
    const cargarAbono = async () => {
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
    };

    cargarAbono();
  }, []);

  // Cargar historial de accesos
  useEffect(() => {
    const cargarHistorialAccesos = async () => {
      try {
        setLoadingAccesos(true);
        const data = await escaneoService.getMiHistorial(5); // Últimos 5 accesos
        setHistorialAccesos(data.escaneos || []);
      } catch (error) {
        console.error('Error al cargar historial de accesos:', error);
        setHistorialAccesos([]);
      } finally {
        setLoadingAccesos(false);
      }
    };

    cargarHistorialAccesos();
  }, []);

  // Cargar historial de abonos
  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await abonoService.getMiHistorial();
      setHistorial(data.abonos || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleVerHistorial = async () => {
    setShowHistorial(true);
    await cargarHistorial();
  };

  const handleOpenEditModal = () => {
    setFormData({
      email: user?.email || '',
      telefono: user?.telefono || '',
      fotoPerfil: user?.fotoPerfil || null
    });
    setPreviewImage(user?.fotoPerfil || null);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 2MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('El archivo debe ser una imagen');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, fotoPerfil: base64String });
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setShowEditModal(false);
        alert('Perfil actualizado exitosamente');
      } else {
        alert(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      alert('Error al actualizar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
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

  const estadoAbono = obtenerEstadoAbono();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tarjeta de perfil */}
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
            {/* Columna izquierda - Datos */}
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

            {/* Columna derecha - QR */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <p className="text-sm text-gray-700 mb-3 font-semibold">📱 Mi Código QR</p>
              {user?.qrCode ? (
                <>
                  {/* QR Visual */}
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

        {/* Card de Abono - Destacada */}
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
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">Tipo de Abono</p>
                  <p className="text-lg font-bold text-blue-900 capitalize">{abono.tipoAbono}</p>
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

              {/* Fechas */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                    <p className="font-semibold text-gray-900">{formatFecha(abono.fechaInicio)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Vencimiento</p>
                    <p className="font-semibold text-gray-900">{formatFecha(abono.fechaFin)}</p>
                  </div>
                </div>
              </div>

              {/* Estado de pago */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estado de Pago</p>
                    {abono.pagado ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Pagado
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {abono.metodoPago && `Método: ${abono.metodoPago}`}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Pendiente
                      </span>
                    )}
                  </div>
                  {abono.pagado && abono.fechaPago && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fecha de Pago</p>
                      <p className="font-semibold text-gray-900">{formatFecha(abono.fechaPago)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alertas */}
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

        {/* Cards de información secundaria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Historial de Accesos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-blue-500 text-3xl">🚪</div>
                <h3 className="text-lg font-semibold">Historial de Accesos</h3>
              </div>
              <button
                onClick={() => navigate('/usuario/mi-qr')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos →
              </button>
            </div>

            {loadingAccesos ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando...</p>
              </div>
            ) : historialAccesos.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No hay accesos registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historialAccesos.map((acceso, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${acceso.exitoso ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {acceso.exitoso ? '✅ Acceso permitido' : '❌ Acceso denegado'}
                        </p>
                        <p className="text-xs text-gray-500">{formatFechaHora(acceso.fecha)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Salud */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-500 text-3xl mb-2">🏥</div>
            <h3 className="text-lg font-semibold mb-2">Prueba de Salud</h3>
            <p className="text-gray-600 text-sm">
              {user?.pruebaSalud ? 'Vigente' : 'Sin registrar'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              La prueba de salud es requerida para acceder a la pileta
            </p>
          </div>
        </div>
      </main>

      {/* Modal Historial de Abonos */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Historial de Abonos
                </h2>
                <button
                  onClick={() => setShowHistorial(false)}
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
              ) : historial.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600">No hay abonos registrados en tu historial</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historial.map((abonoHistorial) => {
                    const estadoAbonoHistorial = obtenerEstadoAbono(abonoHistorial);
                    return (
                      <div
                        key={abonoHistorial._id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-lg font-semibold capitalize">
                              {abonoHistorial.tipoAbono}
                            </span>
                            <p className="text-sm text-gray-600">
                              {formatFecha(abonoHistorial.fechaInicio)} - {formatFecha(abonoHistorial.fechaFin)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoAbonoHistorial.color}`}>
                            {estadoAbonoHistorial.icono} {estadoAbonoHistorial.texto}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Precio</p>
                            <p className="font-semibold">{formatPrecio(abonoHistorial.precio)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estado de Pago</p>
                            <p className="font-semibold">
                              {abonoHistorial.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                            </p>
                          </div>
                          {abonoHistorial.metodoPago && abonoHistorial.metodoPago !== 'pendiente' && (
                            <div>
                              <p className="text-gray-600">Método de Pago</p>
                              <p className="font-semibold capitalize">{abonoHistorial.metodoPago}</p>
                            </div>
                          )}
                          {abonoHistorial.pagado && (
                            <div>
                              <p className="text-gray-600">Días Usados</p>
                              <p className="font-semibold">
                                {Math.max(0, Math.ceil((new Date() - new Date(abonoHistorial.fechaInicio)) / (1000 * 60 * 60 * 24)))} días
                              </p>
                            </div>
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
                onClick={() => setShowHistorial(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Editar Perfil
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center mb-4">
                <div className="mb-2">
                  <img
                    src={previewImage || `https://ui-avatars.com/api/?name=${user?.nombre}+${user?.apellido}&background=3B82F6&color=fff&size=128`}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {previewImage ? 'Cambiar foto' : 'Subir foto'}
                </label>
                {previewImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, fotoPerfil: null });
                      setPreviewImage(null);
                    }}
                    className="mt-2 text-red-600 text-sm hover:text-red-800"
                  >
                    Eliminar foto
                  </button>
                )}
              </div>

              {/* Información no editable */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Nombre:</strong> {user?.nombre} {user?.apellido}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>DNI:</strong> {user?.dni}
                </p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  * Estos datos solo pueden ser modificados por un administrador
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ingrese su teléfono"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setPreviewImage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
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