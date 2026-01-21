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
import AdminDashboard from './pages/admin/Dashboard';
import Usuarios from './pages/admin/Usuarios';
import Abonos from './pages/admin/abonos';
import EscanearQR from './pages/admin/EscanearQR';
import Reportes from './pages/admin/Reportes';
import PlanillaIngresos from './pages/admin/PlanillaIngresos';
import ConfiguracionTarifas from './pages/admin/ConfiguracionTarifas'; // ← NUEVO

// Páginas de enfermero
import EnfermeroDashboard from './pages/enfermero/Dashboard';
import CargarApto from './pages/enfermero/CargarApto';
import EnfermeroUsuarios from './pages/enfermero/Usuarios';

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

          <Route
            path="/admin/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reportes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ingresos"
            element={
              <ProtectedRoute adminOnly={true}>
                <PlanillaIngresos />
              </ProtectedRoute>
            }
          />

          {/* ✅ NUEVA RUTA: Configuración de Tarifas */}
          <Route
            path="/admin/configuracion/tarifas"
            element={
              <ProtectedRoute adminOnly={true}>
                <ConfiguracionTarifas />
              </ProtectedRoute>
            }
          />

          {/* Rutas de enfermero */}
          <Route
            path="/enfermero/dashboard"
            element={
              <ProtectedRoute enfermeroOnly={true}>
                <EnfermeroDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/enfermero/cargar-apto"
            element={
              <ProtectedRoute enfermeroOnly={true}>
                <CargarApto />
              </ProtectedRoute>
            }
          />

          <Route
            path="/enfermero/usuarios"
            element={
              <ProtectedRoute enfermeroOnly={true}>
                <EnfermeroUsuarios />
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