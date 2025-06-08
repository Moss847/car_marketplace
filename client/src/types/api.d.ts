import { User } from './auth';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  color: string;
  location: string;
  images: string[];
  user: User;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export interface ListingFilters {
  brand?: string;
  model?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  fuelType?: string;
  transmission?: string;
  location?: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  color: string;
  location: string;
  images: string[];
}

export interface SendMessageData {
  listingId: string;
  content: string;
  receiverId: string;
} 