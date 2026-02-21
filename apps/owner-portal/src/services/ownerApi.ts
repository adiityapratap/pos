import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance for owner API
const ownerApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
ownerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ownerAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
ownerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ownerAccessToken');
      localStorage.removeItem('ownerUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Tenant {
  id: string;
  businessName: string;
  subdomain: string;
  legalEntityName?: string;
  planType: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionStartedAt: string;
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  currencyCode: string;
  timezone: string;
  countryCode: string;
  maxLocations?: number;
  maxUsers?: number;
  maxProducts?: number;
  features?: Record<string, boolean>;
  isActive: boolean;
  isLocked: boolean;
  lockedReason?: string;
  createdAt: string;
  updatedAt: string;
  locationsCount?: number;
  usersCount?: number;
  productsCount?: number;
}

export interface TenantDetail extends Tenant {
  locations: Array<{
    id: string;
    name: string;
    code: string;
    city?: string;
    isActive: boolean;
  }>;
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
  }>;
  categoriesCount?: number;
  ordersCount?: number;
}

export interface CreateTenantData {
  businessName: string;
  subdomain: string;
  legalEntityName?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  planType?: 'starter' | 'professional' | 'enterprise';
  countryCode?: string;
  currencyCode?: string;
  timezone?: string;
  maxLocations?: number;
  maxUsers?: number;
  maxProducts?: number;
}

export interface UpdateTenantData {
  businessName?: string;
  legalEntityName?: string;
  planType?: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus?: 'trial' | 'active' | 'suspended' | 'cancelled';
  countryCode?: string;
  currencyCode?: string;
  timezone?: string;
  maxLocations?: number;
  maxUsers?: number;
  maxProducts?: number;
  isActive?: boolean;
}

export interface DashboardStats {
  overview: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalLocations: number;
    totalUsers: number;
  };
  planDistribution: Array<{
    plan: string;
    count: number;
  }>;
  recentTenants: Array<{
    id: string;
    businessName: string;
    subdomain: string;
    planType: string;
    subscriptionStatus: string;
    createdAt: string;
  }>;
}

// API Functions

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await ownerApi.get('/owner/dashboard');
  return response.data;
}

/**
 * Get all tenants with optional filters
 */
export async function getTenants(params?: {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Tenant[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const response = await ownerApi.get('/owner/tenants', { params });
  return response.data;
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<TenantDetail> {
  const response = await ownerApi.get(`/owner/tenants/${id}`);
  return response.data;
}

/**
 * Create a new tenant
 */
export async function createTenant(data: CreateTenantData): Promise<Tenant> {
  const response = await ownerApi.post('/owner/tenants', data);
  return response.data;
}

/**
 * Update tenant
 */
export async function updateTenant(id: string, data: UpdateTenantData): Promise<Tenant> {
  const response = await ownerApi.put(`/owner/tenants/${id}`, data);
  return response.data;
}

/**
 * Suspend tenant
 */
export async function suspendTenant(id: string, reason: string): Promise<Tenant> {
  const response = await ownerApi.post(`/owner/tenants/${id}/suspend`, { reason });
  return response.data;
}

/**
 * Activate tenant
 */
export async function activateTenant(id: string): Promise<Tenant> {
  const response = await ownerApi.post(`/owner/tenants/${id}/activate`);
  return response.data;
}

/**
 * Delete tenant
 */
export async function deleteTenant(id: string): Promise<{ success: boolean; message: string }> {
  const response = await ownerApi.delete(`/owner/tenants/${id}`);
  return response.data;
}

// ==========================================
// TENANT LOCATION MANAGEMENT
// ==========================================

export interface TenantLocation {
  id: string;
  tenantId: string;
  name: string;
  code: string;
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

export interface CreateTenantLocationData {
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

export interface UpdateTenantLocationData extends Partial<CreateTenantLocationData> {}

/**
 * Get all locations for a tenant
 */
export async function getTenantLocations(tenantId: string): Promise<TenantLocation[]> {
  const response = await ownerApi.get(`/owner/tenants/${tenantId}/locations`);
  return response.data;
}

/**
 * Add a location to a tenant
 */
export async function addTenantLocation(tenantId: string, data: CreateTenantLocationData): Promise<TenantLocation> {
  const response = await ownerApi.post(`/owner/tenants/${tenantId}/locations`, data);
  return response.data;
}

/**
 * Update a location for a tenant
 */
export async function updateTenantLocation(
  tenantId: string,
  locationId: string,
  data: UpdateTenantLocationData,
): Promise<TenantLocation> {
  const response = await ownerApi.patch(`/owner/tenants/${tenantId}/locations/${locationId}`, data);
  return response.data;
}

/**
 * Delete a location for a tenant
 */
export async function deleteTenantLocation(tenantId: string, locationId: string): Promise<void> {
  await ownerApi.delete(`/owner/tenants/${tenantId}/locations/${locationId}`);
}

// ==========================================
// TENANT USER MANAGEMENT
// ==========================================

export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  employeeCode: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  allowedLocations?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTenantUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  role?: string;
  pin?: string;
  allowedLocations?: string[];
  isActive?: boolean;
}

export interface UpdateTenantUserData {
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  role?: string;
  pin?: string;
  allowedLocations?: string[];
  isActive?: boolean;
}

/**
 * Get all users for a tenant
 */
export async function getTenantUsers(tenantId: string): Promise<TenantUser[]> {
  const response = await ownerApi.get(`/owner/tenants/${tenantId}/users`);
  return response.data;
}

/**
 * Add a user to a tenant
 */
export async function addTenantUser(tenantId: string, data: CreateTenantUserData): Promise<TenantUser> {
  const response = await ownerApi.post(`/owner/tenants/${tenantId}/users`, data);
  return response.data;
}

/**
 * Update a user for a tenant
 */
export async function updateTenantUser(
  tenantId: string,
  userId: string,
  data: UpdateTenantUserData,
): Promise<TenantUser> {
  const response = await ownerApi.patch(`/owner/tenants/${tenantId}/users/${userId}`, data);
  return response.data;
}

/**
 * Reset password for a tenant user
 */
export async function resetTenantUserPassword(
  tenantId: string,
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await ownerApi.post(`/owner/tenants/${tenantId}/users/${userId}/reset-password`, { newPassword });
  return response.data;
}

/**
 * Delete a user from a tenant
 */
export async function deleteTenantUser(tenantId: string, userId: string): Promise<void> {
  await ownerApi.delete(`/owner/tenants/${tenantId}/users/${userId}`);
}

// ==========================================
// TENANT THEME SETTINGS
// ==========================================

export interface TenantTheme {
  tenantId: string;
  businessName: string;
  primaryColor: string;
}

/**
 * Get tenant theme settings
 */
export async function getTenantTheme(tenantId: string): Promise<TenantTheme> {
  const response = await ownerApi.get(`/owner/tenants/${tenantId}/theme`);
  return response.data;
}

/**
 * Update tenant theme settings
 */
export async function updateTenantTheme(
  tenantId: string,
  primaryColor: string,
): Promise<{ tenantId: string; primaryColor: string; message: string }> {
  const response = await ownerApi.put(`/owner/tenants/${tenantId}/theme`, { primaryColor });
  return response.data;
}

export default ownerApi;
