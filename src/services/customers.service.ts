import api from '../config/api';

export interface Customer {
  id: string;
  email: string;
  emailConsent: boolean;
  visitCount: number;
  totalSpent: number;
  lastVisitAt: string | null;
  firstVisitAt: string;
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
}

export interface CreateCustomerData {
  email: string;
  emailConsent: boolean;
}

export const customersService = {
  async createOrUpdate(data: CreateCustomerData): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  async getAll(params?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<{
      data: Customer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/customers', { params });
    return response.data;
  },

  async getById(id: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },
};

