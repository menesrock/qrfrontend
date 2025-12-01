import api from '../config/api';
import { User } from '../types';

export const usersService = {
  async getAll() {
    const response = await api.get<{ data: User[] }>('/users');
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async create(data: { email: string; password: string; role: string; permissions?: string[] }) {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  async update(id: string, data: Partial<User> & { password?: string }) {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/users/${id}`);
  },
};
