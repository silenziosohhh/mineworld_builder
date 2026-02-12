import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('auth_token'),
  
  login: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, isAuthenticated: true, token });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false, token: null });
  },
}));
