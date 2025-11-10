import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function CargarApto() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Form data
  const [diasValidez, setDiasValidez] = useState('15');
  const [diasCustom, setDiasCustom] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);

  // Opciones predefinidas de días
  const opcionesDias = [
    { valor: '1', etiqueta: '1 día' },
    { valor: '3', etiqueta: '3 días' },
    { valor: '7', etiqueta: '7 días (1 semana)' },
    { valor: '14', etiqueta: '14 días (2 semanas)' },
    { valor: '15', etiqueta: '15 días' },
    { valor: '30', etiqueta: '30 días (1 mes)' },
    { valor: 'custom', etiqueta: 'Personalizado...' }
  ];

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          limit: 1000, // Cargar todos los usuarios
          activo: true // Solo usuarios activos
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

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.dni.includes(busqueda) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModal(true);
    setDiasValidez('15');
    setDiasCustom('');
    setNotas('');
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setUsuarioSeleccionado(null);
    setDiasValidez('15');
    setDiasCustom('');
    setNotas('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuarioSeleccionado) return;

    // Determinar los días de validez finales
    let diasFinales = diasValidez === 'custom' ? parseInt(diasCustom) : parseInt(diasValidez);
    
    // Validar días
    if (!diasFinales || diasFinales < 1 || diasFinales > 365) {
      alert('Por favor ingrese un número válido de días entre 1 y 365');
      return;
    }

    try {
      setCargando(true);
      
      await api.post('/salud', {
        usuarioId: usuarioSeleccionado._id,
        diasValidez: diasFinales,
        notas: notas.trim() || undefined
      });

      alert(`✅ Apto físico cargado exitosamente para ${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellido}\nValidez: ${diasFinales} días`);
      
      cerrarModal();
      cargarUsuarios(); // Recargar para actualizar los datos
      
    } catch (error) {
      console.error('Error al cargar apto físico:', error);
      alert(error.response?.data?.message || 'Error al cargar el apto físico');
    } finally {
      setCargando(false);
    }
  };

  // Calcular fecha de vencimiento estimada
  const calcularFechaVencimiento = () => {
    if (!diasValidez) return '';
    
    const dias = diasValidez === 'custom' ? parseInt(diasCustom) : parseInt(diasValidez);
    if (!dias || isNaN(dias)) return '';
    
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/enfermero/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">←</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Cargar Apto Físico</h1>
                <p className="text-xs text-gray-500">Seleccione un usuario</p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, apellido, DNI o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-3.5 text-xl">🔍</span>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Apto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
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
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {usuario.nombre} {usuario.apellido}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {usuario.pruebaSalud ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ Tiene apto
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              ❌ Sin apto
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => abrirModal(usuario)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            🏥 Cargar Apto
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {mostrarModal && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-t-xl">
              <h3 className="text-2xl font-bold text-white">🏥 Cargar Apto Físico</h3>
              <p className="text-green-50 mt-1">
                {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Usuario Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>DNI:</strong> {usuarioSeleccionado.dni}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {usuarioSeleccionado.email}
                </p>
              </div>

              {/* Días de Validez */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Validez *
                </label>
                <select
                  value={diasValidez}
                  onChange={(e) => setDiasValidez(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  {opcionesDias.map(opcion => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Days Input */}
              {diasValidez === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Días (1-365)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={diasCustom}
                    onChange={(e) => setDiasCustom(e.target.value)}
                    placeholder="Ingrese cantidad de días"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Fecha de Vencimiento Estimada */}
              {calcularFechaVencimiento() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>📅 Fecha de vencimiento:</strong> {calcularFechaVencimiento()}
                  </p>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="3"
                  placeholder="Observaciones adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={cargando}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? '⏳ Guardando...' : '✅ Confirmar Apto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CargarApto;
