export default function OrdersPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">View and manage customer orders</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-receipt text-6xl text-amber-700 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders Management</h3>
          <p className="text-gray-600 mb-6">
            This page will display all orders with filtering, sorting, and detailed order views.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-filter text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Advanced Filtering</div>
              <div className="text-sm text-gray-600">Filter by status, date, location</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-search text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Order Search</div>
              <div className="text-sm text-gray-600">Search by order ID or customer</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-eye text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Order Details</div>
              <div className="text-sm text-gray-600">View complete order information</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <i className="fas fa-print text-amber-700 mb-2"></i>
              <div className="font-medium text-gray-900">Print Receipts</div>
              <div className="text-sm text-gray-600">Print or email receipts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
