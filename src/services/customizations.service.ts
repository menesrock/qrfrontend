import api from '../config/api';
import { Customization } from '../types';

export interface CustomizationPayload extends Omit<Customization, 'id'> {
  id?: string;
}

export const customizationsService = {
  async getByMenuItem(menuItemId: string) {
    const response = await api.get<{ data: Customization[] }>('/customizations', {
      params: { menuItemId },
    });
    return response.data.data;
  },

  async replace(menuItemId: string, customizations: CustomizationPayload[]) {
    const response = await api.put<{ data: Customization[] }>(
      `/customizations/menu-item/${menuItemId}`,
      { customizations }
    );
    return response.data.data;
  },
};

