import api from '../config/api';
import { Order } from '../types';

export const ordersService = {
  async getAll(params?: { tableId?: string; status?: string }) {
    const response = await api.get<{ data: Order[] }>('/orders', { params });
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async create(data: Partial<Order>) {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  async update(id: string, data: Partial<Order>) {
    const response = await api.put<Order>(`/orders/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await api.put<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },

  async claim(id: string) {
    const response = await api.post<Order>(`/orders/${id}/claim`);
    return response.data;
  },

  async release(id: string) {
    const response = await api.post<Order>(`/orders/${id}/release`);
    return response.data;
  },
};
