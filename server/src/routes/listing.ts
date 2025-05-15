import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { upload } from '../config/cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getBrandName, getModelName } from '../data/cars';

// Расширяем тип Request для аутентифицированных запросов
interface AuthRequest extends Request {
  user: {
    id: string;
  };
  files?: Express.Multer.File[];
}

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
const createListing: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
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
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Получаем пути к загруженным изображениям
    const images = req.files.map(file => `/uploads/cars/${file.filename}`);

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
        userId: req.user.id,
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
  } catch (error) {
    console.error('Error creating listing:', error);
    // Если произошла ошибка, удаляем загруженные файлы
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(400).json({ error: 'Error creating listing' });
  }
};

// Get all listings with filters
const getListings: RequestHandler = async (req, res) => {
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

    return res.json(transformedListings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return res.status(500).json({ error: 'Error fetching listings' });
  }
};

// Get single listing
const getListing: RequestHandler = async (req, res) => {
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
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Добавляем названия марки и модели
    const transformedListing = {
      ...listing,
      brandName: getBrandName(listing.brand),
      modelName: getModelName(listing.brand, listing.model)
    };

    res.json(transformedListing);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching listing' });
  }
};

// Update listing
const updateListing: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
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
      return res.status(400).json({ error: 'Invalid updates' });
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
  } catch (error) {
    res.status(400).json({ error: 'Error updating listing' });
  }
};

// Delete listing
const deleteListing: RequestHandler = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = (req as any).user.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Мягкое удаление объявления
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Error deleting listing' });
  }
};

// Get user listings
const getUserListings: RequestHandler = async (req: AuthRequest, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Error fetching user listings' });
  }
};

// Add listing to favorites
const addToFavorites: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const userId = req.user.id;

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if user is trying to add their own listing
    if (listing.userId === userId) {
      return res.status(400).json({ error: 'You cannot add your own listing to favorites' });
    }

    // Check if listing is already in favorites
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Listing is already in favorites' });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId,
        listingId,
      },
    });

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(400).json({ error: 'Error adding to favorites' });
  }
};

// Remove listing from favorites
const removeFromFavorites: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(400).json({ error: 'Error removing from favorites' });
  }
};

// Get user's favorite listings
const getFavorites: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Error fetching favorites' });
  }
};

// Permanent delete listing
const permanentDeleteListing: RequestHandler = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = (req as any).user.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'Нет прав для удаления этого объявления' });
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
  } catch (error) {
    console.error('Error permanently deleting listing:', error);
    res.status(500).json({ error: 'Ошибка при удалении объявления' });
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