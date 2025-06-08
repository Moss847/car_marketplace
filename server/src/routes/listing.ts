import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { auth } from '../middleware/auth';
import { upload } from '../config/cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getBrandName, getModelName } from '../data/cars';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware для обработки загрузки файлов
const handleFileUpload: RequestHandler = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 10MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum is 5 files' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Create new listing
const createListing: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Проверяем роль пользователя: администратор не может создавать объявления
    if (req.user?.role === Role.ADMIN) {
      res.status(403).json({ error: 'Администраторы не могут создавать объявления.' });
      return;
    }

    const {
      title,
      description,
      price,
      brand,
      model,
      year,
      mileage,
      color,
      fuelType,
      transmission,
      location,
    } = req.body;

    // Проверяем наличие файлов
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No images uploaded' });
      return;
    }

    // Получаем пути к загруженным изображениям
    const images = (req.files as Express.Multer.File[]).map(file => `/uploads/cars/${file.filename}`);

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: Number(price),
        brand,
        model,
        year: Number(year),
        mileage: Number(mileage),
        color,
        fuelType,
        transmission,
        images,
        location,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json(listing);
    return;
  } catch (error) {
    console.error('Error creating listing:', error);
    // Если произошла ошибка, удаляем загруженные файлы
    if (req.files && Array.isArray(req.files)) {
      (req.files as Express.Multer.File[]).forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(400).json({ error: 'Error creating listing' });
    return;
  }
};

// Get all listings with filters
const getListings: RequestHandler = async (req: Request, res: Response) => {
  try {
    const {
      brand,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      fuelType,
      transmission,
      location,
    } = req.query;

    const where: any = {
      deletedAt: null
    };

    if (brand) where.brand = brand as string;
    if (model) where.model = model as string;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    if (location) where.location = location as string;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    
    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year.gte = Number(minYear);
      if (maxYear) where.year.lte = Number(maxYear);
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Добавляем названия марок и моделей
    const transformedListings = listings.map(listing => ({
      ...listing,
      brandName: getBrandName(listing.brand),
      modelName: getModelName(listing.brand, listing.model)
    }));

    res.json(transformedListings);
    return;
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Error fetching listings' });
    return;
  }
};

// Get single listing
const getListing: RequestHandler = async (req: Request, res: Response) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Добавляем названия марки и модели
    const transformedListing = {
      ...listing,
      brandName: getBrandName(listing.brand),
      modelName: getModelName(listing.brand, listing.model)
    };

    res.json(transformedListing);
    return;
  } catch (error) {
    res.status(400).json({ error: 'Error fetching listing' });
    return;
  }
};

// Update listing
const updateListing: RequestHandler = async (req: Request, res: Response) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Администратор может обновлять любые объявления, обычный пользователь - только свои
    if (req.user?.role !== Role.ADMIN && listing.userId !== req.user?.id) {
      res.status(403).json({ error: 'Недостаточно прав для обновления этого объявления.' });
      return;
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'title',
      'description',
      'price',
      'brand',
      'model',
      'year',
      'mileage',
      'color',
      'fuelType',
      'transmission',
      'images',
      'location',
    ];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      res.status(400).json({ error: 'Invalid updates' });
      return;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json(updatedListing);
    return;
  } catch (error) {
    res.status(400).json({ error: 'Error updating listing' });
    return;
  }
};

// Delete listing (soft delete)
const deleteListing: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      res.status(404).json({ error: 'Объявление не найдено' });
      return;
    }

    // Администратор может удалить любое объявление, обычный пользователь - только свое
    if (req.user.role !== Role.ADMIN && listing.userId !== req.user.id) {
      res.status(403).json({ error: 'Недостаточно прав для удаления этого объявления' });
      return;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Listing deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Error deleting listing' });
    return;
  }
};

// Get user listings
const getUserListings: RequestHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    const listings = await prisma.listing.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Преобразуем ID в названия
    const transformedListings = listings.map(listing => ({
      ...listing,
      brandName: getBrandName(listing.brand),
      modelName: getModelName(listing.brand, listing.model)
    }));

    res.json(transformedListings);
    return;
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Error fetching user listings' });
    return;
  }
};

// Add listing to favorites
const addToFavorites: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    // Администратор не может добавлять в избранное
    if (req.user.role === Role.ADMIN) {
      res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут добавлять в избранное.' });
      return;
    }

    const listingId = req.params.id;
    const userId = req.user.id;

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Check if user is trying to add their own listing
    if (listing.userId === userId) {
      res.status(400).json({ error: 'You cannot add your own listing to favorites' });
      return;
    }

    // Check if listing is already in favorites
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    if (existingFavorite) {
      res.status(400).json({ error: 'Listing is already in favorites' });
      return;
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId,
        listingId,
      },
    });

    res.json({ message: 'Added to favorites' });
    return;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(400).json({ error: 'Error adding to favorites' });
    return;
  }
};

// Remove listing from favorites
const removeFromFavorites: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    // Администратор не может удалять из избранного
    if (req.user.role === Role.ADMIN) {
      res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут удалять из избранного.' });
      return;
    }

    const listingId = req.params.id;
    const userId = req.user.id;

    // Remove from favorites
    await prisma.favorite.deleteMany({
      where: {
        userId,
        listingId,
      },
    });

    res.json({ message: 'Removed from favorites' });
    return;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(400).json({ error: 'Error removing from favorites' });
    return;
  }
};

// Get user's favorite listings
const getFavorites: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    // Администратор не может просматривать избранное
    if (req.user.role === Role.ADMIN) {
      res.status(403).json({ error: 'Доступ запрещен. Администраторы не могут просматривать избранное.' });
      return;
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        listing: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(favorites.map(fav => fav.listing));
    return;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Error fetching favorites' });
    return;
  }
};

// Permanent delete listing
const permanentDeleteListing: RequestHandler = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const userId = req.user?.id; // Используем optional chaining
    const userRole = req.user?.role; // Используем optional chaining

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      res.status(404).json({ error: 'Объявление не найдено' });
      return;
    }

    // Проверяем аутентификацию
    if (!req.user) {
      res.status(401).json({ error: 'Не аутентифицирован. Пожалуйста, войдите в систему.' });
      return;
    }

    // Администратор может удалить любое объявление, обычный пользователь - только свое
    if (userRole !== Role.ADMIN && listing.userId !== userId) {
      res.status(403).json({ error: 'Нет прав для удаления этого объявления' });
      return;
    }

    // Удаляем только из избранного и помечаем объявление как удаленное
    await prisma.$transaction([
      // Удаляем из избранного
      prisma.favorite.deleteMany({
        where: { listingId }
      }),
      // Помечаем объявление как удаленное
      prisma.listing.update({
        where: { id: listingId },
        data: {
          deletedAt: new Date()
        }
      })
    ]);

    res.json({ message: 'Объявление успешно удалено' });
    return;
  } catch (error) {
    console.error('Error permanently deleting listing:', error);
    res.status(500).json({ error: 'Ошибка при удалении объявления' });
    return;
  }
};

// Register routes
router.post('/', auth, handleFileUpload, createListing);
router.get('/', getListings);
router.get('/user', auth, getUserListings);
router.get('/favorites', auth, getFavorites);
router.post('/:id/favorite', auth, addToFavorites);
router.delete('/:id/favorite', auth, removeFromFavorites);
router.get('/:id', getListing);
router.patch('/:id', auth, updateListing);
router.delete('/:id', auth, deleteListing);
router.delete('/:id/permanent', auth, permanentDeleteListing);

export default router; 