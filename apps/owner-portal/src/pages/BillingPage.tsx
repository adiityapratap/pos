export default function BillingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
        <p className="text-gray-500 mt-1">Track revenue and manage billing across all tenants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$45,890</p>
          <p className="text-sm text-green-600 mt-1">+12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Annual Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$523,680</p>
          <p className="text-sm text-green-600 mt-1">+28% from last year</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Average Revenue Per Tenant</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">$294</p>
          <p className="text-sm text-green-600 mt-1">+5% from last month</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Features (Coming Soon)</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Revenue breakdown by plan</li>
          <li>Invoice management</li>
          <li>Payment history</li>
          <li>Failed payments tracking</li>
          <li>Subscription upgrades/downgrades</li>
          <li>Promo codes & discounts</li>
        </ul>
      </div>
    </div>
  );
}
