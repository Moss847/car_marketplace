import type { User } from './auth';

declare global {
  interface Window {
    env: {
      VITE_API_URL: string;
    };
  }
}

declare module '@tanstack/react-query' {
  interface QueryKey {
    listings: string[];
    listing: [string, string];
    messages: [string, string];
    userListings: string[];
  }
}

declare module '../services/api' {
  interface Listing {
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
    userId: string;
    createdAt: string;
    updatedAt: string;
    engineVolume: number;
    power: number;
    user: User;
  }

  interface Message {
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
} 