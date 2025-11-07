import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Estados para modal de editar perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    fotoPerfil: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos del usuario al abrir el modal
  const handleOpenEditModal = () => {
    setFormData({
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">DNI</p>
              <p className="font-semibold">{user?.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-semibold">{user?.telefono || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Código QR</p>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user?.qrCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Activo
              </span>
            </div>
          </div>
        </div>

        {/* Cards de información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Abono */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-blue-500 text-3xl mb-2">💳</div>
            <h3 className="text-lg font-semibold mb-2">Mi Abono</h3>
            <p className="text-gray-600 text-sm">
              {user?.abonoActual ? 'Activo' : 'Sin abono'}
            </p>
            <button className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
              Ver Detalles
            </button>
          </div>

          {/* Card QR */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-green-500 text-3xl mb-2">📱</div>
            <h3 className="text-lg font-semibold mb-2">Mi Código QR</h3>
            <p className="text-gray-600 text-sm">
              {user?.qrCode ? 'Disponible' : 'No generado'}
            </p>
            <button className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
              Ver QR
            </button>
          </div>

          {/* Card Salud */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-500 text-3xl mb-2">🏥</div>
            <h3 className="text-lg font-semibold mb-2">Prueba de Salud</h3>
            <p className="text-gray-600 text-sm">
              {user?.pruebaSalud ? 'Vigente' : 'Sin registrar'}
            </p>
            <button className="mt-4 w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition">
              Ver Estado
            </button>
          </div>
        </div>

        {/* Mensaje temporal */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-semibold">
            🚧 Dashboard en construcción
          </p>
          <p className="text-blue-600 mt-2">
            Las funcionalidades completas se agregarán próximamente
          </p>
        </div>
      </main>

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