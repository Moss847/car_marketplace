import express, { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
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
      const userId = req.user!.id; // Используем req.user! так как auth middleware гарантирует его наличие

      // Получаем все сообщения пользователя, включая сообщения для удаленных объявлений
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

      // Группируем сообщения по объявлениям и берем последнее сообщение для каждого
      // Необходимо скорректировать логику группировки, чтобы она не объединяла диалоги разных покупателей с одним продавцом
      // Сейчас группировка происходит по `listing.id`, что может быть причиной объединения
      // Нужно группировать по `listing.id` И `otherParticipantId` (другому участнику диалога)
      const conversationsMap = new Map();
      messages.forEach(message => {
        const otherParticipantId = message.senderId === userId ? message.receiverId : message.senderId;
        const conversationKey = `${message.listing.id}-${otherParticipantId}`;

        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, message);
        } else {
          // Если уже есть сообщение для этой пары (объявление + участник),
          // обновляем его, если текущее сообщение новее
          const existingMessage = conversationsMap.get(conversationKey);
          if (new Date(message.createdAt) > new Date(existingMessage.createdAt)) {
            conversationsMap.set(conversationKey, message);
          }
        }
      });

      const conversations = Array.from(conversationsMap.values());

      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Error fetching conversations' });
    }
  };

  // Получить сообщения для объявления
  const getMessages: RequestHandler = async (req: Request, res: Response) => {
    try {
      const listingId = req.params.listingId;
      const userId = req.user!.id; // Используем req.user! так как auth middleware гарантирует его наличие
      const { otherParticipantId } = req.query; // Получаем ID другого участника из запроса

      // Проверяем существование объявления
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      });

      if (!listing) {
        res.status(404).json({ error: 'Объявление не найдено или удалено' });
        return;
      }

      // Получаем сообщения для объявления, даже если оно удалено
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

      console.log('Server Messages:', messages); // Debug log
      res.json({ 
        data: messages,
        listingStatus: {
          isDeleted: !!listing.deletedAt,
          deletedAt: listing.deletedAt
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Error fetching messages' });
    }
  };

  // Отправить сообщение
  const sendMessage: RequestHandler = async (req: Request, res: Response) => {
    try {
      const listingId = req.params.listingId;
      const { content, receiverId } = req.body; // Получаем receiverId из тела запроса
      const senderId = req.user!.id; // Используем req.user! так как auth middleware гарантирует его наличие

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

      // Отправляем сообщение через Socket.IO всем участникам чата данного объявления
      io.to(`chat_${listingId}`).emit('new_message', message);

      console.log('Server Created Message:', message); // Debug log
      res.status(201).json({ data: message });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Error sending message' });
    }
  };

  // Регистрируем маршруты
  router.get('/conversations', auth, getConversations);
  router.get('/listing/:listingId', auth, getMessages);
  router.post('/listing/:listingId', auth, sendMessage);

  return router;
}; 