import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';


// Páginas de autenticación
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Páginas de usuario
import UserDashboard from './pages/user/Dashboard';
import MiQR from './pages/user/MiQR';

// Páginas de admin
import AdminDashboard from './pages/admin/dashboard';
import Usuarios from './pages/admin/Usuarios';
import Abonos from './pages/admin/abonos';
import EscanearQR from './pages/admin/EscanearQR';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas de usuario */}
          <Route
            path="/usuario/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/mi-qr"
            element={
              <ProtectedRoute>
                <MiQR />
              </ProtectedRoute>
            }
          />

          {/* Rutas de admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute adminOnly={true}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/abonos"
            element={
              <ProtectedRoute adminOnly={true}>
                <Abonos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/escanear"
            element={
              <ProtectedRoute adminOnly={true}>
                <EscanearQR />
              </ProtectedRoute>
            }
          />
          
          {/* Por ahora, las otras rutas de admin redirigen al dashboard */}
          <Route path="/admin/salud" element={<Navigate to="/admin/Dashboard" replace />} />
          <Route path="/admin/reportes" element={<Navigate to="/admin/Dashboard" replace />} />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;