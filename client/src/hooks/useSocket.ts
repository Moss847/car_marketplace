import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../types/api';

interface UseSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
}

export const useSocket = (listingId?: string): UseSocketResult => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(new Error('Authentication required'));
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      query: listingId ? { listingId } : undefined,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(err);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [listingId]);

  return {
    socket,
    isConnected,
    error,
  };
}; 