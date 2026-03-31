import api from './api';
import { AuthResponse } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    organizationId: string;
    role?: 'ADMIN' | 'MEMBER';
  }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  setToken(token: string) {
    localStorage.setItem('access_token', token);
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  removeToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};
