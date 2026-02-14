export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                defaultValue="POS SaaS"
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                defaultValue="support@pos-saas.com"
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Starter</h3>
              <p className="text-2xl font-bold mt-2">$29<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>1 Location</li>
                <li>2 Devices</li>
                <li>Basic Reports</li>
              </ul>
            </div>
            <div className="border border-indigo-500 rounded-lg p-4 bg-indigo-50">
              <h3 className="font-medium text-gray-900">Professional</h3>
              <p className="text-2xl font-bold mt-2">$79<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>5 Locations</li>
                <li>10 Devices</li>
                <li>Advanced Reports</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Enterprise</h3>
              <p className="text-2xl font-bold mt-2">$199<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                <li>Unlimited Locations</li>
                <li>Unlimited Devices</li>
                <li>Custom Features</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h2>
          <div className="space-y-3">
            {[
              { name: 'Offline Mode', enabled: true, description: 'Allow POS to work offline' },
              { name: 'Kitchen Display', enabled: true, description: 'Kitchen display system' },
              { name: 'Customer Loyalty', enabled: true, description: 'Loyalty points program' },
              { name: 'Multi-currency', enabled: false, description: 'Support multiple currencies' },
              { name: 'AI Recommendations', enabled: false, description: 'AI-powered product recommendations' },
            ].map((flag) => (
              <div key={flag.name} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">{flag.name}</p>
                  <p className="text-sm text-gray-500">{flag.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={flag.enabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
