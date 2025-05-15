import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listings } from '../services/api';
import { carBrandsApi, CarMark } from '../services/carBrandsApi';
import CarSelect from '../components/CarSelect';
import CitySelect from '../components/CitySelect';
import axios from 'axios';

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  color: string;
  location: string;
  images: (string | File)[];
}

interface CarModel {
  id: string;
  name: string;
  'cyrillic-name': string;
  class: string;
  'year-from': number;
  'year-to': number | null;
}

interface CarBrand {
  id: string;
  name: string;
  'cyrillic-name': string;
  models: CarModel[];
}

const MAX_IMAGES = 5;

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    color: '',
    location: '',
    images: [],
  });
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);

  const { data: marksData } = useQuery({
    queryKey: ['carMarks'],
    queryFn: carBrandsApi.getMarks
  });

  const { data: carModelsData } = useQuery({
    queryKey: ['carModels'],
    queryFn: async () => {
      const response = await axios.get<CarBrand[]>('http://localhost:5000/api/cars/models');
      return response.data;
    }
  });

  // Автоматически генерируем title при изменении brand, year или mileage
  useEffect(() => {
    if (formData.brand && formData.year && formData.mileage) {
      const mark = marksData?.find((m: CarMark) => m.id === formData.brand);
      const formattedMileage = new Intl.NumberFormat('ru-RU').format(Number(formData.mileage.replace(/\./g, '')));
      setFormData(prev => ({
        ...prev,
        title: `${mark?.name || ''} ${formData.year} ${formattedMileage} км`
      }));
    }
  }, [formData.brand, formData.year, formData.mileage, marksData]);

  const createListingMutation = useMutation({
    mutationFn: (data: FormData) => listings.create(data).then(response => response.data),
    onSuccess: () => {
      navigate('/');
    },
    onError: (error: any) => {
      console.error('Error creating listing:', error);
      alert(error.response?.data?.error || 'Ошибка при создании объявления');
    }
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + (formData.images?.length || 0) > MAX_IMAGES) {
      alert(`Можно загрузить максимум ${MAX_IMAGES} фотографий`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...files]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const formatNumber = (value: string): string => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '');
    // Форматируем число с разделителями
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'price' | 'mileage'
  ) => {
    const { value } = e.target;
    const formattedValue = formatNumber(value);
    setFormData(prev => ({
        ...prev,
      [field]: formattedValue
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем обязательные поля
    if (!formData.brand || !formData.model) {
      alert('Пожалуйста, выберите марку и модель автомобиля');
      return;
    }

    if (!formData.images.length) {
      alert('Пожалуйста, загрузите хотя бы одно фото');
      return;
    }
    
    // Создаем FormData для отправки файлов
    const formDataToSend = new FormData();
    
    // Добавляем все поля формы
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'images') {
        // Удаляем точки из числовых значений перед отправкой
        if (key === 'price' || key === 'mileage') {
          formDataToSend.append(key, value.replace(/\./g, ''));
        } else {
        formDataToSend.append(key, value);
        }
      }
    });

    // Добавляем изображения
    formData.images.forEach((file) => {
      if (file instanceof File) {
        formDataToSend.append('images', file);
      }
      });

    try {
      await createListingMutation.mutateAsync(formDataToSend);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleMarkChange = (markId: string) => {
    setSelectedModel(null);
    setFormData(prev => ({
      ...prev,
      brand: markId,
      model: '',
      year: ''
    }));
  };

  const handleModelChange = (modelId: string) => {
    if (formData.brand && carModelsData) {
      const brand = carModelsData.find(b => b.id === formData.brand);
      if (brand) {
        const model = brand.models.find(m => m.id === modelId);
        setSelectedModel(model || null);
        setFormData(prev => ({
          ...prev,
          model: modelId,
          year: ''
        }));
      }
    }
  };

  if (!marksData) {
    return <div className="text-center">Загрузка марок автомобилей...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Создать объявление</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
        <CarSelect
          selectedMarkId={formData.brand}
          selectedModelId={formData.model}
          onMarkChange={handleMarkChange}
          onModelChange={handleModelChange}
        />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Год выпуска
              </label>
            <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
              disabled={!selectedModel}
            >
              <option value="">Выберите год</option>
              {selectedModel && Array.from(
                { length: (selectedModel['year-to'] || new Date().getFullYear()) - selectedModel['year-from'] + 1 },
                (_, i) => selectedModel['year-from'] + i
              ).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            </div>

            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
                Пробег (км)
              </label>
              <input
              type="text"
                id="mileage"
                name="mileage"
                value={formData.mileage}
              onChange={(e) => handleNumberChange(e, 'mileage')}
                required
              placeholder="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Цена (₽)
            </label>
            <input
            type="text"
              id="price"
              name="price"
              value={formData.price}
            onChange={(e) => handleNumberChange(e, 'price')}
              required
            placeholder="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700">
                Тип топлива
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className="input mt-1"
              >
                <option value="">Выберите тип топлива</option>
                <option value="Бензин">Бензин</option>
                <option value="Дизель">Дизель</option>
                <option value="Газ">Газ</option>
                <option value="Электро">Электро</option>
                <option value="Гибрид">Гибрид</option>
              </select>
            </div>

            <div>
              <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">
                Коробка передач
              </label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                required
                className="input mt-1"
              >
                <option value="">Выберите коробку передач</option>
                <option value="Механика">Механика</option>
                <option value="Автомат">Автомат</option>
                <option value="Робот">Робот</option>
                <option value="Вариатор">Вариатор</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                Цвет
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                className="input mt-1"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Местоположение
              </label>
              <CitySelect
                value={formData.location}
                onChange={(city) => setFormData(prev => ({ ...prev, location: city }))}
                required
              />
            </div>
          </div>

          <div>
          <label className="block text-sm font-medium text-gray-700">
            Фотографии (максимум {MAX_IMAGES})
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="images"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Загрузить фотографии</span>
            <input
                    id="images"
                    name="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
                    className="sr-only"
                    disabled={formData.images?.length === MAX_IMAGES}
                  />
                </label>
                <p className="pl-1">или перетащите их сюда</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF до 10MB
              </p>
            </div>
          </div>
          {formData.images && formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {formData.images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file as File)}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="input mt-1"
              placeholder="Опишите состояние автомобиля, комплектацию, историю обслуживания и другие важные детали"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            disabled={createListingMutation.isPending}
          >
            {createListingMutation.isPending ? 'Создание...' : 'Создать объявление'}
          </button>
        </form>
    </div>
  );
};

export default CreateListing; 