export default function ReportsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View business insights and performance metrics</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-chart-line text-6xl text-amber-700 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
          <p className="text-gray-600 mb-6">
            This page will provide comprehensive reports and analytics for your business performance.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-dollar-sign text-green-600 mb-2"></i>
              <div className="font-medium text-gray-900">Sales Reports</div>
              <div className="text-sm text-gray-600">Daily, weekly, monthly sales</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-box text-blue-600 mb-2"></i>
              <div className="font-medium text-gray-900">Product Performance</div>
              <div className="text-sm text-gray-600">Top selling products</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-users text-purple-600 mb-2"></i>
              <div className="font-medium text-gray-900">Staff Performance</div>
              <div className="text-sm text-gray-600">Employee sales metrics</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-chart-pie text-orange-600 mb-2"></i>
              <div className="font-medium text-gray-900">Category Breakdown</div>
              <div className="text-sm text-gray-600">Sales by category</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-calendar text-red-600 mb-2"></i>
              <div className="font-medium text-gray-900">Date Range</div>
              <div className="text-sm text-gray-600">Custom date filtering</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-file-export text-teal-600 mb-2"></i>
              <div className="font-medium text-gray-900">Export Reports</div>
              <div className="text-sm text-gray-600">PDF and Excel exports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
