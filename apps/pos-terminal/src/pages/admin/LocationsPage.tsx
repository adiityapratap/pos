export default function LocationsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations & Users</h1>
          <p className="text-gray-600 mt-1">Manage store locations and staff members</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-store text-6xl text-amber-700 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Locations & Users Management</h3>
          <p className="text-gray-600 mb-6">
            This page will allow you to manage multiple store locations and assign staff members with different roles.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-map-marker-alt text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Store Locations</div>
              <div className="text-sm text-gray-600">Add and manage locations</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-users text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Staff Management</div>
              <div className="text-sm text-gray-600">Manage employees and roles</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-clock text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Operating Hours</div>
              <div className="text-sm text-gray-600">Set business hours per location</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-shield-alt text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Permissions</div>
              <div className="text-sm text-gray-600">Configure user permissions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
