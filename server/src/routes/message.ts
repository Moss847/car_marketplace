import express, { Request, Response, RequestHandler } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { auth } from '../middleware/auth';
import { Server } from 'socket.io';

// Удаляем интерфейс AuthRequest, так как он расширен глобально в express.d.ts
// interface AuthRequest extends Request {
//   user: {
//     id: string;
//   };
// }

export default (io: Server) => {
  const router = express.Router();
  const prisma = new PrismaClient();

  // Получить список диалогов пользователя
  const getConversations: RequestHandler = async (req: Request, res: Response) => {
    try {
      // Проверяем, что пользователь аутентифицирован
      if (!req.user) {
        res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
        return;
      }

      // Администратор не может просматривать сообщения
      if (req.user.role === Role.ADMIN) {
        res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут просматривать сообщения.' });
        return;
      }

      const userId = req.user.id;

      // Получаем все сообщения пользователя
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          listing: {
            include: {
              user: true
            }
          },
          sender: true,
          receiver: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Группируем сообщения по объявлениям
      const conversationsMap = new Map();
      messages.forEach(message => {
        const otherParticipantId = message.senderId === userId ? message.receiverId : message.senderId;
        const conversationKey = `${message.listing.id}-${otherParticipantId}`;

        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, message);
        } else {
          const existingMessage = conversationsMap.get(conversationKey);
          if (new Date(message.createdAt) > new Date(existingMessage.createdAt)) {
            conversationsMap.set(conversationKey, message);
          }
        }
      });

      const conversations = Array.from(conversationsMap.values());
      res.json(conversations);
      return;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Error fetching conversations' });
      return;
    }
  };

  // Получить сообщения для объявления
  const getMessages: RequestHandler = async (req: Request, res: Response) => {
    try {
      // Проверяем, что пользователь аутентифицирован
      if (!req.user) {
        res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
        return;
      }

      // Администратор не может просматривать сообщения
      if (req.user.role === Role.ADMIN) {
        res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут просматривать сообщения.' });
        return;
      }

      const listingId = req.params.listingId;
      const userId = req.user.id;
      const { otherParticipantId } = req.query;

      // Проверяем существование объявления
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      });

      if (!listing) {
        res.status(404).json({ error: 'Объявление не найдено или удалено' });
        return;
      }

      // Получаем сообщения для объявления
      const messages = await prisma.message.findMany({
        where: {
          listingId,
          OR: [
            { senderId: userId, receiverId: otherParticipantId as string },
            { senderId: otherParticipantId as string, receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          listing: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      res.json({ 
        data: messages,
        listingStatus: {
          isDeleted: !!listing.deletedAt,
          deletedAt: listing.deletedAt
        }
      });
      return;
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Error fetching messages' });
      return;
    }
  };

  // Отправить сообщение
  const sendMessage: RequestHandler = async (req: Request, res: Response) => {
    try {
      // Проверяем, что пользователь аутентифицирован
      if (!req.user) {
        res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
        return;
      }

      // Администратор не может отправлять сообщения
      if (req.user.role === Role.ADMIN) {
        res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут отправлять сообщения.' });
        return;
      }

      const listingId = req.params.listingId;
      const { content, receiverId } = req.body;
      const senderId = req.user.id;

      // Проверяем существование объявления
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      });

      if (!listing) {
        res.status(404).json({ error: 'Объявление не найдено или удалено' });
        return;
      }

      // Проверяем, не удалено ли объявление
      if (listing.deletedAt) {
        res.status(403).json({ error: 'Невозможно отправить сообщение для удаленного объявления' });
        return;
      }

      // Создаем сообщение
      const message = await prisma.message.create({
        data: {
          content,
          senderId,
          receiverId,
          listingId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          listing: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      // Отправляем сообщение через Socket.IO
      io.to(`chat_${listingId}`).emit('new_message', message);

      res.status(201).json({ data: message });
      return;
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Error sending message' });
      return;
    }
  };

  // Регистрируем маршруты
  router.get('/conversations', auth, getConversations);
  router.get('/listing/:listingId', auth, getMessages);
  router.post('/listing/:listingId', auth, sendMessage);

  return router;
}; 