
import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

// Crear el contexto
const AuthContext = createContext(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, verificar si hay usuario en localStorage
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Función de login
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.usuario);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  // Función de register
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.usuario);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al registrar usuario'
      };
    }
  };

  // Función de logout
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Actualizar perfil
  const updateProfile = async (userData) => {
    try {
      const data = await authService.updateProfile(userData);
      setUser(data.usuario);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar perfil'
      };
    }
  };

  // Verificar si es admin
  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  // Verificar si está autenticado
  const isAuthenticated = () => {
    return !!user;
  };

  // Valor que se compartirá con toda la app
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};