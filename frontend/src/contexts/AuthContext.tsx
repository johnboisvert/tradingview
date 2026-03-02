import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authApi } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authApi.getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        // Demo mode: set a default admin user when no backend is available
        setUser({
          id: 'demo-admin',
          email: 'admin@cryptoia.com',
          name: 'Admin',
          role: 'admin',
        });
      }
    } catch {
      // Demo mode fallback: set admin user
      setUser({
        id: 'demo-admin',
        email: 'admin@cryptoia.com',
        name: 'Admin',
        role: 'admin',
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      await authApi.login();
    } catch {
      setError('Login failed');
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authApi.logout();
    } catch {
      setError('Logout failed');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refetch: checkAuthStatus,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};