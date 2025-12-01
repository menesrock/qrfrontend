import api from '../config/api';
import { CallRequest } from '../types';

export const callRequestsService = {
  async getAll(params?: { tableId?: string; status?: string }) {
    const response = await api.get<{ data: CallRequest[] }>('/call-requests', { params });
    return response.data.data;
  },

  async create(data: { tableId: string; tableName: string; customerName: string; type: string }) {
    const response = await api.post<CallRequest>('/call-requests', data);
    return response.data;
  },

  async complete(id: string) {
    const response = await api.put<CallRequest>(`/call-requests/${id}/complete`);
    return response.data;
  },

  async claim(id: string) {
    const response = await api.post<CallRequest>(`/call-requests/${id}/claim`);
    return response.data;
  },

  async release(id: string) {
    const response = await api.post<CallRequest>(`/call-requests/${id}/release`);
    return response.data;
  },
};
