import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Componente para proteger rutas que requieren autenticación
export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // Mientras carga, no mostrar nada (o un spinner)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta requiere admin y no lo es, redirigir al dashboard de usuario
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/usuario/dashboard" replace />;
  }

  // Si todo está OK, mostrar el contenido
  return children;
};