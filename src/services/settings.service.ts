import api from '../config/api';
import { Settings } from '../types';

const mapResponseToSettings = (data: any): Settings => ({
  id: data.id,
  logo: data.logo,
  restaurantName: data.restaurantName,
  colors: {
    primary: data.primaryColor,
    secondary: data.secondaryColor,
    accent: data.accentColor,
  },
  customerMenuBaseUrl: data.customerMenuBaseUrl,
  menuCategories: data.menuCategories ?? [],
  updatedAt: data.updatedAt,
});

export const settingsService = {
  async get() {
    const response = await api.get('/settings');
    return mapResponseToSettings(response.data);
  },

  async update(data: Partial<Settings>) {
    const payload = {
      logo: data.logo,
      restaurantName: data.restaurantName,
      primaryColor: data.colors?.primary,
      secondaryColor: data.colors?.secondary,
      accentColor: data.colors?.accent,
      customerMenuBaseUrl: data.customerMenuBaseUrl,
      menuCategories: data.menuCategories,
    };
    const response = await api.put('/settings', payload);
    return mapResponseToSettings(response.data);
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('image', file); // Changed from 'file' to 'image' to match backend

    const response = await api.post<{ images: { full: string; medium: string; thumbnail: string } }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Return the full size image URL
    return response.data.images.full;
  },
};
