import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  login: async (email, password) => {
    const response = await authService.login(email, password);
    authService.setToken(response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    authService.removeToken();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: () => {
    const token = authService.getToken();
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
        });
      } catch (error) {
        authService.removeToken();
      }
    }
  },
}));
