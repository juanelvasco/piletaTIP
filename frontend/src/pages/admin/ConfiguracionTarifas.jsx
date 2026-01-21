// frontend/src/pages/admin/ConfiguracionTarifas.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function ConfiguracionTarifas() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado de tipos de abono
  const [tiposAbono, setTiposAbono] = useState([]);
  const [tiposOriginales, setTiposOriginales] = useState([]);

  // Modal para agregar nuevo tipo
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({
    nombre: '',
    precio: '',
    duracionDias: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/configuracion');
      
      if (response.data.success) {
        const tipos = response.data.configuracion.tiposAbono || [];
        setTiposAbono([...tipos]);
        setTiposOriginales(JSON.parse(JSON.stringify(tipos)));
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTipo = (id, campo, valor) => {
    setTiposAbono(tiposAbono.map(tipo => 
      tipo.id === id ? { ...tipo, [campo]: valor } : tipo
    ));
  };

  const hayaCambios = () => {
    return JSON.stringify(tiposAbono) !== JSON.stringify(tiposOriginales);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError('');
      setSuccess('');

      // Validar que todos los precios sean válidos
      for (const tipo of tiposAbono) {
        if (tipo.precio < 0) {
          setError(`El precio de ${tipo.nombre} no puede ser negativo`);
          return;
        }
        if (tipo.duracionDias < 1) {
          setError(`La duración de ${tipo.nombre} debe ser al menos 1 día`);
          return;
        }
      }

      // Actualizar cada tipo modificado
      for (const tipo of tiposAbono) {
        const original = tiposOriginales.find(t => t.id === tipo.id);
        
        // Si es diferente, actualizar
        if (JSON.stringify(tipo) !== JSON.stringify(original)) {
          await api.put(`/configuracion/tipos-abono/${tipo.id}`, {
            nombre: tipo.nombre,
            precio: tipo.precio,
            duracionDias: tipo.duracionDias,
            descripcion: tipo.descripcion,
            activo: tipo.activo
          });
        }
      }

      setSuccess('¡Cambios guardados correctamente!');
      setTiposOriginales(JSON.parse(JSON.stringify(tiposAbono)));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setTiposAbono(JSON.parse(JSON.stringify(tiposOriginales)));
    setError('');
    setSuccess('');
  };

  const handleAgregarNuevo = async () => {
    try {
      // Validar
      if (!nuevoTipo.nombre || !nuevoTipo.precio || !nuevoTipo.duracionDias) {
        setError('Nombre, precio y duración son obligatorios');
        return;
      }

      if (nuevoTipo.precio < 0) {
        setError('El precio no puede ser negativo');
        return;
      }

      if (nuevoTipo.duracionDias < 1) {
        setError('La duración debe ser al menos 1 día');
        return;
      }

      setGuardando(true);
      setError('');

      const response = await api.post('/configuracion/tipos-abono', nuevoTipo);

      if (response.data.success) {
        setSuccess('¡Tipo de abono agregado correctamente!');
        setShowModalNuevo(false);
        setNuevoTipo({ nombre: '', precio: '', duracionDias: '', descripcion: '' });
        await cargarConfiguracion();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error al agregar tipo:', err);
      setError(err.response?.data?.message || 'Error al agregar tipo de abono');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setGuardando(true);
      setError('');

      await api.delete(`/configuracion/tipos-abono/${id}`);

      setSuccess('Tipo de abono eliminado correctamente');
      await cargarConfiguracion();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar tipo de abono');
    } finally {
      setGuardando(false);
    }
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Configuración de Tarifas</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            💳 Gestión de Tipos de Abono
          </h2>
          <p className="text-gray-600">
            Administra los tipos de abono disponibles. Puedes agregar, editar o eliminar tipos según tus necesidades.
          </p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">✅ {success}</p>
          </div>
        )}

        {/* Botón Agregar Nuevo */}
        <div className="mb-6">
          <button
            onClick={() => setShowModalNuevo(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Agregar Nuevo Tipo de Abono</span>
          </button>
        </div>

        {/* Lista de Tipos de Abono */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white">Tipos de Abono Configurados</h3>
          </div>

          <div className="p-6">
            {tiposAbono.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No hay tipos de abono configurados</p>
                <p className="text-sm">Agrega el primer tipo usando el botón "+"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tiposAbono.map((tipo) => (
                  <div key={tipo.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Tipo
                        </label>
                        <input
                          type="text"
                          value={tipo.nombre}
                          onChange={(e) => handleChangeTipo(tipo.id, 'nombre', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                        />
                      </div>
                      <button
                        onClick={() => handleEliminar(tipo.id, tipo.nombre)}
                        disabled={guardando || tiposAbono.filter(t => t.activo).length <= 1}
                        className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={tiposAbono.filter(t => t.activo).length <= 1 ? "No puedes eliminar el último tipo activo" : "Eliminar tipo"}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Precio (ARS)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={tipo.precio}
                          onChange={(e) => handleChangeTipo(tipo.id, 'precio', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatPrecio(tipo.precio)}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duración (días)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={tipo.duracionDias}
                          onChange={(e) => handleChangeTipo(tipo.id, 'duracionDias', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {tipo.duracionDias === 1 ? '1 día' : `${tipo.duracionDias} días`}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={tipo.activo ? 'activo' : 'inactivo'}
                          onChange={(e) => handleChangeTipo(tipo.id, 'activo', e.target.value === 'activo')}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="activo">✅ Activo</option>
                          <option value="inactivo">❌ Inactivo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción (opcional)
                      </label>
                      <input
                        type="text"
                        value={tipo.descripcion || ''}
                        onChange={(e) => handleChangeTipo(tipo.id, 'descripcion', e.target.value)}
                        placeholder="Ej: Ideal para uso frecuente"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-900 mb-1">Importante</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los cambios se aplicarán inmediatamente a nuevas compras</li>
                <li>• Los abonos ya vendidos mantienen su configuración original</li>
                <li>• Puedes desactivar tipos sin eliminarlos</li>
                <li>• Debe haber al menos 1 tipo activo en el sistema</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        {hayaCambios() && (
          <div className="flex space-x-4">
            <button
              onClick={handleCancelar}
              disabled={guardando}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? '⏳ Guardando...' : '✅ Guardar Cambios'}
            </button>
          </div>
        )}
      </main>

      {/* Modal Agregar Nuevo */}
      {showModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">➕ Agregar Nuevo Tipo de Abono</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Tipo *
                </label>
                <input
                  type="text"
                  value={nuevoTipo.nombre}
                  onChange={(e) => setNuevoTipo({ ...nuevoTipo, nombre: e.target.value })}
                  placeholder="Ej: Trimestral Adultos Mayores"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (ARS) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={nuevoTipo.precio}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, precio: parseFloat(e.target.value) })}
                    placeholder="15000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (días) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoTipo.duracionDias}
                    onChange={(e) => setNuevoTipo({ ...nuevoTipo, duracionDias: parseInt(e.target.value) })}
                    placeholder="30"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={nuevoTipo.descripcion}
                  onChange={(e) => setNuevoTipo({ ...nuevoTipo, descripcion: e.target.value })}
                  placeholder="Ej: Descuento especial para mayores de 65 años"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModalNuevo(false);
                    setNuevoTipo({ nombre: '', precio: '', duracionDias: '', descripcion: '' });
                    setError('');
                  }}
                  disabled={guardando}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarNuevo}
                  disabled={guardando}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {guardando ? '⏳ Agregando...' : '✅ Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfiguracionTarifas;