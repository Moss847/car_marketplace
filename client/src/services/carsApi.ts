import axios from "axios";

const BASE_URL = "/api/listings";

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

// Ответ для списка марок
export type MarksResponse = CarMark[];

// Ответ для списка моделей
export type ModelsResponse = CarModel[];

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const carsApi = {
  // Получить все объявления
  getListings: async (filters?: any): Promise<any[]> => {
    const response = await axiosInstance.get("", { params: filters });
    return response.data;
  },

  // Получить одно объявление по ID
  getListing: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  },

  // Создать новое объявление
  createListing: async (data: any): Promise<any> => {
    const response = await axiosInstance.post("", data);
    return response.data;
  },

  // Обновить объявление
  updateListing: async (id: string, data: any): Promise<any> => {
    const response = await axiosInstance.patch(`/${id}`, data);
    return response.data;
  },

  // Удалить объявление
  deleteListing: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/${id}`);
  },
};
