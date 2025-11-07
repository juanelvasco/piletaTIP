import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';

function Usuarios() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');

  // Modal crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    rol: 'usuario',
    fotoPerfil: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Modal de baneo
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [motivoBaneo, setMotivoBaneo] = useState('');

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        rol: filtroRol
      };

      // Manejar filtro de estado especial para baneados
      if (filtroActivo === 'baneado') {
        params.baneado = 'true';
      } else if (filtroActivo) {
        params.activo = filtroActivo;
      }
      
      const data = await userService.getUsers(params);
      setUsuarios(data.usuarios);
      setTotalPages(data.paginacion.totalPaginas);
      setError('');
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar usuarios cuando cambian los filtros o la página
  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroRol, filtroActivo]);

  // Buscar con delay - efecto separado para evitar loop infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        cargarUsuarios();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Manejar selección de imagen
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

  // Abrir modal para crear
  const handleCrear = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      dni: '',
      telefono: '',
      rol: 'usuario',
      fotoPerfil: null
    });
    setPreviewImage(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditar = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      dni: usuario.dni,
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      fotoPerfil: usuario.fotoPerfil || null
    });
    setPreviewImage(usuario.fotoPerfil || null);
    setShowModal(true);
  };

  // Guardar (crear o editar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Editar - no enviar password si está vacío
        const dataToSend = { ...formData };
        if (!dataToSend.password || dataToSend.password.trim() === '') {
          delete dataToSend.password;
        }
        
        await userService.updateUser(editingUser._id, dataToSend);
      } else {
        // Crear
        await userService.createUser(formData);
      }
      setShowModal(false);
      setPreviewImage(null);
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  // Abrir modal de baneo
  const handleBanear = (usuario) => {
    setUserToBan(usuario);
    setMotivoBaneo('');
    setShowBanModal(true);
  };

  // Confirmar baneo
  const confirmarBaneo = async () => {
    if (!motivoBaneo.trim()) {
      alert('Por favor ingrese un motivo del baneo');
      return;
    }

    try {
      await userService.toggleBanUser(userToBan._id, true, motivoBaneo);
      setShowBanModal(false);
      setUserToBan(null);
      setMotivoBaneo('');
      cargarUsuarios();
    } catch (err) {
      alert('Error al banear usuario');
    }
  };

  // Desbanear usuario
  const handleDesbanear = async (usuario) => {
    try {
      await userService.toggleBanUser(usuario._id, false);
      cargarUsuarios();
    } catch (err) {
      alert('Error al desbanear usuario');
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
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
              placeholder="Buscar por nombre, email o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Filtros */}
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los roles</option>
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
              <option value="baneado">Baneados</option>
            </select>

            {/* Botón crear */}
            <button
              onClick={handleCrear}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={cargarUsuarios}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No se encontraron usuarios</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={usuario.fotoPerfil || 'https://ui-avatars.com/api/?name=' + usuario.nombre + '+' + usuario.apellido + '&background=3B82F6&color=fff'}
                            alt={usuario.nombre}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                          <div className="font-medium text-gray-900">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {usuario.dni}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          usuario.rol === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.baneado ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Baneado
                          </span>
                        ) : usuario.activo ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditar(usuario)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        {usuario.baneado ? (
                          <button
                            onClick={() => handleDesbanear(usuario)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Desbanear
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanear(usuario)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Banear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center mb-4">
                <div className="mb-2">
                  <img
                    src={previewImage || 'https://ui-avatars.com/api/?name=Usuario&background=3B82F6&color=fff&size=128'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">DNI *</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Contraseña {editingUser ? '' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Rol *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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

      {/* Modal de Baneo */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Banear Usuario
            </h2>
            
            <p className="text-gray-600 mb-4">
              ¿Estás seguro que deseas banear a <strong>{userToBan?.nombre} {userToBan?.apellido}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Motivo del baneo *
              </label>
              <textarea
                value={motivoBaneo}
                onChange={(e) => setMotivoBaneo(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows="3"
                placeholder="Ingrese el motivo del baneo..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmarBaneo}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirmar Baneo
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setUserToBan(null);
                  setMotivoBaneo('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;