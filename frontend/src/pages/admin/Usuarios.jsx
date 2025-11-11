//============================================================================
// PÁGINA: Panel de Usuarios del Administrador
// UBICACIÓN: frontend/src/pages/admin/Usuarios.jsx
// DESCRIPCIÓN: Gestión completa de usuarios (crear, editar, banear, filtrar)
//              ✨ TODOS LOS MODALES MEJORADOS - INCLUYE MODAL DE ÉXITO PARA EDICIÓN ✨
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';

function Usuarios() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ============================================================================
  // ESTADOS - Datos y UI
  // ============================================================================
  
  // Lista de usuarios y estado de carga
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para paginación y filtros
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');

  // Estados para modal de crear/editar usuario
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

  // Estados para modal de baneo
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [motivoBaneo, setMotivoBaneo] = useState('');

  // ============================================================================
  // NUEVO: Estados para modales de éxito (creación Y edición)
  // ============================================================================
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null); // Datos del usuario procesado
  const [successType, setSuccessType] = useState('create'); // 'create' o 'edit'

  // ============================================================================
  // FUNCIÓN: Cargar lista de usuarios del backend
  // ============================================================================
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        rol: filtroRol
      };

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

  // ============================================================================
  // EFFECT: Cargar usuarios cuando cambian filtros o página
  // ============================================================================
  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtroRol, filtroActivo]);

  // ============================================================================
  // EFFECT: Búsqueda con delay (debounce) - 500ms
  // ============================================================================
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

  // ============================================================================
  // FUNCIÓN: Manejar selección de imagen (convierte a base64)
  // ============================================================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({...formData, fotoPerfil: reader.result});
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============================================================================
  // FUNCIÓN: Abrir modal para crear nuevo usuario
  // ============================================================================
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

  // ============================================================================
  // FUNCIÓN: Abrir modal para editar usuario existente
  // ============================================================================
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
      fotoPerfil: usuario.fotoPerfil
    });
    setPreviewImage(usuario.fotoPerfil);
    setShowModal(true);
  };

  // ============================================================================
  // FUNCIÓN: Guardar usuario (crear o actualizar)
  // NUEVO: Muestra modal de éxito tanto para creación como edición
  // ============================================================================
  const handleGuardar = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // ========================================
        // MODO EDICIÓN: Actualizar usuario existente
        // ========================================
        const dataToSend = {...formData};
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
        
        const response = await userService.updateUser(editingUser._id, dataToSend);
        
        // Preparar datos para el modal de éxito (EDICIÓN)
        setSuccessData({
          ...formData,
          id: editingUser._id,
          qrCode: response.usuario?.qrCode || editingUser.qrCode || 'No disponible',
          cambiosRealizados: {
            nombre: editingUser.nombre !== formData.nombre,
            apellido: editingUser.apellido !== formData.apellido,
            email: editingUser.email !== formData.email,
            dni: editingUser.dni !== formData.dni,
            telefono: editingUser.telefono !== formData.telefono,
            rol: editingUser.rol !== formData.rol,
            fotoPerfil: editingUser.fotoPerfil !== formData.fotoPerfil,
            password: !!formData.password
          }
        });
        
        setSuccessType('edit');
        setShowModal(false);
        setPreviewImage(null);
        setShowSuccessModal(true);
        cargarUsuarios();
        
      } else {
        // ========================================
        // MODO CREACIÓN: Crear nuevo usuario
        // ========================================
        const response = await userService.createUser(formData);
        
        // Preparar datos para el modal de éxito (CREACIÓN)
        setSuccessData({
          ...formData,
          qrCode: response.usuario?.qrCode || 'Generado automáticamente',
          id: response.usuario?._id
        });
        
        setSuccessType('create');
        setShowModal(false);
        setPreviewImage(null);
        setShowSuccessModal(true);
        cargarUsuarios();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  // ============================================================================
  // FUNCIÓN: Cerrar modal de éxito
  // ============================================================================
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
    setSuccessType('create');
  };

  // ============================================================================
  // FUNCIÓN: Abrir modal de baneo
  // ============================================================================
  const handleBanModalOpen = (usuario) => {
    setUserToBan(usuario);
    setMotivoBaneo(usuario.motivoBaneo || '');
    setShowBanModal(true);
  };

  // ============================================================================
  // FUNCIÓN: Confirmar baneo/desbaneo
  // ============================================================================
  const handleBanConfirm = async () => {
    try {
      await userService.toggleBanUser(userToBan._id, {
        motivo: motivoBaneo
      });
      
      alert(userToBan.baneado ? '✅ Usuario desbaneado exitosamente' : '✅ Usuario baneado exitosamente');
      setShowBanModal(false);
      setUserToBan(null);
      setMotivoBaneo('');
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al procesar baneo');
    }
  };

  // ============================================================================
  // FUNCIÓN: Obtener emoji e información según el rol
  // ============================================================================
  const getRolInfo = (rol) => {
    switch(rol) {
      case 'admin':
        return { emoji: '👑', label: 'Administrador', color: 'purple' };
      case 'enfermero':
        return { emoji: '🏥', label: 'Enfermero', color: 'green' };
      default:
        return { emoji: '👤', label: 'Usuario', color: 'gray' };
    }
  };

  // ============================================================================
  // RENDER: Componente principal
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========================================================================
          HEADER
      ======================================================================== */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700"
              >
                <span className="text-white text-xl">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================
          MAIN CONTENT
      ======================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ====================================================================
            CONTROLES: Búsqueda, filtros y botón crear
        ==================================================================== */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-3">
            
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los roles</option>
              <option value="usuario">Usuario</option>
              <option value="enfermero">Enfermero</option>
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

            <button
              onClick={handleCrear}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {/* ====================================================================
            TABLA DE USUARIOS
        ==================================================================== */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      usuarios.map((usuario) => {
                        const rolInfo = getRolInfo(usuario.rol);
                        return (
                          <tr key={usuario._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {usuario.fotoPerfil ? (
                                    <img
                                      className="h-10 w-10 rounded-full object-cover"
                                      src={usuario.fotoPerfil}
                                      alt={`${usuario.nombre} ${usuario.apellido}`}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                      {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {usuario.nombre} {usuario.apellido}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {usuario.telefono || 'Sin teléfono'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usuario.email}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {usuario.dni}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                rolInfo.color === 'purple' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : rolInfo.color === 'green'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {rolInfo.emoji} {rolInfo.label}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              {usuario.baneado ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  🚫 Baneado
                                </span>
                              ) : usuario.activo ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  ✓ Activo
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  ○ Inactivo
                                </span>
                              )}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditar(usuario)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                  title="Editar usuario"
                                >
                                  ✏️ Editar
                                </button>
                                
                                <button
                                  onClick={() => handleBanModalOpen(usuario)}
                                  className={`${
                                    usuario.baneado 
                                      ? 'text-green-600 hover:text-green-900' 
                                      : 'text-red-600 hover:text-red-900'
                                  } font-medium`}
                                  title={usuario.baneado ? 'Desbanear usuario' : 'Banear usuario'}
                                >
                                  {usuario.baneado ? '✓ Desbanear' : '🚫 Banear'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINACIÓN */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Página {page} de {totalPages} ({usuarios.length} usuarios)
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ======================================================================
          ✨ MODAL MEJORADO: CREAR/EDITAR USUARIO ✨
      ====================================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8 animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl">{editingUser ? '✏️' : '👤'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {editingUser ? 'Actualiza la información del usuario' : 'Completa el formulario para crear un usuario'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPreviewImage(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Contenido del formulario */}
            <form onSubmit={handleGuardar} className="p-6 space-y-5">
              
              {/* Foto de perfil mejorada */}
              <div className="flex flex-col items-center pb-4 border-b border-gray-200">
                <div className="relative mb-3">
                  <img
                    src={previewImage || 'https://ui-avatars.com/api/?name=Usuario&background=3B82F6&color=fff&size=128'}
                    alt="Preview"
                    className="h-28 w-28 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 shadow-lg">
                    <span className="text-white text-xl">📷</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md">
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
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej: Juan"
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
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej: Pérez"
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
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* DNI */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">🆔</span> DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="12345678"
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
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">🔒</span> Contraseña {editingUser ? '' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : '••••••••'}
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-500 mt-1">Dejar vacío para mantener la contraseña actual</p>
                  )}
                </div>
                
                {/* Rol */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">🎭</span> Rol *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="usuario">👤 Usuario</option>
                    <option value="enfermero">🏥 Enfermero</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  {editingUser ? '✅ Guardar Cambios' : '✨ Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPreviewImage(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          ✨ MODAL DE ÉXITO UNIFICADO ✨
          Muestra información tanto para creación como edición de usuarios
      ====================================================================== */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Header con gradiente dinámico */}
            <div className={`p-6 text-center ${
              successType === 'create'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}>
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-5xl">{successType === 'create' ? '✅' : '✏️'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {successType === 'create' ? '¡Usuario Creado!' : '¡Usuario Actualizado!'}
              </h2>
              <p className={`text-sm ${
                successType === 'create' ? 'text-green-50' : 'text-blue-50'
              }`}>
                {successType === 'create' 
                  ? 'El usuario ha sido registrado exitosamente en el sistema'
                  : 'Los cambios han sido guardados correctamente'}
              </p>
            </div>

            {/* Contenido con resumen del usuario */}
            <div className="p-6 space-y-4">
              
              {/* Foto de perfil del usuario */}
              <div className="flex justify-center">
                {successData.fotoPerfil ? (
                  <img
                    src={successData.fotoPerfil}
                    alt="Usuario"
                    className={`w-24 h-24 rounded-full object-cover border-4 shadow-md ${
                      successType === 'create' ? 'border-green-100' : 'border-blue-100'
                    }`}
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 shadow-md ${
                    successType === 'create' ? 'border-green-100' : 'border-blue-100'
                  }`}>
                    {successData.nombre.charAt(0)}{successData.apellido.charAt(0)}
                  </div>
                )}
              </div>

              {/* Nombre completo del usuario */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {successData.nombre} {successData.apellido}
                </h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  getRolInfo(successData.rol).color === 'purple'
                    ? 'bg-purple-100 text-purple-800'
                    : getRolInfo(successData.rol).color === 'green'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getRolInfo(successData.rol).emoji} {getRolInfo(successData.rol).label}
                </span>
              </div>

              {/* Información del usuario en cards */}
              <div className="space-y-3">
                
                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-3 flex items-start">
                  <span className="text-2xl mr-3">📧</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm text-gray-800 font-semibold break-all">
                      {successData.email}
                    </p>
                  </div>
                </div>

                {/* DNI */}
                <div className="bg-gray-50 rounded-lg p-3 flex items-start">
                  <span className="text-2xl mr-3">🆔</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">DNI</p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {successData.dni}
                    </p>
                  </div>
                </div>

                {/* Teléfono (si existe) */}
                {successData.telefono && (
                  <div className="bg-gray-50 rounded-lg p-3 flex items-start">
                    <span className="text-2xl mr-3">📱</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {successData.telefono}
                      </p>
                    </div>
                  </div>
                )}

                {/* Código QR */}
                <div className={`rounded-lg p-3 border-2 ${
                  successType === 'create' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                    : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                }`}>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🔐</span>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${
                        successType === 'create' ? 'text-blue-600' : 'text-indigo-600'
                      }`}>Código QR</p>
                      <p className="text-sm text-gray-800 font-mono font-semibold break-all">
                        {successData.qrCode}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ml-9 ${
                    successType === 'create' ? 'text-blue-600' : 'text-indigo-600'
                  }`}>
                    {successType === 'create' ? '✓ Generado automáticamente' : '✓ Código QR del usuario'}
                  </p>
                </div>

                {/* Mostrar cambios realizados (solo en edición) */}
                {successType === 'edit' && successData.cambiosRealizados && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">📝</span>
                      <div className="flex-1">
                        <p className="text-xs text-blue-700 font-bold uppercase mb-2">Cambios Realizados</p>
                        <div className="space-y-1">
                          {successData.cambiosRealizados.nombre && (
                            <p className="text-sm text-gray-700">✓ Nombre actualizado</p>
                          )}
                          {successData.cambiosRealizados.apellido && (
                            <p className="text-sm text-gray-700">✓ Apellido actualizado</p>
                          )}
                          {successData.cambiosRealizados.email && (
                            <p className="text-sm text-gray-700">✓ Email actualizado</p>
                          )}
                          {successData.cambiosRealizados.dni && (
                            <p className="text-sm text-gray-700">✓ DNI actualizado</p>
                          )}
                          {successData.cambiosRealizados.telefono && (
                            <p className="text-sm text-gray-700">✓ Teléfono actualizado</p>
                          )}
                          {successData.cambiosRealizados.rol && (
                            <p className="text-sm text-gray-700">✓ Rol actualizado</p>
                          )}
                          {successData.cambiosRealizados.fotoPerfil && (
                            <p className="text-sm text-gray-700">✓ Foto de perfil actualizada</p>
                          )}
                          {successData.cambiosRealizados.password && (
                            <p className="text-sm text-gray-700">✓ Contraseña actualizada</p>
                          )}
                          {!Object.values(successData.cambiosRealizados).some(v => v) && (
                            <p className="text-sm text-gray-500 italic">No se realizaron cambios</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credenciales de acceso (solo para creación) */}
                {successType === 'create' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div className="flex-1">
                        <p className="text-xs text-yellow-700 font-bold uppercase">Importante</p>
                        <p className="text-sm text-gray-700 mt-1">
                          El usuario ya puede iniciar sesión con:
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-gray-800">
                            <strong>Email:</strong> {successData.email}
                          </p>
                          <p className="text-gray-800">
                            <strong>Contraseña:</strong> La que configuraste
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nota informativa (solo para edición) */}
                {successType === 'edit' && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">ℹ️</span>
                      <div className="flex-1">
                        <p className="text-xs text-indigo-700 font-bold uppercase">Información</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Los cambios se han aplicado de inmediato. El usuario verá la información actualizada en su próximo inicio de sesión.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón para cerrar */}
              <button
                onClick={handleCloseSuccessModal}
                className={`w-full mt-6 py-3 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg ${
                  successType === 'create'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                }`}
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          ✨ MODAL MEJORADO: BANEAR/DESBANEAR USUARIO ✨
      ====================================================================== */}
      {showBanModal && userToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Header con gradiente dinámico según acción */}
            <div className={`p-6 text-center ${
              userToBan.baneado 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}>
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-5xl">{userToBan.baneado ? '✅' : '🚫'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {userToBan.baneado ? 'Desbanear Usuario' : 'Banear Usuario'}
              </h2>
              <p className={`text-sm ${userToBan.baneado ? 'text-green-50' : 'text-red-50'}`}>
                {userToBan.baneado 
                  ? 'El usuario podrá volver a acceder al sistema' 
                  : 'El usuario no podrá acceder al sistema'}
              </p>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-4">
              
              {/* Información del usuario a banear/desbanear */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                {userToBan.fotoPerfil ? (
                  <img
                    src={userToBan.fotoPerfil}
                    alt={`${userToBan.nombre} ${userToBan.apellido}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    {userToBan.nombre.charAt(0)}{userToBan.apellido.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">
                    {userToBan.nombre} {userToBan.apellido}
                  </p>
                  <p className="text-sm text-gray-500">{userToBan.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    getRolInfo(userToBan.rol).color === 'purple'
                      ? 'bg-purple-100 text-purple-800'
                      : getRolInfo(userToBan.rol).color === 'green'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getRolInfo(userToBan.rol).emoji} {getRolInfo(userToBan.rol).label}
                  </span>
                </div>
              </div>

              {/* Mensaje de confirmación */}
              <div className={`rounded-lg p-4 border-2 ${
                userToBan.baneado 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  userToBan.baneado ? 'text-green-800' : 'text-red-800'
                }`}>
                  {userToBan.baneado ? (
                    <>
                      <span className="text-lg mr-2">✓</span>
                      ¿Estás seguro de que deseas <strong>desbanear</strong> a este usuario? 
                      Podrá volver a acceder al sistema inmediatamente.
                    </>
                  ) : (
                    <>
                      <span className="text-lg mr-2">⚠️</span>
                      ¿Estás seguro de que deseas <strong>banear</strong> a este usuario? 
                      No podrá acceder al sistema hasta que sea desbaneado.
                    </>
                  )}
                </p>
              </div>

              {/* Campo de motivo (solo para baneo) */}
              {!userToBan.baneado && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center">
                    <span className="mr-2">📝</span> Motivo del baneo
                  </label>
                  <textarea
                    value={motivoBaneo}
                    onChange={(e) => setMotivoBaneo(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                    placeholder="Explica brevemente el motivo del baneo..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este motivo quedará registrado en el sistema
                  </p>
                </div>
              )}

              {/* Mostrar motivo anterior si existe */}
              {userToBan.baneado && userToBan.motivoBaneo && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center">
                    <span className="mr-1">📋</span> Motivo del baneo anterior:
                  </p>
                  <p className="text-sm text-gray-700 italic">
                    "{userToBan.motivoBaneo}"
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBanConfirm}
                  className={`flex-1 px-6 py-3 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg ${
                    userToBan.baneado
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                  }`}
                >
                  {userToBan.baneado ? '✅ Sí, Desbanear' : '🚫 Sí, Banear'}
                </button>
                
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setUserToBan(null);
                    setMotivoBaneo('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;