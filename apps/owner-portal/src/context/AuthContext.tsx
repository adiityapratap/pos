import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface OwnerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'super_admin';
  displayName: string;
}

interface AuthContextType {
  user: OwnerUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('ownerAccessToken');
  });
  const [user, setUser] = useState<OwnerUser | null>(() => {
    const userData = localStorage.getItem('ownerUser');
    return userData ? JSON.parse(userData) : null;
  });

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/owner-login`, {
      email,
      password,
    });

    const { accessToken: token, user: userData } = response.data;
    
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('ownerAccessToken', token);
    localStorage.setItem('ownerUser', JSON.stringify(userData));
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('ownerAccessToken');
    localStorage.removeItem('ownerUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
        isLoading: false,
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
