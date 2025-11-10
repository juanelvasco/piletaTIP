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

          {/* Card Pruebas Salud */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pruebas Vigentes</p>
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

      {/* Modal Editar Perfil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Editar Mi Perfil
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center mb-4">
                <div className="mb-2">
                  <img
                    src={previewImage || `https://ui-avatars.com/api/?name=${user?.nombre}+${user?.apellido}&background=8B5CF6&color=fff&size=128`}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover border-4 border-purple-200"
                  />
                </div>
                <label className="cursor-pointer bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm">
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

              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-purple-800">
                  <strong>🔑 Privilegios de Administrador:</strong> Puedes editar todos tus datos personales
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ingrese su teléfono"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
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

