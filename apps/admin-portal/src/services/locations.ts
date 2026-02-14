import { apiClient } from '../config/api';

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  locationType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  taxRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationData {
  name: string;
  code?: string;
  locationType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  taxRate?: number;
  isActive?: boolean;
}

export interface UpdateLocationData extends Partial<CreateLocationData> {}

export const locationsApi = {
  /**
   * Fetch all locations for the authenticated tenant
   */
  async getAllLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>('/locations');
    return response.data;
  },

  /**
   * Fetch a single location by ID
   */
  async getLocationById(id: string): Promise<Location> {
    const response = await apiClient.get<Location>(`/locations/${id}`);
    return response.data;
  },

  /**
   * Fetch active locations only
   */
  async getActiveLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>('/locations', {
      params: { isActive: true }
    });
    return response.data;
  },

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationData): Promise<Location> {
    const response = await apiClient.post<Location>('/locations', data);
    return response.data;
  },

  /**
   * Update an existing location
   */
  async updateLocation(id: string, data: UpdateLocationData): Promise<Location> {
    const response = await apiClient.put<Location>(`/locations/${id}`, data);
    return response.data;
  },

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    await apiClient.delete(`/locations/${id}`);
  },
};

export default locationsApi;
