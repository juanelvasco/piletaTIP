import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { provincias, provinciasYLocalidades } from '../../data/provinciasYLocalidades';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    telefono: '',
    provincia: 'Buenos Aires',
    localidad: 'General Belgrano',
    otraLocalidad: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localidadesDisponibles, setLocalidadesDisponibles] = useState(provinciasYLocalidades['Buenos Aires']);
  const [mostrarOtraLocalidad, setMostrarOtraLocalidad] = useState(false);

  const handleProvinciaChange = (e) => {
    const nuevaProvincia = e.target.value;
    const nuevasLocalidades = provinciasYLocalidades[nuevaProvincia];
    
    setFormData({
      ...formData,
      provincia: nuevaProvincia,
      localidad: nuevasLocalidades[0],
      otraLocalidad: ''
    });
    
    setLocalidadesDisponibles(nuevasLocalidades);
    setMostrarOtraLocalidad(false);
    
    if (error) setError('');
  };

  const handleLocalidadChange = (e) => {
    const nuevaLocalidad = e.target.value;
    
    if (nuevaLocalidad === 'Otra') {
      setMostrarOtraLocalidad(true);
      setFormData({
        ...formData,
        localidad: nuevaLocalidad,
        otraLocalidad: ''
      });
    } else {
      setMostrarOtraLocalidad(false);
      setFormData({
        ...formData,
        localidad: nuevaLocalidad,
        otraLocalidad: ''
      });
    }
    
    if (error) setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (!formData.nombre || !formData.apellido || !formData.email || 
        !formData.password || !formData.dni || !formData.provincia || !formData.localidad) {
      setError('Por favor complete todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.localidad === 'Otra' && !formData.otraLocalidad.trim()) {
      setError('Por favor ingrese su localidad');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos
      const { confirmPassword, otraLocalidad, ...userData } = formData;
      
      // Usar otraLocalidad si seleccionó "Otra"
      const dataToSend = {
        ...userData,
        localidad: formData.localidad === 'Otra' ? formData.otraLocalidad : formData.localidad
      };
      
      console.log('Datos a enviar:', dataToSend); // DEBUG
      
      const result = await register(dataToSend);

      if (result.success) {
        navigate('/usuario/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al registrar. Intente nuevamente.');
      console.error('Error en registro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏊</div>
          <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-600 mt-2">Regístrate para acceder a la pileta</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Juan"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Pérez"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          {/* DNI y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                DNI *
              </label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="40123456"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="1156789012"
                disabled={loading}
              />
            </div>
          </div>

          {/* Provincia y Localidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provincia */}
            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-2">
                Provincia *
              </label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleProvinciaChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                disabled={loading}
              >
                {provincias.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Localidad */}
            <div>
              <label htmlFor="localidad" className="block text-sm font-medium text-gray-700 mb-2">
                Localidad *
              </label>
              <select
                id="localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleLocalidadChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                disabled={loading}
              >
                {localidadesDisponibles.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Otra Localidad (condicional) */}
          {mostrarOtraLocalidad && (
            <div>
              <label htmlFor="otraLocalidad" className="block text-sm font-medium text-gray-700 mb-2">
                Ingrese su localidad *
              </label>
              <input
                type="text"
                id="otraLocalidad"
                name="otraLocalidad"
                value={formData.otraLocalidad}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Escriba el nombre de su localidad"
                disabled={loading}
              />
            </div>
          )}

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registrando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;