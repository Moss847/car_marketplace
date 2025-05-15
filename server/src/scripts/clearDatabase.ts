import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Удаляем все записи из базы данных
    await prisma.$transaction([
      prisma.message.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.listing.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Удаляем все фотографии из папки uploads
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'cars');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }

    console.log('База данных и файлы успешно очищены');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase(); 