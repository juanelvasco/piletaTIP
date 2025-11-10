import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function EnfermeroUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroApto, setFiltroApto] = useState('todos'); // todos, conApto, sinApto

  useEffect(() => {
    cargarUsuarios();
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
      alert('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro de búsqueda
    const coincideBusqueda = 
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.dni.includes(busqueda) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;

    // Filtro de apto
    if (filtroApto === 'conApto') {
      return usuario.pruebaSalud !== null;
    } else if (filtroApto === 'sinApto') {
      return usuario.pruebaSalud === null;
    }

    return true; // 'todos'
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return dias;
  };

  const obtenerEstadoApto = (usuario) => {
    if (!usuario.pruebaSalud) {
      return { texto: 'Sin apto', color: 'bg-red-100 text-red-800', icono: '❌' };
    }

    // Si tiene prueba de salud, necesitamos verificar su estado
    // Como no tenemos los detalles completos aquí, solo mostramos si tiene o no
    return { texto: 'Con apto', color: 'bg-green-100 text-green-800', icono: '✅' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/enfermero/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">←</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Lista de Usuarios</h1>
                <p className="text-xs text-gray-500">Consulta de pacientes</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, apellido, DNI o email..."
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
                                    {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
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