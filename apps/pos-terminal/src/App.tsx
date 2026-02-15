import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import POSTerminal from './pages/pos/POSTerminal';
import OrdersPage from './pages/pos/OrdersPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

