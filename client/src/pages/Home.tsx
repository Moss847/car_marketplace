import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carBrandsApi, CarMark } from '../services/carBrandsApi';
import { carsApi } from '../services/carsApi';
import { useAuth } from '../hooks/useAuth';
import { listings } from '../services/api';
import ListingCard from '../components/ListingCard';

const ITEMS_PER_PAGE = 35; // 5x7 grid

// Популярные марки, которые должны отображаться первыми
const POPULAR_BRANDS = [
  'Audi',
  'BMW',
  'Chery',
  'Chevrolet',
  'Chrysler',
  'Citroen',
  'Daewoo',
  'Lada',
  'Lada (ВАЗ)',
  'Ford',
  'Geely',
  'Honda',
  'Hyundai',
  'Kia',
  'Land Rover',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Omoda',
  'Opel',
  'Peugeot',
  'Renault',
  'Skoda',
  'Subaru',
  'Toyota',
  'Volkswagen',
  'Volvo',
  'Vortex',
  'ЗАЗ',
  'Москвич',
  'УАЗ',
  'Abarth',
  'AC'
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { data: carMarks, isLoading: isLoadingMarks, error: marksError } = useQuery({
    queryKey: ['carMarks'],
    queryFn: carBrandsApi.getMarks
  });

  // Получаем случайные объявления
  const { data: randomListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['randomListings'],
    queryFn: () => carsApi.getListings({ limit: 6 }) // Получаем 6 случайных объявлений
  });

  // Получаем избранные объявления
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listings.getFavorites(),
    enabled: isAuthenticated,
  });

  const handleBrandClick = async (markId: string) => {
    try {
      const response = await fetch('https://cars-base.ru/api/cars?full=1');
      const brands = await response.json();
      const brand = brands.find((b: any) => b.name === markId);
      if (brand) {
        navigate(`/search?brand=${brand.id}`);
      } else {
        navigate(`/search?brand=${markId}`);
      }
    } catch (error) {
      console.error('Error fetching brand ID:', error);
      navigate(`/search?brand=${markId}`);
    }
  };

  if (isLoadingMarks) return <div>Loading...</div>;
  if (marksError) return <div>Error loading car brands</div>;

  // Сортируем марки: сначала популярные, затем по алфавиту
  const sortedMarks = [...(carMarks || [])].sort((a, b) => {
    if (!showAll) {
      const aIndex = POPULAR_BRANDS.indexOf(a.name);
      const bIndex = POPULAR_BRANDS.indexOf(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.name.localeCompare(b.name);
  });

  const displayedMarks = showAll ? sortedMarks : sortedMarks.slice(0, ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Основной контент */}
        <div className={`${isAuthenticated ? 'w-3/4' : 'w-full'}`}>
          <div className="grid grid-cols-5 gap-4">
            {displayedMarks?.map((mark: CarMark) => (
              <div
                key={mark.id}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleBrandClick(mark.name)}
              >
                <h3 className="text-lg font-semibold text-center">
                  {mark.name}
                </h3>
              </div>
            ))}
          </div>

          {!showAll && carMarks && carMarks.length > ITEMS_PER_PAGE && (
            <div className="text-center mt-8">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setShowAll(true)}
              >
                Показать все марки
              </button>
            </div>
          )}

          {/* Случайные объявления */}
          {!isLoadingListings && randomListings && randomListings.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6">Случайные объявления</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {randomListings.map((listing: any) => (
                  <div 
                    key={listing.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                  >
                    {listing.images?.[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold truncate">
                        {listing.title}
                      </h3>
                      <p className="text-xl font-bold text-blue-600 mt-2">
                        {listing.price.toLocaleString()} ₽
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {listing.year} год • {listing.mileage.toLocaleString()} км
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {listing.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Секция избранного для авторизованных пользователей */}
        {isAuthenticated && (
          <div className="w-1/4">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                Избранное
              </h2>
              {favoritesData?.data && favoritesData.data.length > 0 ? (
                <div className="space-y-4">
                  {favoritesData.data.slice(0, 3).map((listing) => {
                    const isDeleted = listing.deletedAt != null;
                    return (
                      <div
                        key={listing.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${isDeleted ? 'opacity-75' : ''}`}
                        onClick={() => !isDeleted && navigate(`/listings/${listing.id}`)}
                      >
                        {listing.images?.[0] && (
                          <div className="relative w-full pb-[56.25%] mb-2">
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="absolute inset-0 w-full h-full object-cover rounded-lg"
                            />
                            {isDeleted && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">Объявление удалено</span>
                              </div>
                            )}
                          </div>
                        )}
                        <h3 className={`font-medium text-sm truncate ${isDeleted ? 'text-gray-500' : ''}`}>
                          {listing.title}
                        </h3>
                        <p className="text-primary-600 font-bold text-sm">
                          {listing.price.toLocaleString()} ₽
                        </p>
                      </div>
                    );
                  })}
                  {favoritesData.data.length > 3 && (
                    <button
                      onClick={() => navigate('/favorites')}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Показать все ({favoritesData.data.length})
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  У вас пока нет избранных объявлений
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 