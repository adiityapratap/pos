import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiResponse, AuthResponse, LoginCredentials, ApiError } from '@pos-saas/types';

export interface ApiClientConfig {
  baseURL: string;
  tenantSubdomain?: string;
  onUnauthorized?: () => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(config.tenantSubdomain && { 'x-tenant-subdomain': config.tenantSubdomain }),
    },
  });

  // Add token to requests
  client.interceptors.request.use((requestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  });

  // Handle 401 responses
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
        config.onUnauthorized?.();
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// Auth API helpers
export const authApi = (client: AxiosInstance) => ({
  async pinLogin(employeeId: string, pin: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/pin-login', { employeeId, pin });
    return response.data;
  },

  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  async ownerLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/owner-login', { email, password });
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },
});

// Categories API helpers
export const categoriesApi = (client: AxiosInstance) => ({
  async getAll(includeInactive = false) {
    const response = await client.get('/categories', { params: { includeInactive } });
    return response.data;
  },

  async getOne(id: string) {
    const response = await client.get(`/categories/${id}`);
    return response.data;
  },

  async getTree(includeInactive = false, includeProducts = false) {
    const response = await client.get('/categories/tree', {
      params: { includeInactive, includeProducts },
    });
    return response.data;
  },

  async create(data: { name: string; description?: string; parentId?: string; sortOrder?: number }) {
    const response = await client.post('/categories', data);
    return response.data;
  },

  async update(id: string, data: Partial<{ name: string; description?: string; sortOrder?: number; isActive?: boolean }>) {
    const response = await client.patch(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await client.delete(`/categories/${id}`);
    return response.data;
  },
});

// Products API helpers
export const productsApi = (client: AxiosInstance) => ({
  async getAll(categoryId?: string, includeInactive = false) {
    const response = await client.get('/products', { params: { categoryId, includeInactive } });
    return response.data;
  },

  async getOne(id: string) {
    const response = await client.get(`/products/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await client.post('/products', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await client.patch(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await client.delete(`/products/${id}`);
    return response.data;
  },
});

// Locations API helpers
export const locationsApi = (client: AxiosInstance) => ({
  async getAll() {
    const response = await client.get('/locations');
    return response.data;
  },

  async getOne(id: string) {
    const response = await client.get(`/locations/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await client.post('/locations', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await client.patch(`/locations/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await client.delete(`/locations/${id}`);
    return response.data;
  },
});

// Menu API helpers (for POS)
export const menuApi = (client: AxiosInstance) => ({
  async getFullMenu(locationId?: string) {
    const response = await client.get('/menu', { params: { locationId } });
    return response.data;
  },
});

// Export everything
export * from '@pos-saas/types';
