import { useState, useEffect } from 'react';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  activeDevices: number;
  ordersToday: number;
  newTenantsThisMonth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    activeDevices: 0,
    ordersToday: 0,
    newTenantsThisMonth: 0,
  });

  useEffect(() => {
    // TODO: Fetch real stats from API
    // Simulated data for now
    setStats({
      totalTenants: 156,
      activeTenants: 142,
      totalRevenue: 45890,
      activeDevices: 423,
      ordersToday: 8456,
      newTenantsThisMonth: 12,
    });
  }, []);

  const statCards = [
    { name: 'Total Tenants', value: stats.totalTenants, change: '+12%', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'bg-blue-500' },
    { name: 'Active Tenants', value: stats.activeTenants, change: '+8%', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-500' },
    { name: 'Monthly Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: '+23%', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-indigo-500' },
    { name: 'Active Devices', value: stats.activeDevices, change: '+5%', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'bg-purple-500' },
    { name: 'Orders Today', value: stats.ordersToday.toLocaleString(), change: '+15%', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-orange-500' },
    { name: 'New This Month', value: stats.newTenantsThisMonth, change: '+3', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', color: 'bg-pink-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your POS SaaS platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <span className="ml-2 text-sm text-green-600">{stat.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tenants</h2>
          <div className="space-y-4">
            {[
              { name: 'Pizza Palace', plan: 'Professional', status: 'Active', date: '2 hours ago' },
              { name: 'Coffee Corner', plan: 'Starter', status: 'Trial', date: '5 hours ago' },
              { name: 'Burger Barn', plan: 'Enterprise', status: 'Active', date: '1 day ago' },
              { name: 'Sushi Station', plan: 'Professional', status: 'Active', date: '2 days ago' },
            ].map((tenant, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                    {tenant.name[0]}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-sm text-gray-500">{tenant.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    tenant.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{tenant.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            {[
              { name: 'API Server', status: 'Operational', uptime: '99.99%' },
              { name: 'Database', status: 'Operational', uptime: '99.95%' },
              { name: 'Payment Gateway', status: 'Operational', uptime: '99.98%' },
              { name: 'CDN', status: 'Operational', uptime: '100%' },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Uptime: {service.uptime}</span>
                  <span className="text-sm text-green-600">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
