import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listings } from '../services/api';
import type { ListingFilters, CreateListingData } from '../types/api';

export const useListings = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getListings = (filters?: ListingFilters) =>
    useQuery({
      queryKey: ['listings', filters],
      queryFn: () => listings.getAll(filters),
    });

  const getListing = (id: string) =>
    useQuery({
      queryKey: ['listing', id],
      queryFn: () => listings.getById(id),
    });

  const getUserListings = () =>
    useQuery({
      queryKey: ['userListings'],
      queryFn: () => listings.getUserListings(),
    });

  const createListingMutation = useMutation({
    mutationFn: (data: CreateListingData) => listings.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['userListings'] });
      navigate(`/listings/${response.data.id}`);
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateListingData> }) =>
      listings.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', response.data.id] });
      queryClient.invalidateQueries({ queryKey: ['userListings'] });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id: string) => listings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['userListings'] });
      navigate('/');
    },
  });

  return {
    getListings,
    getListing,
    getUserListings,
    createListing: createListingMutation.mutate,
    updateListing: updateListingMutation.mutate,
    deleteListing: deleteListingMutation.mutate,
    isCreating: createListingMutation.isPending,
    isUpdating: updateListingMutation.isPending,
    isDeleting: deleteListingMutation.isPending,
    error:
      createListingMutation.error ||
      updateListingMutation.error ||
      deleteListingMutation.error,
  };
}; 