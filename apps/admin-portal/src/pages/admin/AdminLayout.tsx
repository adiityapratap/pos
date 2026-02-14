import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Location {
  id: string;
  name: string;
  address: string;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    id: '1',
    name: 'Downtown Cafe',
    address: '123 Main St'
  });
  const [locations] = useState<Location[]>([
    { id: '1', name: 'Downtown Cafe', address: '123 Main St' },
    { id: '2', name: 'Westside Branch', address: '456 Oak Ave' },
    { id: '3', name: 'Airport Terminal', address: 'Terminal 2, Gate B' }
  ]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if user has admin privileges
    if (user && user.role !== 'owner' && user.role !== 'manager') {
      alert('Access denied. Admin privileges required.');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length > 1) {
      const page = parts[1];
      return page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ');
    }
    
    return 'Dashboard';
  };

  if (!user) {
    return null;
  }

  const breadcrumb = getBreadcrumbs();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-mug-hot text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">XS Espresso</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-house w-5 mr-3"></i>
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-layer-group w-5 mr-3"></i>
                  <span>Categories</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/subcategories"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-folder w-5 mr-3"></i>
                  <span>Subcategories</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-mug-saucer w-5 mr-3"></i>
                  <span>Products / Menu</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/modifiers"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-list-check w-5 mr-3"></i>
                  <span>Modifier Groups</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/combos"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-tags w-5 mr-3"></i>
                  <span>Combos / Deals</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-white bg-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <i className="fa-solid fa-receipt w-5 mr-3"></i>
                  <span>Orders / Bookings</span>
                </NavLink>
              </li>
            </ul>

            {/* Administration Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Administration
              </p>
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/locations"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'text-white bg-amber-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <i className="fa-solid fa-location-dot w-5 mr-3"></i>
                    <span>Locations & Users</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/reports"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'text-white bg-amber-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <i className="fa-solid fa-chart-bar w-5 mr-3"></i>
                    <span>Reports</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'text-white bg-amber-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <i className="fa-solid fa-gear w-5 mr-3"></i>
                    <span>Settings</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>v2.1.0</span>
              <button className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-question-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-4">
                <nav className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-700 font-medium">{breadcrumb}</span>
                </nav>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* Location Switcher */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLocationMenu(!showLocationMenu);
                      setShowUserMenu(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-location-dot text-amber-700"></i>
                    <span className="text-sm font-medium text-gray-700">{currentLocation.name}</span>
                    <i className="fa-solid fa-chevron-down text-xs text-gray-400"></i>
                  </button>

                  {showLocationMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Select Location</p>
                      </div>
                      {locations.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setCurrentLocation(loc);
                            setShowLocationMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <i
                            className={`fa-solid fa-check mr-3 ${
                              currentLocation.id === loc.id ? 'text-amber-700' : 'text-transparent'
                            }`}
                          ></i>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                            <p className="text-xs text-gray-500">{loc.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowLocationMenu(false);
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-semibold">
                      {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.displayName || `${user?.firstName} ${user?.lastName}` || user?.email || 'User'}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
                    </div>
                    <i className="fa-solid fa-chevron-down text-xs text-gray-400"></i>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                      </div>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <i className="fa-solid fa-user w-5 mr-3"></i>
                        <span>Profile</span>
                      </button>
                      <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <i className="fa-solid fa-gear w-5 mr-3"></i>
                        <span>Settings</span>
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <i className="fa-solid fa-right-from-bracket w-5 mr-3"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
