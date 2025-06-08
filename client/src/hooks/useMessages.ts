import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messages } from '../services/api';
import type { SendMessageData } from '../types/api';

export const useMessages = (listingId?: string, otherParticipantId?: string) => {
  const queryClient = useQueryClient();

  const getMessages = () =>
    useQuery({
      queryKey: ['messages', listingId, otherParticipantId],
      queryFn: () => messages.getByListing(listingId!, otherParticipantId!),
      enabled: !!listingId && !!otherParticipantId,
    });

  const getConversations = () =>
    useQuery({
      queryKey: ['conversations'],
      queryFn: () => messages.getConversations(),
    });

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageData) => messages.send(data.listingId, data.content, data.receiverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', listingId, otherParticipantId] });
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