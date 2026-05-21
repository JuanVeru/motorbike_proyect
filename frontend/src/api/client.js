const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Cliente HTTP personalizado basado en fetch nativo.
 * Maneja automáticamente las cabeceras de autenticación JWT y parseo JSON.
 */
class ApiClient {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('motoboss_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      
      // Manejar respuestas sin contenido (e.g. 204 No Content)
      if (response.status === 204) {
        return { success: true, data: null };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Ocurrió un error en el servidor.');
      }

      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      return { success: false, error: error.message };
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'POST', body, headers });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PUT', body, headers });
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PATCH', body, headers });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const client = new ApiClient();
