import api from '../config/api';

export interface UploadImageResponse {
  message: string;
  images: {
    thumbnail: string;
    medium: string;
    full: string;
  };
}

export const uploadService = {
  uploadImage: async (formData: FormData): Promise<UploadImageResponse> => {
    const response = await api.post<UploadImageResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

