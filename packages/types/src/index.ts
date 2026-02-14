// Common types shared across all apps

// ============ Auth Types ============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'kitchen';
  displayName: string;
  tenantId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  employeeId?: string;
  pin?: string;
}

// ============ Tenant Types ============
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  taxRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
}

// ============ Location Types ============
export interface Location {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  isActive: boolean;
}

// ============ Category Types ============
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

// ============ Product Types ============
export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  pluNumber?: string;
  basePrice: number;
  costPrice?: number;
  productType: 'single' | 'combo' | 'variant_parent' | 'variant_child';
  taxable: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ============ Modifier Types ============
export interface ModifierGroup {
  id: string;
  tenantId: string;
  name: string;
  displayName?: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  groupId: string;
  tenantId: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ============ Order Types ============
export interface Order {
  id: string;
  tenantId: string;
  locationId: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeout' | 'delivery' | 'drive_thru';
  orderStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  modifierId: string;
  modifierName: string;
  price: number;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
