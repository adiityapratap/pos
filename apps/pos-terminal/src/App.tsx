import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SetupPage from './pages/setup/SetupPage';
import POSTerminal from './pages/pos/POSTerminal';
import OrdersPage from './pages/pos/OrdersPage';
import './App.css';

// Using HashRouter for Electron compatibility (file:// protocol)
function App() {
  return (
    <AuthProvider>
      <SocketProvider autoConnect={true}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            
            {/* POS Terminal Route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <POSTerminal />
                </ProtectedRoute>
              }
            />
            
            {/* Orders Page Route */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

