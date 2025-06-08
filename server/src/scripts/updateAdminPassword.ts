import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const email = 'admin@example.com';
    const newPassword = 'Ploxoi57R'; // Новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const adminUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (adminUser) {
      const updatedAdmin = await prisma.user.update({
        where: {
          id: adminUser.id,
        },
        data: {
          password: hashedPassword,
        },
      });
      console.log('Admin user password updated successfully:', updatedAdmin.email);
    } else {
      console.log('Admin user not found.');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 