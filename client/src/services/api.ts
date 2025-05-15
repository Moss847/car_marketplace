import axios from 'axios';
import type {
  Listing,
  ListingFilters,
  CreateListingData,
  SendMessageData,
} from '../types/api';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../types/auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  checkEmail: (email: string) => api.get<{ exists: boolean }>(`/auth/check-email?email=${email}`),
  register: (data: RegisterCredentials) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', data),
  getCurrentUser: () => api.get<AuthResponse>('/auth/me'),
  updateProfile: (data: Partial<RegisterCredentials>) =>
    api.patch<AuthResponse>('/auth/profile', data),
};

// Listing endpoints
export const listings = {
  getAll: (params?: ListingFilters) =>
    api.get<Listing[]>('/listings', { params }),
  getById: (id: string) => api.get<Listing>(`/listings/${id}`),
  create: (data: FormData) => {
    const formDataApi = axios.create({
      baseURL: '/api',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return formDataApi.post<Listing>('/listings', data);
  },
  update: (id: string, data: Partial<CreateListingData>) =>
    api.put<Listing>(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  getUserListings: () => api.get<Listing[]>('/listings/user'),
  getFavorites: () => api.get<Listing[]>('/listings/favorites'),
  addToFavorites: (id: string) => api.post(`/listings/${id}/favorite`),
  removeFromFavorites: (id: string) => api.delete(`/listings/${id}/favorite`),
  deleteListing: (id: string) => {
    return api.delete(`/listings/${id}`);
  },
  permanentDeleteListing: (id: string) => {
    return api.delete(`/listings/${id}/permanent`);
  },
};

// Message endpoints
export const messages = {
  getByListing: async (listingId: string) => {
    const response = await api.get(`/messages/listing/${listingId}`);
    console.log('API Response for getByListing:', response); // Debug log
    return response.data;
  },
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    console.log('API Response for getConversations:', response); // Debug log
    return response.data;
  },
  send: async (listingId: string, content: string) => {
    const response = await api.post(`/messages/listing/${listingId}`, { content });
    console.log('API Response for send:', response); // Debug log
    return response.data;
  },
};

export default api; 