import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { listings } from '../services/api';
import { RootState } from '../store';
import ListingCard from '../components/ListingCard';
import type { Listing } from '../types/api';

const Favorites: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [error, setError] = React.useState<string | null>(null);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listings.getFavorites(),
    enabled: isAuthenticated,
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: (listingId: string) => listings.removeFromFavorites(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Error removing from favorites');
    }
  });

  const handleFavoriteClick = (listingId: string) => {
    setError(null);
    removeFromFavoritesMutation.mutate(listingId);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view your favorites.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Избранное</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {favorites?.data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">У вас пока нет избранных объявлений</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites?.data.map((listing: Listing) => (
            <ListingCard
              key={listing.id}
              listing={{
                ...listing,
                user: {
                  firstName: listing.user?.firstName || '',
                  lastName: listing.user?.lastName || '',
                },
              }}
              isFavorite={true}
              onFavoriteClick={() => handleFavoriteClick(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;