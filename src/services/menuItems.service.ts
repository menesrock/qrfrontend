import api from '../config/api';
import { MenuItem } from '../types';

export const menuItemsService = {
  async getAll() {
    const response = await api.get<{ data: MenuItem[] }>('/menu-items');
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<MenuItem>(`/menu-items/${id}`);
    return response.data;
  },

  async create(data: Partial<MenuItem>) {
    const response = await api.post<MenuItem>('/menu-items', data);
    return response.data;
  },

  async update(id: string, data: Partial<MenuItem>) {
    const response = await api.put<MenuItem>(`/menu-items/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/menu-items/${id}`);
    return response.data;
  },
};
