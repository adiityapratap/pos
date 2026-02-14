import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../config/api';

interface Stats {
  totalProducts: number;
  activeCategories: number;
  locationsManaged: number;
  ordersToday: number;
}

interface LocationSummary {
  id: string;
  name: string;
  address: string;
  ordersToday: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeCategories: 0,
    locationsManaged: 0,
    ordersToday: 0
  });
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories/tree?includeProducts=false')
      ]);

      setStats({
        totalProducts: productsRes.data.length,
        activeCategories: categoriesRes.data.length,
        locationsManaged: 3,
        ordersToday: 156
      });

      // Mock location summaries
      setLocations([
        { id: '1', name: 'Downtown Cafe', address: '123 Main St', ordersToday: 89 },
        { id: '2', name: 'Westside Branch', address: '456 Oak Ave', ordersToday: 42 },
        { id: '3', name: 'Airport Terminal', address: 'Terminal 2, Gate B', ordersToday: 25 }
      ]);

      // Mock recent activities
      setActivities([
        {
          id: '1',
          type: 'product_added',
          title: 'New product added',
          description: 'Caramel Macchiato added to menu',
          timestamp: '2 hours ago',
          icon: 'fa-plus',
          color: 'blue'
        },
        {
          id: '2',
          type: 'category_updated',
          title: 'Category updated',
          description: 'Seasonal Specials modified',
          timestamp: '5 hours ago',
          icon: 'fa-check',
          color: 'green'
        },
        {
          id: '3',
          type: 'user_added',
          title: 'New user added',
          description: 'Sarah Johnson joined as Manager',
          timestamp: 'Yesterday',
          icon: 'fa-user',
          color: 'purple'
        },
        {
          id: '4',
          type: 'combo_created',
          title: 'Combo created',
          description: 'Morning Breakfast Deal launched',
          timestamp: '2 days ago',
          icon: 'fa-tags',
          color: 'orange'
        },
        {
          id: '5',
          type: 'product_removed',
          title: 'Product removed',
          description: 'Winter Special discontinued',
          timestamp: '3 days ago',
          icon: 'fa-trash',
          color: 'red'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const getIconBgClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
      red: 'bg-red-100'
    };
    return colors[color] || 'bg-gray-100';
  };

  const getIconColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    };
    return colors[color] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-amber-700"></i>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || user?.displayName || user?.email || 'User'}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your locations today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-mug-saucer text-blue-600 text-xl"></i>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalProducts}</h3>
          <p className="text-sm text-gray-600">Total Products</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-layer-group text-purple-600 text-xl"></i>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.activeCategories}</h3>
          <p className="text-sm text-gray-600">Active Categories</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-location-dot text-orange-600 text-xl"></i>
            </div>
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.locationsManaged}</h3>
          <p className="text-sm text-gray-600">Locations Managed</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-receipt text-green-600 text-xl"></i>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +24%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.ordersToday}</h3>
          <p className="text-sm text-gray-600">Orders Today</p>
        </div>
      </div>

      {/* Location Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Summary */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Location Summary</h2>
            <button 
              onClick={() => navigate('/admin/locations')}
              className="text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-amber-700' : 'bg-gray-200'
                    }`}
                  >
                    <i
                      className={`fa-solid fa-store ${
                        index === 0 ? 'text-white' : 'text-gray-600'
                      }`}
                    ></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{location.ordersToday}</p>
                  <p className="text-sm text-gray-600">Orders today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBgClass(
                    activity.color
                  )}`}
                >
                  <i className={`fa-solid ${activity.icon} ${getIconColorClass(activity.color)} text-xs`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-2 text-sm text-amber-700 hover:text-amber-800 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <i className="fa-solid fa-plus text-amber-700 text-2xl mb-3"></i>
            <span className="text-sm font-medium text-gray-900">Add Product</span>
          </button>
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <i className="fa-solid fa-layer-group text-amber-700 text-2xl mb-3"></i>
            <span className="text-sm font-medium text-gray-900">New Category</span>
          </button>
          <button
            onClick={() => navigate('/admin/combos')}
            className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <i className="fa-solid fa-tags text-amber-700 text-2xl mb-3"></i>
            <span className="text-sm font-medium text-gray-900">Create Combo</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <i className="fa-solid fa-chart-bar text-amber-700 text-2xl mb-3"></i>
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
