import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { carBrandsApi, CarMark } from '../services/carBrandsApi';
import axios from 'axios';

interface CarSelectProps {
  selectedMarkId: string;
  selectedModelId: string;
  onMarkChange: (markId: string) => void;
  onModelChange: (modelId: string) => void;
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

const CarSelect: React.FC<CarSelectProps> = ({
  selectedMarkId,
  selectedModelId,
  onMarkChange,
  onModelChange,
}) => {
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

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

  // Фильтрация марок по поиску
  const filteredBrands = marksData?.filter(mark => 
    mark.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    mark["cyrillic-name"].toLowerCase().includes(brandSearch.toLowerCase())
  ) || [];

  // Фильтрация моделей по поиску
  const filteredModels = selectedMarkId && carModelsData
    ? carModelsData
        .find(b => b.id === selectedMarkId)
        ?.models.filter(model =>
          model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
          model["cyrillic-name"].toLowerCase().includes(modelSearch.toLowerCase())
        ) || []
    : [];

  const handleMarkChange = (markId: string) => {
    const selectedMark = marksData?.find(mark => mark.id === markId);
    setBrandSearch(selectedMark?.name || '');
    onMarkChange(markId);
  };

  const handleModelChange = (modelId: string) => {
    if (selectedMarkId && carModelsData) {
      const brand = carModelsData.find(b => b.id === selectedMarkId);
      if (brand) {
        const model = brand.models.find(m => m.id === modelId);
        setModelSearch(model?.name || '');
        onModelChange(modelId);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Марка автомобиля
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Поиск марки..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            onFocus={() => setShowBrandSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
          />
          <select
            className="hidden"
            value={selectedMarkId}
            onChange={(e) => handleMarkChange(e.target.value)}
          >
            <option value="">Выберите марку</option>
            {filteredBrands.map((mark: CarMark) => (
              <option key={mark.id} value={mark.id}>
                {mark.name} ({mark["cyrillic-name"]})
              </option>
            ))}
          </select>
          {showBrandSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredBrands.map((mark: CarMark) => (
                <div
                  key={mark.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setBrandSearch(mark.name);
                    handleMarkChange(mark.id);
                    setShowBrandSuggestions(false);
                  }}
                >
                  {mark.name} ({mark["cyrillic-name"]})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Модель автомобиля
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Поиск модели..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            onFocus={() => setShowModelSuggestions(true)}
            onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
            disabled={!selectedMarkId}
          />
          <select
            className="hidden"
            value={selectedModelId}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!selectedMarkId}
          >
            <option value="">Выберите модель</option>
            {filteredModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model["cyrillic-name"]})
              </option>
            ))}
          </select>
          {showModelSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setModelSearch(model.name);
                    handleModelChange(model.id);
                    setShowModelSuggestions(false);
                  }}
                >
                  {model.name} ({model["cyrillic-name"]})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarSelect;