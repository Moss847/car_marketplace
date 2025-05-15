import express, { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

// Расширяем тип Request для аутентифицированных запросов
interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// Получить список диалогов пользователя
const getConversations: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

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
    const conversationsMap = new Map();
    messages.forEach(message => {
      if (message.listing && !conversationsMap.has(message.listing.id)) {
        conversationsMap.set(message.listing.id, message);
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
const getMessages: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.listingId;
    const userId = req.user.id;

    // Проверяем существование объявления
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Объявление не найдено или удалено' });
    }

    // Получаем сообщения для объявления, даже если оно удалено
    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
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
const sendMessage: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.listingId;
    const { content } = req.body;
    const senderId = req.user.id;

    // Проверяем существование объявления
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Объявление не найдено или удалено' });
    }

    // Проверяем, не удалено ли объявление
    if (listing.deletedAt) {
      return res.status(403).json({ error: 'Невозможно отправить сообщение для удаленного объявления' });
    }

    // Получаем ID получателя (владельца объявления)
    const receiverId = listing.userId;

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

export default router; 