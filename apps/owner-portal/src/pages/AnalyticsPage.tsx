export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform-wide analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Total Orders (Today)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">8,456</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Gross Merchandise Value</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$156,890</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">API Calls (24h)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">2.4M</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Features (Coming Soon)</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Order volume trends</li>
          <li>Tenant growth charts</li>
          <li>Geographic distribution</li>
          <li>Peak usage times</li>
          <li>Feature adoption rates</li>
          <li>Churn analysis</li>
        </ul>
      </div>
    </div>
  );
}
