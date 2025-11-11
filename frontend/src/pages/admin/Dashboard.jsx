import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as statsService from '../../services/statsService';

function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Estados para modal de editar perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fotoPerfil: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    abonosActivos: 0,
    accesosHoy: 0,
    pruebasVigentes: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoadingStats(true);
      
      // Cargar estadísticas en paralelo
      const [userStats, escaneoStats, saludStats] = await Promise.allSettled([
        statsService.getUserStats(),
        statsService.getEscaneoStats().catch(() => ({ hoy: 0 })),
        statsService.getSaludStats().catch(() => ({ vigentes: 0 }))
      ]);

      setStats({
        totalUsuarios: userStats.status === 'fulfilled' ? userStats.value.total : 0,
        abonosActivos: userStats.status === 'fulfilled' ? userStats.value.conAbono : 0,
        accesosHoy: escaneoStats.status === 'fulfilled' ? (escaneoStats.value.hoy || 0) : 0,
        pruebasVigentes: saludStats.status === 'fulfilled' ? (saludStats.value.vigentes || 0) : 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Cargar datos del usuario al abrir el modal
  const handleOpenEditModal = () => {
    setFormData({
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      fotoPerfil: user?.fotoPerfil || null
    });
    setPreviewImage(user?.fotoPerfil || null);
    setShowEditModal(true);
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 2MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('El archivo debe ser una imagen');
        return;
      }

      // Convertir a base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, fotoPerfil: base64String });
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios del perfil
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={user?.fotoPerfil || `https://ui-avatars.com/api/?name=${user?.nombre}+${user?.apellido}&background=8B5CF6&color=fff&size=64`}
              alt="Admin"
              className="h-12 w-12 rounded-full object-cover border-2 border-purple-500"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración 👨‍💼
              </h1>
              <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOpenEditModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              ✏️ Mi Perfil
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Card Usuarios */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios</p>
                {loadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
                )}
              </div>
              <div className="text-blue-500 text-4xl">👥</div>
            </div>
          </div>

          {/* Card Abonos */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abonos Activos</p>
                {loadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.abonosActivos}</p>
                )}
              </div>
              <div className="text-green-500 text-4xl">💳</div>
            </div>
          </div>

          {/* Card Escaneos Hoy */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accesos Hoy</p>
                {loadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.accesosHoy}</p>
                )}
              </div>
              <div className="text-purple-500 text-4xl">📱</div>
            </div>
          </div>

          {/* Card Pruebas Vigentes */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aptos Vigentes</p>
                {loadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats.pruebasVigentes}</p>
                )}
              </div>
              <div className="text-red-500 text-4xl">🏥</div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-left"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold">Gestionar Usuarios</div>
              <div className="text-sm opacity-90">Ver y editar usuarios</div>
            </button>

            <button
              onClick={() => navigate('/admin/escanear')}
              className="px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-left"
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold">Escanear QR</div>
              <div className="text-sm opacity-90">Control de acceso</div>
            </button>

            <button
              onClick={() => navigate('/admin/abonos')}
              className="px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-left"
            >
              <div className="text-2xl mb-2">💳</div>
              <div className="font-semibold">Gestionar Abonos</div>
              <div className="text-sm opacity-90">Ver y crear abonos</div>
            </button>
          </div>
        </div>

        {/* Botón para recargar estadísticas */}
        <div className="text-center">
          <button
            onClick={cargarEstadisticas}
            disabled={loadingStats}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400"
          >
            {loadingStats ? '🔄 Actualizando...' : '🔄 Actualizar Estadísticas'}
          </button>
        </div>
      </main>

      {/* ========================================================================
          ✨ MODAL EDITAR PERFIL MEJORADO ✨
      ======================================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8 animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Header con gradiente púrpura */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl">✏️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Editar Mi Perfil
                    </h2>
                    <p className="text-purple-100 text-sm">
                      Actualiza tu información personal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setPreviewImage(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Contenido del formulario */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              
              {/* Banner de privilegios de admin */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xl">👑</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-purple-700 font-bold uppercase tracking-wide mb-1">
                      Privilegios de Administrador
                    </p>
                    <p className="text-sm text-gray-700">
                      Puedes editar todos tus datos personales incluida tu foto de perfil
                    </p>
                  </div>
                </div>
              </div>

              {/* Foto de perfil mejorada */}
              <div className="flex flex-col items-center pb-4 border-b border-gray-200">
                <div className="relative mb-3">
                  <img
                    src={previewImage || `https://ui-avatars.com/api/?name=${user?.nombre}+${user?.apellido}&background=8B5CF6&color=fff&size=128`}
                    alt="Preview"
                    className="h-28 w-28 rounded-full object-cover border-4 border-purple-100 shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 bg-purple-500 rounded-full p-2 shadow-lg">
                    <span className="text-white text-xl">📷</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {previewImage ? '🔄 Cambiar foto' : '📁 Subir foto'}
                  </label>
                  
                  {previewImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, fotoPerfil: null });
                        setPreviewImage(null);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-all"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Máximo 2MB - JPG, PNG o GIF</p>
              </div>

              {/* Campos del formulario con iconos */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">👤</span> Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Ingresa tu nombre"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">👤</span> Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Ingresa tu apellido"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="mr-2">📧</span> Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="mr-2">📱</span> Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="1156789012"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setPreviewImage(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-bold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Guardar Cambios</span>
                    </>
                  )}
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