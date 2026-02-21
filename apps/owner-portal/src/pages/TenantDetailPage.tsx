import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTenantById,
  updateTenant,
  getTenantLocations,
  addTenantLocation,
  updateTenantLocation,
  deleteTenantLocation,
  getTenantUsers,
  addTenantUser,
  updateTenantUser,
  deleteTenantUser,
  resetTenantUserPassword,
  suspendTenant,
  activateTenant,
  getTenantTheme,
  updateTenantTheme,
  type TenantDetail,
  type TenantLocation,
  type TenantUser,
  type UpdateTenantData,
  type CreateTenantLocationData,
  type CreateTenantUserData,
} from '../services/ownerApi';

type TabType = 'overview' | 'locations' | 'users' | 'stats';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Edit tenant state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTenantData>({});
  const [editLoading, setEditLoading] = useState(false);

  // Locations state
  const [locations, setLocations] = useState<TenantLocation[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TenantLocation | null>(null);
  const [locationForm, setLocationForm] = useState<CreateTenantLocationData>({
    name: '',
    code: '',
    locationType: 'store',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    countryCode: 'AU',
    phone: '',
    email: '',
    timezone: 'Australia/Sydney',
    taxRate: 10,
    isActive: true,
  });

  // Users state
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [userForm, setUserForm] = useState<CreateTenantUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'cashier',
    pin: '',
    isActive: true,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Theme state
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [themeLoading, setThemeLoading] = useState(false);

  // Fetch tenant data
  const fetchTenant = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTenantById(id);
      setTenant(data);
      setEditData({
        businessName: data.businessName,
        legalEntityName: data.legalEntityName,
        planType: data.planType,
        countryCode: data.countryCode,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        maxLocations: data.maxLocations,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    if (!id) return;
    try {
      const data = await getTenantLocations(id);
      setLocations(data);
    } catch (err: any) {
      console.error('Failed to load locations:', err);
    }
  };

  const fetchUsers = async () => {
    if (!id) return;
    try {
      const data = await getTenantUsers(id);
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchTheme = async () => {
    if (!id) return;
    try {
      const data = await getTenantTheme(id);
      setThemeColor(data.primaryColor);
    } catch (err: any) {
      console.error('Failed to load theme:', err);
    }
  };

  useEffect(() => {
    fetchTenant();
    fetchLocations();
    fetchUsers();
    fetchTheme();
  }, [id]);

  // Handle theme update
  const handleSaveTheme = async () => {
    if (!id) return;
    setThemeLoading(true);
    try {
      await updateTenantTheme(id, themeColor);
      alert('Theme color updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update theme');
    } finally {
      setThemeLoading(false);
    }
  };

  // Handle tenant update
  const handleSaveTenant = async () => {
    if (!id) return;
    setEditLoading(true);
    try {
      await updateTenant(id, editData);
      await fetchTenant();
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle suspend/activate
  const handleSuspend = async () => {
    if (!id || !confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      await suspendTenant(id, 'Suspended by owner');
      fetchTenant();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend tenant');
    }
  };

  const handleActivate = async () => {
    if (!id) return;
    try {
      await activateTenant(id);
      fetchTenant();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate tenant');
    }
  };

  // Location handlers
  const openLocationModal = (location?: TenantLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name,
        code: location.code,
        locationType: location.locationType || 'store',
        addressLine1: location.addressLine1 || '',
        city: location.city || '',
        state: location.state || '',
        postalCode: location.postalCode || '',
        countryCode: location.countryCode || 'AU',
        phone: location.phone || '',
        email: location.email || '',
        timezone: location.timezone || 'Australia/Sydney',
        taxRate: location.taxRate || 10,
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: '',
        code: '',
        locationType: 'store',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        countryCode: tenant?.countryCode || 'AU',
        phone: '',
        email: '',
        timezone: tenant?.timezone || 'Australia/Sydney',
        taxRate: 10,
        isActive: true,
      });
    }
    setFormError('');
    setShowLocationModal(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormLoading(true);
    setFormError('');
    try {
      if (editingLocation) {
        await updateTenantLocation(id, editingLocation.id, locationForm);
      } else {
        await addTenantLocation(id, locationForm);
      }
      setShowLocationModal(false);
      fetchLocations();
      fetchTenant();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save location');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!id || !confirm('Are you sure you want to delete this location?')) return;
    try {
      await deleteTenantLocation(id, locationId);
      fetchLocations();
      fetchTenant();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete location');
    }
  };

  // User handlers
  const openUserModal = (user?: TenantUser) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        employeeCode: user.employeeCode,
        role: user.role,
        pin: '',
        allowedLocations: user.allowedLocations,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'cashier',
        pin: '',
        isActive: true,
      });
    }
    setFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormLoading(true);
    setFormError('');
    try {
      if (editingUser) {
        const updateData: any = { ...userForm };
        delete updateData.password;
        delete updateData.email;
        if (!updateData.pin) delete updateData.pin;
        await updateTenantUser(id, editingUser.id, updateData);
      } else {
        await addTenantUser(id, userForm);
      }
      setShowUserModal(false);
      fetchUsers();
      fetchTenant();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!id || !confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteTenantUser(id, userId);
      fetchUsers();
      fetchTenant();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openPasswordModal = (userId: string) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!id || !passwordUserId || !newPassword) return;
    try {
      await resetTenantUserPassword(id, passwordUserId, newPassword);
      setShowPasswordModal(false);
      alert('Password reset successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const statusColors: Record<string, string> = {
    trial: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const planColors: Record<string, string> = {
    starter: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-indigo-100 text-indigo-800',
  };

  const roleColors: Record<string, string> = {
    owner: 'bg-red-100 text-red-800',
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    cashier: 'bg-green-100 text-green-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Tenant not found'}
        <button onClick={() => navigate('/tenants')} className="ml-4 text-red-600 underline">
          Back to Tenants
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/tenants')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{tenant.businessName}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[tenant.subscriptionStatus]}`}>
                {tenant.subscriptionStatus}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${planColors[tenant.planType]}`}>
                {tenant.planType}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{tenant.subdomain}.bizpos.com</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tenant.subscriptionStatus === 'suspended' ? (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Activate
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          {(['overview', 'locations', 'users', 'stats'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'locations' && ` (${locations.length}/${tenant.maxLocations || '∞'})`}
              {tab === 'users' && ` (${users.length}/${tenant.maxUsers || '∞'})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTenant}
                  disabled={editLoading}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.businessName || ''}
                  onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="font-medium text-gray-900">{tenant.businessName}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Legal Entity Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.legalEntityName || ''}
                  onChange={(e) => setEditData({ ...editData, legalEntityName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="font-medium text-gray-900">{tenant.legalEntityName || '-'}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Subdomain</label>
              <p className="font-medium text-gray-900">{tenant.subdomain}.bizpos.com</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Plan</label>
              {isEditing ? (
                <select
                  value={editData.planType || tenant.planType}
                  onChange={(e) => setEditData({ ...editData, planType: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              ) : (
                <p className="font-medium text-gray-900 capitalize">{tenant.planType}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Country</label>
              {isEditing ? (
                <select
                  value={editData.countryCode || tenant.countryCode}
                  onChange={(e) => setEditData({ ...editData, countryCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="US">United States</option>
                  <option value="AU">Australia</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="IN">India</option>
                </select>
              ) : (
                <p className="font-medium text-gray-900">{tenant.countryCode}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Currency</label>
              {isEditing ? (
                <select
                  value={editData.currencyCode || tenant.currencyCode}
                  onChange={(e) => setEditData({ ...editData, currencyCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              ) : (
                <p className="font-medium text-gray-900">{tenant.currencyCode}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Timezone</label>
              {isEditing ? (
                <select
                  value={editData.timezone || tenant.timezone}
                  onChange={(e) => setEditData({ ...editData, timezone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Australia/Sydney">Australia/Sydney</option>
                  <option value="Australia/Melbourne">Australia/Melbourne</option>
                  <option value="Australia/Brisbane">Australia/Brisbane</option>
                  <option value="Australia/Perth">Australia/Perth</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              ) : (
                <p className="font-medium text-gray-900">{tenant.timezone}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-500">Created</label>
              <p className="font-medium text-gray-900">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Plan Limits */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-500">Max Locations</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={editData.maxLocations || tenant.maxLocations || 1}
                    onChange={(e) => setEditData({ ...editData, maxLocations: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{tenant.maxLocations || '∞'}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500">Max Users</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={editData.maxUsers || tenant.maxUsers || 5}
                    onChange={(e) => setEditData({ ...editData, maxUsers: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{tenant.maxUsers || '∞'}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500">Max Products</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={editData.maxProducts || tenant.maxProducts || 100}
                    onChange={(e) => setEditData({ ...editData, maxProducts: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{tenant.maxProducts || '∞'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">POS Theme Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Primary Button Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    placeholder="#2563eb"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <button
                    onClick={handleSaveTheme}
                    disabled={themeLoading}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {themeLoading ? 'Saving...' : 'Save Theme'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This color will be applied to buttons and highlights in the POS terminal for this tenant.
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Preview</label>
                <div className="flex items-center gap-2">
                  <button
                    style={{ backgroundColor: themeColor }}
                    className="px-4 py-2 text-white text-sm font-medium rounded-lg"
                  >
                    Sample Button
                  </button>
                  <span
                    style={{ color: themeColor }}
                    className="font-bold"
                  >
                    $24.99
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[tenant.subscriptionStatus]}`}>
                  {tenant.subscriptionStatus}
                </p>
              </div>

              {tenant.trialEndsAt && (
                <div>
                  <label className="text-sm text-gray-500">Trial Ends</label>
                  <p className="font-medium text-gray-900">
                    {new Date(tenant.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {tenant.subscriptionEndsAt && (
                <div>
                  <label className="text-sm text-gray-500">Subscription Ends</label>
                  <p className="font-medium text-gray-900">
                    {new Date(tenant.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {tenant.isLocked && (
                <div className="md:col-span-3">
                  <label className="text-sm text-gray-500">Lock Reason</label>
                  <p className="font-medium text-red-600">{tenant.lockedReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
            <button
              onClick={() => openLocationModal()}
              disabled={tenant.maxLocations !== undefined && locations.length >= tenant.maxLocations}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Location
            </button>
          </div>

          {locations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No locations yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`bg-white rounded-lg border p-4 ${
                    location.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {location.city && (
                    <p className="text-sm text-gray-600 mt-2">
                      {[location.addressLine1, location.city, location.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openLocationModal(location)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <button
              onClick={() => openUserModal()}
              disabled={tenant.maxUsers !== undefined && users.length >= tenant.maxUsers}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No users yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.employeeCode}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-indigo-600 hover:text-indigo-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openPasswordModal(user.id)}
                          className="text-yellow-600 hover:text-yellow-800 mr-3"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-indigo-600">{locations.length}</div>
            <div className="text-sm text-gray-500 mt-1">Locations</div>
            <div className="text-xs text-gray-400">of {tenant.maxLocations || '∞'} allowed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{users.length}</div>
            <div className="text-sm text-gray-500 mt-1">Users</div>
            <div className="text-xs text-gray-400">of {tenant.maxUsers || '∞'} allowed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{tenant.productsCount || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Products</div>
            <div className="text-xs text-gray-400">of {tenant.maxProducts || '∞'} allowed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-orange-600">{tenant.ordersCount || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Orders</div>
            <div className="text-xs text-gray-400">total processed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">{tenant.categoriesCount || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Categories</div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={locationForm.code || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={locationForm.locationType || 'store'}
                    onChange={(e) => setLocationForm({ ...locationForm, locationType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="store">Store</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="kiosk">Kiosk</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <select
                    value={locationForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setLocationForm({ ...locationForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={locationForm.addressLine1 || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={locationForm.city || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={locationForm.state || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={locationForm.phone || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={locationForm.email || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={locationForm.taxRate ?? 10}
                    onChange={(e) => setLocationForm({ ...locationForm, taxRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={locationForm.timezone || 'Australia/Sydney'}
                    onChange={(e) => setLocationForm({ ...locationForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Australia/Sydney">Australia/Sydney</option>
                    <option value="Australia/Melbourne">Australia/Melbourne</option>
                    <option value="Australia/Brisbane">Australia/Brisbane</option>
                    <option value="Australia/Perth">Australia/Perth</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={userForm.employeeCode || ''}
                    onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userForm.role || 'cashier'}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN {editingUser && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={userForm.pin || ''}
                    onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="4-6 digit PIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={userForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
