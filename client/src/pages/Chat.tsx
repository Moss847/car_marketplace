import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { listings, messages } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

const Chat: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Получаем информацию об объявлении
  const { data: listing } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listings.getById(listingId!),
    enabled: !!listingId,
  });

  // Получаем сообщения
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', listingId],
    queryFn: () => messages.getByListing(listingId!),
    enabled: !!listingId && isAuthenticated,
  });

  // Мутация для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => messages.send(listingId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', listingId] });
      setMessage('');
    },
  });

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (isLoadingMessages) {
    return <LoadingSpinner />;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        {/* Заголовок чата */}
        <div className="flex items-center space-x-4 p-4 border-b">
          {listing?.data ? (
            <>
              <img
                src={listing.data.images[0]}
                alt={listing.data.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold">{listing.data.title}</h3>
                <p className="text-sm text-gray-600">
                  {listing.data.price?.toLocaleString()} ₽
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">Удалено</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-500">Объявление удалено</h3>
              </div>
            </div>
          )}
        </div>

        {/* Сообщения */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {Array.isArray(messagesData) ? messagesData.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage(msg.senderId) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage(msg.senderId)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки сообщения */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          {listing?.data ? (
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отправить
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-2">
              Объявление удалено. Отправка сообщений недоступна.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat; 