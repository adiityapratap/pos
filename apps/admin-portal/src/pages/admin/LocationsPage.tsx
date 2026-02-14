import { useState, useEffect } from 'react';
import {
  locationsApi,
  type Location,
  type CreateLocationData,
} from '../../services/locations';

type ModalMode = 'create' | 'edit' | 'view';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateLocationData>({
    name: '',
    code: '',
    locationType: 'store',
    addressLine1: '',
    addressLine2: '',
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
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await locationsApi.getAllLocations();
      setLocations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedLocation(null);
    setFormData({
      name: '',
      code: '',
      locationType: 'store',
      addressLine1: '',
      addressLine2: '',
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
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (location: Location) => {
    setModalMode('edit');
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      code: location.code || '',
      locationType: location.locationType || 'store',
      addressLine1: location.addressLine1 || '',
      addressLine2: location.addressLine2 || '',
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
    setFormError('');
    setShowModal(true);
  };

  const openViewModal = (location: Location) => {
    setModalMode('view');
    setSelectedLocation(location);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (modalMode === 'create') {
        await locationsApi.createLocation(formData);
      } else if (modalMode === 'edit' && selectedLocation) {
        await locationsApi.updateLocation(selectedLocation.id, formData);
      }
      setShowModal(false);
      fetchLocations();
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Failed to ${modalMode} location`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    setActionLoading(id);
    try {
      await locationsApi.deleteLocation(id);
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete location');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (location: Location) => {
    setActionLoading(location.id);
    try {
      await locationsApi.updateLocation(location.id, { isActive: !location.isActive });
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update location');
    } finally {
      setActionLoading(null);
    }
  };

  const locationTypes = [
    { value: 'store', label: 'Store' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'kiosk', label: 'Kiosk' },
    { value: 'mobile', label: 'Mobile/Food Truck' },
  ];

  const timezones = [
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
    { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
    { value: 'Australia/Perth', label: 'Perth (AWST)' },
    { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'UTC', label: 'UTC' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage your store locations ({locations.length} total)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-800 transition-colors flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Location
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-amber-700 mb-4"></i>
          <p className="text-gray-500">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="fas fa-store text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 mb-4">No locations yet. Add your first location to get started.</p>
          <button
            onClick={openCreateModal}
            className="bg-amber-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-800"
          >
            Add First Location
          </button>
        </div>
      ) : (
        /* Locations Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`bg-white rounded-lg border ${
                location.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
              } p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    location.isActive ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <i className="fas fa-store text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    {location.code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {location.code}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  location.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {(location.addressLine1 || location.city) && (
                  <div className="flex items-start">
                    <i className="fas fa-map-marker-alt w-4 mt-0.5 text-gray-400"></i>
                    <span className="ml-2">
                      {[location.addressLine1, location.city, location.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center">
                    <i className="fas fa-phone w-4 text-gray-400"></i>
                    <span className="ml-2">{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center">
                    <i className="fas fa-envelope w-4 text-gray-400"></i>
                    <span className="ml-2">{location.email}</span>
                  </div>
                )}
                {location.taxRate !== undefined && (
                  <div className="flex items-center">
                    <i className="fas fa-percent w-4 text-gray-400"></i>
                    <span className="ml-2">Tax: {location.taxRate}%</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {actionLoading === location.id ? (
                  <span className="text-gray-400 text-sm">Loading...</span>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(location)}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        <i className="fas fa-eye mr-1"></i> View
                      </button>
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-amber-700 hover:text-amber-900 text-sm"
                      >
                        <i className="fas fa-edit mr-1"></i> Edit
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(location)}
                        className={`text-sm ${
                          location.isActive
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {location.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' && 'Add New Location'}
                {modalMode === 'edit' && 'Edit Location'}
                {modalMode === 'view' && 'Location Details'}
              </h2>
            </div>

            {modalMode === 'view' && selectedLocation ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium">{selectedLocation.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Code</label>
                    <p className="font-medium">{selectedLocation.code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Type</label>
                    <p className="font-medium capitalize">{selectedLocation.locationType || 'Store'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <p className={`font-medium ${selectedLocation.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedLocation.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">
                      {[selectedLocation.addressLine1, selectedLocation.addressLine2, selectedLocation.city, selectedLocation.state, selectedLocation.postalCode].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedLocation.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedLocation.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Timezone</label>
                    <p className="font-medium">{selectedLocation.timezone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tax Rate</label>
                    <p className="font-medium">{selectedLocation.taxRate ?? '-'}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Created</label>
                    <p className="font-medium">{new Date(selectedLocation.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Updated</label>
                    <p className="font-medium">{new Date(selectedLocation.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => openEditModal(selectedLocation)}
                    className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 ml-2"
                  >
                    Edit Location
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {formError}
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Sydney CBD Store"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Code</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="SYD-CBD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                      <select
                        value={formData.locationType || 'store'}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        {locationTypes.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={formData.addressLine1 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="123 Pitt Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Sydney"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="NSW"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postalCode || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="2000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        value={formData.countryCode || 'AU'}
                        onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="AU">Australia</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="NZ">New Zealand</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact & Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact & Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="+61 2 9000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="store@business.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <select
                        value={formData.timezone || 'Australia/Sydney'}
                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.taxRate ?? 10}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? 'Saving...' : modalMode === 'create' ? 'Add Location' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
