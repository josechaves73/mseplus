import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [userConfig, setUserConfig] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar la app
  useEffect(() => {
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem('mse_user');
      const savedPermissions = localStorage.getItem('mse_permissions');
      const savedConfig = localStorage.getItem('mse_config');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setPermissions(JSON.parse(savedPermissions || '[]'));
          setUserConfig(JSON.parse(savedConfig || '{}'));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al cargar datos de autenticación:', error);
          logout();
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Función de login
  const login = async (userData, userPermissions, userConfiguration) => {
    try {
      setUser(userData);
      setPermissions(userPermissions);
      setUserConfig(userConfiguration);
      setIsAuthenticated(true);

      // Guardar en localStorage para persistencia básica
      localStorage.setItem('mse_user', JSON.stringify(userData));
      localStorage.setItem('mse_permissions', JSON.stringify(userPermissions));
      localStorage.setItem('mse_config', JSON.stringify(userConfiguration));

      console.log('✅ Usuario autenticado:', userData.username);
      console.log('🔐 Permisos cargados:', userPermissions.length);
      console.log('⚙️ Configuración cargada:', Object.keys(userConfiguration).length, 'items');

    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    setPermissions([]);
    setUserConfig({});
    setIsAuthenticated(false);

    // Limpiar localStorage
    localStorage.removeItem('mse_user');
    localStorage.removeItem('mse_permissions');
    localStorage.removeItem('mse_config');

    console.log('👋 Usuario desconectado');
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (modulo, submodulo, accion) => {
    if (!isAuthenticated) {
      console.log('❌ Usuario no autenticado');
      return false;
    }

    // Admin tiene todos los permisos
    if (user?.rol === 'admin') {
      console.log('✅ Usuario admin - acceso total');
      return true;
    }

    console.log('🔍 Verificando permiso:', { modulo, submodulo, accion });
    console.log('📋 Permisos del usuario:', permissions);

    const result = permissions.some(perm =>
      perm.modulo === modulo &&
      perm.submodulo === submodulo &&
      perm.accion === accion &&
      perm.permitido === 1
    );

    console.log('🎯 Resultado:', result);
    return result;
  };

  // Obtener configuración del usuario
  const getUserConfig = (clave, defaultValue = null) => {
    return userConfig[clave] || defaultValue;
  };

  const value = {
    // Estados
    user,
    permissions,
    userConfig,
    isAuthenticated,
    loading,

    // Funciones
    login,
    logout,
    hasPermission,
    getUserConfig
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
