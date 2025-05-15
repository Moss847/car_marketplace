import axios from 'axios';

const BASE_URL = 'https://cars-base.ru/api';

export interface CarMark {
  id: string;
  name: string;
  "cyrillic-name": string;
  country: string;
  models?: number;
}

export interface CarModel {
  id: string;
  name: string;
  "cyrillic-name": string;
  class?: string;
  year_from?: number;
  year_to?: number;
}

export interface ApiStatus {
  lastUpdate: string;
  previousUpdate: string;
  info: string;
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const carBrandsApi = {
  // Получить статус API
  getStatus: async (): Promise<ApiStatus> => {
    const response = await axiosInstance.get('/status');
    return response.data;
  },

  // Получить все марки и модели
  getAllCars: async (): Promise<CarMark[]> => {
    const response = await axiosInstance.get('/cars?full=1');
    return response.data;
  },

  // Получить только марки
  getMarks: async (): Promise<CarMark[]> => {
    const response = await axiosInstance.get('/cars');
    return response.data;
  },

  // Получить модели конкретной марки
  getModels: async (markId: string): Promise<CarModel[]> => {
    const response = await axiosInstance.get(`/cars/${markId}`);
    return response.data;
  }
}; 