import { Request, Response, NextFunction } from 'express';
import { User as PrismaUser, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: PrismaUser; // Убедимся, что тип user определен
    }
  }
}

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
  }

  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Доступ запрещен. Только для администраторов.' });
  }

  next();
}; 