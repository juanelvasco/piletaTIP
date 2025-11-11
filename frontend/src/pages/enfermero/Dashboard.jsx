import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function EnfermeroDashboard() {
  const { user: usuario, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    pruebasSaludVigentes: 0,
    pruebasProximasVencer: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas de usuarios
      const resUsuarios = await api.get('/users/estadisticas');
      
      // Cargar estadísticas de salud
      const resSalud = await api.get('/salud/estadisticas');
      
      setStats({
        totalUsuarios: resUsuarios.data.total,
        pruebasSaludVigentes: resSalud.data.vigentes,
        pruebasProximasVencer: resSalud.data.alertas
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🏥</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">piletaTIP</h1>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido/a, {usuario?.nombre}! 👋
          </h2>
          <p className="text-gray-600">
            Panel de control para gestión de aptos médicos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Usuarios */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.totalUsuarios}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Pruebas Vigentes */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Aptos Vigentes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.pruebasSaludVigentes}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          {/* Próximas a Vencer */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Por Vencer</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats.pruebasProximasVencer}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cargar Apto Físico */}
          <Link
            to="/enfermero/cargar-apto"
            className="block bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-4xl">🏥</span>
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Cargar Apto Físico</h3>
                <p className="text-green-100">Registrar nuevo apto médico</p>
              </div>
            </div>
          </Link>

          {/* Ver Usuarios */}
          <Link
            to="/enfermero/usuarios"
            className="block bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-4xl">📋</span>
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Ver Usuarios</h3>
                <p className="text-blue-100">Lista completa de usuarios</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={cargarEstadisticas}
            disabled={loading}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            {loading ? '🔄 Actualizando...' : '🔄 Actualizar Estadísticas'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default EnfermeroDashboard;