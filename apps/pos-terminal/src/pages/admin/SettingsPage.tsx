export default function SettingsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-cog text-6xl text-amber-700 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-600 mb-6">
            This page will provide various settings to customize your POS system.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-building text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Business Info</div>
              <div className="text-sm text-gray-600">Company details and branding</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-credit-card text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Payment Methods</div>
              <div className="text-sm text-gray-600">Configure payment options</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-receipt text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Receipt Settings</div>
              <div className="text-sm text-gray-600">Customize receipt format</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-percentage text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Tax Configuration</div>
              <div className="text-sm text-gray-600">Set up tax rates</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-bell text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Notifications</div>
              <div className="text-sm text-gray-600">Email and SMS alerts</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-database text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Backup & Restore</div>
              <div className="text-sm text-gray-600">Data management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
