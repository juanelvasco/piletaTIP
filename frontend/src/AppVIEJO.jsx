import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas de autenticación (las crearemos después)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Páginas de usuario (las crearemos después)
import UserDashboard from './pages/user/Dashboard';

// Páginas de admin (las crearemos después)
import AdminDashboard from './pages/admin/Dashboard';
import Usuarios from './pages/admin/Usuarios';
import Abonos from './pages/admin/Abonos';
import Salud from './pages/admin/Salud';
import Escanear from './pages/admin/Escanear';
import Reportes from './pages/admin/Reportes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz - redirige según el rol */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas de usuario (autenticado) */}
          <Route
            path="/usuario/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Rutas de admin (solo admins) */}
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
            path="/admin/salud"
            element={
              <ProtectedRoute adminOnly={true}>
                <Salud />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/escanear"
            element={
              <ProtectedRoute adminOnly={true}>
                <Escanear />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reportes"
            element={
              <ProtectedRoute adminOnly={true}>
                <Reportes />
              </ProtectedRoute>
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

