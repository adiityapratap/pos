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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
};

export default locationsApi;
