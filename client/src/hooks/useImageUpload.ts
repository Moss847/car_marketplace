import { useState } from 'react';

interface ImageUploadResult {
  images: string[];
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetImages: () => void;
  isLoading: boolean;
  error: string | null;
}

export const useImageUpload = (maxImages: number = 10): ImageUploadResult => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + images.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const imagePromises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            reject(new Error('Only image files are allowed'));
            return;
          }

          if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Image size should not exceed 5MB'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        });
      });

      const newImages = await Promise.all(imagePromises);
      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImages = () => {
    setImages([]);
    setError(null);
  };

  return {
    images,
    handleImageChange,
    resetImages,
    isLoading,
    error,
  };
}; 