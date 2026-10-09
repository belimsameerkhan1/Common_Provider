import type { Provider, ProviderCreate, Model, ServiceHealth } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        // Pydantic validation error array
        errorDetail = errorJson.detail
          .map((err: { msg?: string; loc?: (string | number)[] }) => {
            const field = err.loc ? err.loc.join('.') : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          })
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(errorDetail, response.status);
  }
  return response.json();
}

export const api = {
  async getHealth(): Promise<ServiceHealth> {
    const res = await fetch(`${API_BASE_URL}/`);
    return handleResponse<ServiceHealth>(res);
  },

  async getProviders(): Promise<Provider[]> {
    const res = await fetch(`${API_BASE_URL}/providers`);
    return handleResponse<Provider[]>(res);
  },

  async getProvider(id: string): Promise<Provider> {
    const res = await fetch(`${API_BASE_URL}/providers/${encodeURIComponent(id)}`);
    return handleResponse<Provider>(res);
  },

  async createProvider(data: ProviderCreate): Promise<Provider> {
    const res = await fetch(`${API_BASE_URL}/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Provider>(res);
  },

  async getProviderModels(providerId: string): Promise<Model[]> {
    const res = await fetch(`${API_BASE_URL}/providers/${encodeURIComponent(providerId)}/models`);
    return handleResponse<Model[]>(res);
  },
};
