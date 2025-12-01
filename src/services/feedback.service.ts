import api from '../config/api';
import { Feedback } from '../types';

export const feedbackService = {
  async getAll(params?: { startDate?: string; endDate?: string; productId?: string }) {
    const response = await api.get<{ data: Feedback[] }>('/feedback', { params });
    return response.data.data;
  },

  async exportCSV(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/feedback/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
