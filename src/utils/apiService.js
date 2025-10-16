import { useAuth } from '../contexts/AuthContext';

// Servicio centralizado para peticiones HTTP
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  }

  // Método para obtener headers con usuario-id
  getHeaders(additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    // Intentar obtener el usuario del contexto
    // Nota: Como esto es una clase, necesitamos que se pase el userId desde el componente
    return headers;
  }

  // Método para hacer peticiones GET
  async get(endpoint, userId = null) {
    const headers = this.getHeaders();
    if (userId) {
      headers['x-usuario-id'] = userId.toString();
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Método para hacer peticiones POST
  async post(endpoint, data = {}, userId = null) {
    const headers = this.getHeaders();
    if (userId) {
      headers['x-usuario-id'] = userId.toString();
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Método para hacer peticiones PUT
  async put(endpoint, data = {}, userId = null) {
    const headers = this.getHeaders();
    if (userId) {
      headers['x-usuario-id'] = userId.toString();
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Método para hacer peticiones DELETE
  async delete(endpoint, userId = null) {
    const headers = this.getHeaders();
    if (userId) {
      headers['x-usuario-id'] = userId.toString();
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Hook personalizado para usar el servicio con el contexto de autenticación
export const useApi = () => {
  const { user } = useAuth();
  const apiService = new ApiService();

  // Wrapper methods that automatically include userId
  const get = (endpoint) => apiService.get(endpoint, user?.id);
  const post = (endpoint, data) => apiService.post(endpoint, data, user?.id);
  const put = (endpoint, data) => apiService.put(endpoint, data, user?.id);
  const del = (endpoint) => apiService.delete(endpoint, user?.id);

  return {
    get,
    post,
    put,
    delete: del
  };
};

// Instancia singleton para uso directo (sin hook)
export const apiService = new ApiService();