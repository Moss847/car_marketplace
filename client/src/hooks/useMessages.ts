import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messages } from '../services/api';
import type { SendMessageData } from '../types/api';

export const useMessages = (listingId?: string) => {
  const queryClient = useQueryClient();

  const getMessages = () =>
    useQuery({
      queryKey: ['messages', listingId],
      queryFn: () => messages.getByListing(listingId!),
      enabled: !!listingId,
    });

  const getConversations = () =>
    useQuery({
      queryKey: ['conversations'],
      queryFn: () => messages.getConversations(),
    });

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageData) => messages.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', listingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    getMessages,
    getConversations,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}; 