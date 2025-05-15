import React from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../types/api';
import { useNavigate } from 'react-router-dom';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
    location: string;
    createdAt: string;
    deletedAt?: string | null;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  isFavorite: boolean;
  onFavoriteClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, isFavorite, onFavoriteClick }) => {
  const navigate = useNavigate();
  const isDeleted = listing.deletedAt != null;

  const handleClick = () => {
    if (!isDeleted) {
      navigate(`/listings/${listing.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteClick();
  };

  return (
    <Link to={`/listings/${listing.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className={`w-full h-48 object-cover ${!isDeleted ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
          />
          {isDeleted && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">Объявление удалено</span>
            </div>
          )}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 p-2 rounded-full ${
              isFavorite ? 'text-red-500' : 'text-gray-400'
            } hover:text-red-500 transition-colors bg-white/80 hover:bg-white`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="w-6 h-6"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <h3 className={`text-lg font-semibold mb-2 ${isDeleted ? 'text-gray-500' : ''}`}>
            {listing.title}
          </h3>
          <p className="text-xl font-bold text-primary-600 mb-2">
            {listing.price.toLocaleString()} ₽
          </p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{listing.location}</span>
            <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {listing.user.firstName} {listing.user.lastName}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard; 