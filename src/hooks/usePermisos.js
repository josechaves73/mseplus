import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../config/api';

// Contexto de usuario (por ahora usaremos un estado global simple)
const UserContext = React.createContext({
  currentUser: { id: 1, username: 'admin', nombre_completo: 'Administrador del Sistema' },
  permisos: {},
  loadingPermisos: true
});

// Hook personalizado para verificar permisos
export const usePermisos = () => {
  const { permisos, loadingPermisos } = useContext(UserContext);

  const tienePermiso = (modulo, submodulo, accion) => {
    if (loadingPermisos) return false;

    const key = `${modulo}.${submodulo}.${accion}`;
    return permisos[key] === true;
  };

  const puedeVer = (modulo, submodulo) => tienePermiso(modulo, submodulo, 'ver');
  const puedeCrear = (modulo, submodulo) => tienePermiso(modulo, submodulo, 'crear');
  const puedeEditar = (modulo, submodulo) => tienePermiso(modulo, submodulo, 'editar');
  const puedeEliminar = (modulo, submodulo) => tienePermiso(modulo, submodulo, 'eliminar');

  return {
    tienePermiso,
    puedeVer,
    puedeCrear,
    puedeEditar,
    puedeEliminar,
    loadingPermisos
  };
};

// Hook para cargar permisos del usuario actual
export const useLoadPermisos = () => {
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermisos = async () => {
      try {
        // Por ahora cargamos permisos del admin (usuario ID 1)
        const response = await fetch(`${API_BASE_URL}/permisos/usuario/1`);
        if (response.ok) {
          const data = await response.json();
          // Convertir array de permisos a objeto clave-valor
          const permisosObj = {};
          data.forEach(permiso => {
            const key = `${permiso.modulo}.${permiso.submodulo}.${permiso.accion}`;
            permisosObj[key] = permiso.permitido;
          });
          setPermisos(permisosObj);
        } else {
          // Si no hay API, dar todos los permisos por defecto (modo desarrollo)
          console.log('⚠️ API de permisos no disponible, usando modo desarrollo');
          setPermisos({
            'articulos.lista_articulos.ver': true,
            'articulos.lista_articulos.crear': true,
            'articulos.lista_articulos.editar': true,
            'boletas.lista_boletas.ver': true,
            'boletas.lista_boletas.crear': true,
            'boletas.lista_boletas.editar': true,
            'boletas.lista_boletas.auditar': true,
            // ... más permisos por defecto
          });
        }
      } catch (error) {
        console.error('Error cargando permisos:', error);
        // Modo fallback - todos los permisos
        setPermisos({});
      } finally {
        setLoading(false);
      }
    };

    loadPermisos();
  }, []);

  return { permisos, loading };
};

// Componente wrapper para botones con permisos
export const PermisoButton = ({
  modulo,
  submodulo,
  accion,
  children,
  onClick,
  disabled,
  ...props
}) => {
  const { tienePermiso } = usePermisos();

  if (!tienePermiso(modulo, submodulo, accion)) {
    return null; // No mostrar el botón si no tiene permiso
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Componente wrapper para secciones completas
export const PermisoSection = ({
  modulo,
  submodulo,
  accion = 'ver',
  fallback = null,
  children
}) => {
  const { tienePermiso } = usePermisos();

  if (!tienePermiso(modulo, submodulo, accion)) {
    return fallback; // Mostrar fallback o null si no tiene permiso
  }

  return children;
};

export { UserContext };
