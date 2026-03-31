import api from './api';
import { User } from '@/types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(
    name: string,
    email: string,
    password: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<User> {
    const response = await api.post<User>('/users', {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },
};
