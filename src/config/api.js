// Configuración de API para desarrollo y producción
const API_CONFIG = {
  // Usa VITE_API_URL si está definida, sino localhost para desarrollo
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  
  // Configuración para diferentes ambientes
  endpoints: {
    vehiculos: '/vehiculos',
    vehiculosImagenes: '/vehiculos/imagenes',
    chofer: '/chofer',
    reportes: '/reportes'
  }
};

// Exportar baseURL para uso directo
export const API_BASE_URL = API_CONFIG.baseURL;

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint] || endpoint}`;
};

// Función helper para hacer requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export default API_CONFIG;
