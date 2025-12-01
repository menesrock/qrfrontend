import api from '../config/api';
import { Table } from '../types';

export const tablesService = {
  async getAll(status?: string) {
    const params = status ? { status } : {};
    const response = await api.get<{ data: Table[] }>('/tables', { params });
    return response.data.data;
  },

  async getById(id: string) {
    const response = await api.get<Table>(`/tables/${id}`);
    return response.data;
  },

  async create(data: { name: string }) {
    const response = await api.post<Table>('/tables', data);
    return response.data;
  },

  async update(id: string, data: Partial<Table>) {
    const response = await api.put<Table>(`/tables/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/tables/${id}`);
  },

  async downloadQRCode(id: string, format: 'png' | 'svg' | 'jpg' = 'png') {
    const response = await api.get(`/tables/${id}/qr`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
