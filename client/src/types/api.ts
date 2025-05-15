import type { User } from './auth';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  brand: string;
  model: string;
  brandName: string;
  modelName: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  color: string;
  location: string;
  images: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  engineVolume: number;
  power: number;
  deletedAt: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface ListingFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  location?: string;
  brand?: string;
  model?: string;
  fuelType?: string;
  transmission?: string;
}

export interface CreateListingData {
  title: string;
  description: string;
  price: number;
  year: number;
  mileage: number;
  location: string;
  images: File[];
  brand: string;
  model: string;
  fuelType: string;
  transmission: string;
  engineVolume: number;
  power: number;
  color: string;
}

export interface SendMessageData {
  listingId: string;
  content: string;
} 