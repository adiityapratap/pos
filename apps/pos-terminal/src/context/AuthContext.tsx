import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient, initializeApiClient, isElectron } from '../config/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (employeeId: string, pin: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('pos_accessToken');
  });
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('pos_user');
    return userData ? JSON.parse(userData) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode] = useState(isElectron);

  // Initialize API on mount
  useEffect(() => {
    const init = async () => {
      if (isElectron) {
        await initializeApiClient();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (employeeId: string, pin: string) => {
    // For local/offline mode, use PIN directly
    // employeeId is ignored for local mode, we just use PIN
    const response = await apiClient.post('/auth/pin-login', {
      pin: pin,
      employeeId: employeeId, // May be used by cloud server
    });

    const { accessToken: token, user: userData, token: altToken } = response.data;
    const finalToken = token || altToken;
    
    // Handle different response formats
    const finalUser: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || userData.first_name || '',
      lastName: userData.lastName || userData.last_name || '',
      role: userData.role,
      displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    };
    
    setAccessToken(finalToken);
    setUser(finalUser);
    localStorage.setItem('pos_accessToken', finalToken);
    localStorage.setItem('pos_user', JSON.stringify(finalUser));
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('pos_accessToken');
    localStorage.removeItem('pos_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
        isLoading,
        isOfflineMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
