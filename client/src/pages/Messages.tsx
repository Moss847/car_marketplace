import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { messages } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    deletedAt?: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface MessagesResponse {
  data: Message[];
}

const Messages: React.FC = () => {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListingDeleted, setIsListingDeleted] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messages.getConversations
  });

  console.log('Raw Conversations Data:', conversationsData); // Debug log for raw data

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedListingId],
    queryFn: async () => {
      if (!selectedListingId) return { data: [] };
      const response = await messages.getByListing(selectedListingId);
      console.log('Raw Messages Response:', response); // Debug log for raw response
      return response;
    },
    enabled: !!selectedListingId
  });

  console.log('Raw Messages Data:', messagesData); // Debug log for raw data

  // Проверяем структуру данных
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];
  const messagesList = Array.isArray(messagesData?.data) ? messagesData.data : [];

  console.log('Processed Conversations:', conversations); // Debug log for processed conversations
  console.log('Processed Messages:', messagesList); // Debug log for processed messages

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => messages.send(selectedListingId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedListingId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const content = new FormData(form).get('content') as string;
    if (content && selectedListingId) {
      sendMessageMutation.mutate(content);
      form.reset();
    }
  };

  const isCurrentUser = (message: Message) => {
    return message.senderId === user?.id;
  };

  // Обновляем состояние isListingDeleted при получении данных
  useEffect(() => {
    if (messagesData?.listingStatus) {
      setIsListingDeleted(messagesData.listingStatus.isDeleted);
    }
  }, [messagesData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Сообщения</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая панель со списком диалогов */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Диалоги</h2>
            {isLoadingConversations ? (
              <LoadingSpinner />
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500">
                У вас пока нет сообщений
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((message: Message) => {
                  const isDeleted = message.listing.deletedAt != null;
                  return (
                    <button
                      key={message.id}
                      onClick={() => setSelectedListingId(message.listing?.id)}
                      className={`w-full text-left p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        selectedListingId === message.listing?.id ? 'bg-gray-50' : ''
                      } ${isDeleted ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-center space-x-4">
                        {message.listing?.images?.[0] && (
                          <div className="relative w-16 h-16">
                            <img
                              src={message.listing.images[0]}
                              alt={message.listing.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                            {isDeleted && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center">
                                <span className="text-white text-xs">Удалено</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium truncate ${isDeleted ? 'text-gray-500' : ''}`}>
                            {message.listing?.title || 'Объявление удалено'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{message.content}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Правая панель с сообщениями */}
        <div className="lg:col-span-2">
          {selectedListingId ? (
            <div className="bg-white rounded-lg shadow-md">
              {isLoadingMessages ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messagesList.length > 0 ? (
                      messagesList.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser(message) ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isCurrentUser(message)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className="text-xs mt-1 opacity-75">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        Нет сообщений
                      </div>
                    )}
                  </div>

                  {!isListingDeleted ? (
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          name="content"
                          placeholder="Введите сообщение..."
                          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                          required
                        />
                        <button
                          type="submit"
                          disabled={sendMessageMutation.isPending}
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendMessageMutation.isPending ? 'Отправка...' : 'Отправить'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 border-t bg-gray-50 text-center text-gray-500">
                      Невозможно отправить сообщение для удаленного объявления
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md flex items-center justify-center h-96">
              <p className="text-gray-500">Выберите диалог слева</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;