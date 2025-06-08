import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { messages, listings } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { io, Socket } from 'socket.io-client';
import { Listing } from '../types/api';

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

const Messages: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialListingId = queryParams.get('listingId');
  const initialOtherParticipantId = queryParams.get('otherParticipantId');

  const [selectedListingId, setSelectedListingId] = useState<string | null>(initialListingId);
  const [selectedOtherParticipantId, setSelectedOtherParticipantId] = useState<string | null>(initialOtherParticipantId);
  const [newMessageContent, setNewMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListingDeleted, setIsListingDeleted] = useState(false);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const socketRef = useRef<Socket | null>(null);

  // Получаем информацию об объявлении для выбранного диалога
  const { data: listingData, isLoading: isLoadingListing } = useQuery<Listing>({
    queryKey: ['listing', selectedListingId],
    queryFn: async () => {
      const response = await listings.getById(selectedListingId!);
      return response.data;
    },
    enabled: !!selectedListingId,
  });

  // Получаем список диалогов пользователя
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery<Message[]>({
    queryKey: ['conversations'],
    queryFn: messages.getConversations,
    enabled: isAuthenticated,
  });

  // Получаем сообщения для выбранного диалога
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<{
    data: Message[],
    listingStatus: { isDeleted: boolean; deletedAt: string | null; };
  }>({
    queryKey: ['messages', selectedListingId, selectedOtherParticipantId],
    queryFn: async () => {
      if (!selectedListingId || !selectedOtherParticipantId) return { data: [], listingStatus: { isDeleted: false, deletedAt: null } };
      const response = await messages.getByListing(selectedListingId, selectedOtherParticipantId);
      return response;
    },
    enabled: !!selectedListingId && !!selectedOtherParticipantId && isAuthenticated,
  });

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: ({ listingId, content, receiverId }: { listingId: string, content: string, receiverId: string }) => 
      messages.send(listingId, content, receiverId),
    onSuccess: (data) => {
      setNewMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.data]);

  // Инициализация Socket.IO
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !selectedListingId) return;

    const socket = io(import.meta.env.VITE_REACT_APP_SERVER_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join_chat', { listingId: selectedListingId, userId: user.id });
    });

    socket.on('new_message', (newMessage: Message) => {
      // Проверяем, относится ли сообщение к текущему активному диалогу
      if (newMessage.listing.id === selectedListingId && 
          ((newMessage.senderId === user.id && newMessage.receiverId === selectedOtherParticipantId) ||
           (newMessage.senderId === selectedOtherParticipantId && newMessage.receiverId === user.id))) {
        queryClient.setQueryData(['messages', selectedListingId, selectedOtherParticipantId], (oldData: any) => {
          return { ...oldData, data: [...(oldData?.data || []), newMessage] };
        });
      }
      // Инвалидируем кэш разговоров, чтобы обновить список диалогов (показывая новые сообщения)
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, selectedListingId, selectedOtherParticipantId]);

  // Обновляем состояние isListingDeleted при получении данных
  useEffect(() => {
    if (messagesData?.listingStatus) {
      setIsListingDeleted(messagesData.listingStatus.isDeleted);
    } else {
      setIsListingDeleted(false); // Сброс, если нет данных
    }
  }, [messagesData]);

  // Автоматический выбор диалога при загрузке с URL параметрами
  useEffect(() => {
    if (initialListingId && initialOtherParticipantId) {
      setSelectedListingId(initialListingId);
      setSelectedOtherParticipantId(initialOtherParticipantId);
    }
  }, [initialListingId, initialOtherParticipantId]);

  const handleSelectConversation = (listingId: string, otherParticipantId: string) => {
    setSelectedListingId(listingId);
    setSelectedOtherParticipantId(otherParticipantId);
    // При выборе нового диалога прокручиваем к последнему сообщению
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessageContent.trim() && selectedListingId && selectedOtherParticipantId && user?.id) {
      sendMessageMutation.mutate({
        listingId: selectedListingId,
        content: newMessageContent,
        receiverId: selectedOtherParticipantId,
      });
    }
  };

  const isOwnMessage = (message: Message) => message.senderId === user?.id;

  const messagesList = messagesData?.data || [];
  const conversations = conversationsData || [];

  // Получаем данные о другом участнике для отображения в заголовке
  const otherParticipant = messagesList.find(msg => 
    msg.sender.id === selectedOtherParticipantId || msg.receiver.id === selectedOtherParticipantId
  )?.sender.id === selectedOtherParticipantId 
    ? messagesList.find(msg => msg.sender.id === selectedOtherParticipantId)?.sender
    : messagesList.find(msg => msg.receiver.id === selectedOtherParticipantId)?.receiver;

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
                  const participant = message.sender.id === user?.id ? message.receiver : message.sender;

                  return (
                    <button
                      key={`${message.listing.id}-${participant.id}`}
                      onClick={() => handleSelectConversation(message.listing.id, participant.id)}
                      className={`w-full text-left p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        selectedListingId === message.listing.id && selectedOtherParticipantId === participant.id
                          ? 'bg-gray-50' : ''
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
                          <p className="text-sm text-gray-500 truncate">
                            {participant.firstName} {participant.lastName}: {message.content}
                          </p>
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
          {selectedListingId && selectedOtherParticipantId ? (
            <div className="bg-white rounded-lg shadow-md h-[700px] flex flex-col">
              {/* Заголовок чата */}
              <div className="flex items-center space-x-4 p-4 border-b">
                {isLoadingListing ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400">Загрузка...</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-500">Загрузка объявления...</h3>
                    </div>
                  </div>
                ) : listingData && listingData.images && listingData.images.length > 0 ? (
                  <>
                    <img
                      src={listingData.images[0]}
                      alt={listingData.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold">{listingData.title}</h3>
                      <p className="text-sm text-gray-600">
                        Разговор с: {otherParticipant?.firstName} {otherParticipant?.lastName}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400">Нет изображения</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-500">Объявление не найдено</h3>
                    </div>
                  </div>
                )}
              </div>

              {isLoadingMessages ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesList.length > 0 ? (
                      messagesList.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage(message) ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isOwnMessage(message)
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
                        Нет сообщений в этом диалоге. Начните общение!
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {!isListingDeleted ? (
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          name="content"
                          value={newMessageContent}
                          onChange={(e) => setNewMessageContent(e.target.value)}
                          placeholder="Введите сообщение..."
                          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                          required
                        />
                        <button
                          type="submit"
                          disabled={sendMessageMutation.isPending || !newMessageContent.trim()}
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
            <div className="bg-white rounded-lg shadow-md flex items-center justify-center h-[700px]">
              <p className="text-gray-500">Выберите диалог слева или перейдите со страницы объявления</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;