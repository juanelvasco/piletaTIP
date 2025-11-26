import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import * as userService from '../../services/userService';

function EnfermeroUsuarios() {
  const { user: usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroApto, setFiltroApto] = useState('todos');

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers({
        page: 1,
        limit: 1000
      });
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar los usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const obtenerEstadoApto = (usuario) => {
    if (!usuario.pruebaSalud) {
      return {
        texto: 'Sin Apto',
        color: 'bg-red-100 text-red-800',
        icono: '❌'
      };
    }

    const fechaVencimiento = new Date(usuario.pruebaSalud.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return {
        texto: 'Vencido',
        color: 'bg-red-100 text-red-800',
        icono: '❌'
      };
    }

    if (diasRestantes <= 7) {
      return {
        texto: 'Por vencer',
        color: 'bg-orange-100 text-orange-800',
        icono: '⚠️'
      };
    }

    if (diasRestantes <= 30) {
      return {
        texto: 'Próximo a vencer',
        color: 'bg-yellow-100 text-yellow-800',
        icono: '⏰'
      };
    }

    return {
      texto: 'Vigente',
      color: 'bg-green-100 text-green-800',
      icono: '✅'
    };
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchBusqueda = busqueda === '' ||
      usuario.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.dni?.includes(busqueda) ||
      usuario.email?.toLowerCase().includes(busqueda.toLowerCase());

    const matchFiltro = 
      filtroApto === 'todos' ||
      (filtroApto === 'conApto' && usuario.pruebaSalud) ||
      (filtroApto === 'sinApto' && !usuario.pruebaSalud);

    return matchBusqueda && matchFiltro;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/enfermero/dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
                <p className="text-xs text-gray-500">Panel Enfermero</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{usuario?.nombre} {usuario?.apellido}</p>
                <p className="text-xs text-gray-500 capitalize">{usuario?.rol}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Lista de Usuarios 📋
          </h2>
          <p className="text-gray-600">
            Visualiza y gestiona el estado de los aptos médicos
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={cargarUsuarios}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, DNI o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-3.5 text-xl">🔍</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFiltroApto('todos')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtroApto === 'todos'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500'
              }`}
            >
              📋 Todos ({usuarios.length})
            </button>
            <button
              onClick={() => setFiltroApto('conApto')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtroApto === 'conApto'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
              }`}
            >
              ✅ Con Apto ({usuarios.filter(u => u.pruebaSalud).length})
            </button>
            <button
              onClick={() => setFiltroApto('sinApto')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtroApto === 'sinApto'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500'
              }`}
            >
              ❌ Sin Apto ({usuarios.filter(u => !u.pruebaSalud).length})
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-800">{usuarios.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Con Apto Vigente</p>
            <p className="text-2xl font-bold text-gray-800">
              {usuarios.filter(u => u.pruebaSalud).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Sin Apto</p>
            <p className="text-2xl font-bold text-gray-800">
              {usuarios.filter(u => !u.pruebaSalud).length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado Apto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado Abono</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No se encontraron usuarios con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => {
                      const estado = obtenerEstadoApto(usuario);
                      return (
                        <tr key={usuario._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {usuario.fotoPerfil ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={usuario.fotoPerfil}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white font-bold">
                                    {usuario.nombre?.charAt(0)}{usuario.apellido?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nombre} {usuario.apellido}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {usuario.rol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.dni}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.telefono || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estado.color}`}>
                              {estado.icono} {estado.texto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {usuario.abonoActual ? (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                💳 Con abono
                              </span>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Sin abono
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        <div className="mt-8 text-center">
          <Link
            to="/enfermero/cargar-apto"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg font-medium"
          >
            <span className="mr-2">🏥</span>
            Cargar Nuevo Apto Físico
          </Link>
        </div>
      </main>
    </div>
  );
}

export default EnfermeroUsuarios;
