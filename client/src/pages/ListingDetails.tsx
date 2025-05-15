import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { listings } from '../services/api';
import { RootState } from '../store';
import type { Listing } from '../types/api';
import { normalizePhone } from '../utils/validation';

const ListingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSellerInfo, setShowSellerInfo] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listings.getById(id!),
  });

  // Получаем похожие объявления по марке
  const { data: similarListings } = useQuery({
    queryKey: ['similarListings', listing?.data?.brand],
    queryFn: () => listings.getAll({ brand: listing?.data?.brand }),
    enabled: !!listing?.data?.brand,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listings.getFavorites(),
    enabled: isAuthenticated,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: () => listings.addToFavorites(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: () => listings.removeFromFavorites(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleContactClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${id}`);
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setError(null);
    const isFavorite = favorites?.data.some((fav: Listing) => fav.id === id);
    if (isFavorite) {
      removeFromFavoritesMutation.mutate(undefined, {
        onError: (error: any) => {
          setError(error.response?.data?.error || 'Error removing from favorites');
        }
      });
    } else {
      addToFavoritesMutation.mutate(undefined, {
        onError: (error: any) => {
          setError(error.response?.data?.error || 'Error adding to favorites');
        }
      });
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!listing?.data) {
    return <div className="text-center">Listing not found</div>;
  }

  const { data } = listing;
  const isFavorite = favorites?.data.some((fav: Listing) => fav.id === id);
  const isOwnListing = user?.id === data.user?.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative">
              <img
                src={data.images[currentImageIndex]}
                alt={`${data.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-96 object-cover rounded-lg"
              />
              {data.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {data.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            {data.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {data.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 ${
                      currentImageIndex === index ? 'ring-2 ring-primary-600' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{data.title}</h1>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {data.price.toLocaleString()} ₽
                </p>
              </div>
              {!isOwnListing && (
                <div className="flex flex-col items-end">
                  <button
                    onClick={handleFavoriteClick}
                    className={`p-2 rounded-full ${
                      isFavorite ? 'text-red-500' : 'text-gray-400'
                    } hover:text-red-500 transition-colors`}
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
                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Марка</p>
                <p className="font-medium">{data.brandName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Модель</p>
                <p className="font-medium">{data.modelName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Год</p>
                <p className="font-medium">{data.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Пробег</p>
                <p className="font-medium">{data.mileage.toLocaleString()} км</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Тип двигателя</p>
                <p className="font-medium">{data.fuelType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Коробка передач</p>
                <p className="font-medium">{data.transmission}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Цвет</p>
                <p className="font-medium">{data.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Город</p>
                <p className="font-medium">{data.location}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Описание</h2>
              <p className="text-gray-700">{data.description}</p>
            </div>

            <button
              onClick={() => setShowSellerInfo(true)}
              className="btn w-full mb-4"
              style={{ backgroundColor: '#01a749', color: 'white' }}
            >
              Show Seller Information
            </button>

            {!isOwnListing && (
              <button
                onClick={handleContactClick}
                className="btn btn-primary w-full"
              >
                {isAuthenticated ? 'Contact Seller' : 'Login to Contact Seller'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Похожие объявления */}
      {similarListings?.data && similarListings.data.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Похожие объявления</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarListings.data
              .filter((item: Listing) => item.id !== id) // Исключаем текущее объявление
              .slice(0, 3) // Показываем только 3 объявления
              .map((item: Listing) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/listings/${item.id}`)}
                >
                  {item.images?.[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <h3 className="text-base font-semibold truncate">
                      {item.title}
                    </h3>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {item.price.toLocaleString()} ₽
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {item.year} год • {item.mileage.toLocaleString()} км
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {item.location}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Seller Information Modal */}
      {showSellerInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Seller Information</h2>
              <button
                onClick={() => setShowSellerInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="font-medium">
                {data.user?.firstName} {data.user?.lastName}
              </p>
              {data.user?.phone && (
                <p className="text-gray-600">{normalizePhone(data.user.phone)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails; 