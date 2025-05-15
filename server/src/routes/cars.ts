import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// Get all car brands and models
router.get('/models', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://cars-base.ru/api/cars?full=1');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching car models:', error);
    res.status(500).json({ error: 'Error fetching car models' });
  }
});

export default router; 