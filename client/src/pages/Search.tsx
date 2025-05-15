import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../services/carsApi';
import { carBrandsApi, CarModel, CarMark } from '../services/carBrandsApi';
import CitySelect from '../components/CitySelect';
import axios from 'axios';
import type { Listing } from '../types/api';

interface ListingFilters {
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  location?: string;
}

interface CarModelWithYears {
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
  models: CarModelWithYears[];
}

interface SelectOption {
  value: string;
  label: string;
}

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ListingFilters>({});
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<CarModelWithYears | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const brandInputRef = useRef<HTMLDivElement>(null);
  const modelInputRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Получаем список всех марок
  const { data: carMarks } = useQuery({
    queryKey: ['carMarks'],
    queryFn: carBrandsApi.getMarks
  });

  // Получаем данные о моделях с годами производства
  const { data: carModelsData } = useQuery({
    queryKey: ['carModels'],
    queryFn: async () => {
      const response = await axios.get<CarBrand[]>('http://localhost:5000/api/cars/models');
      return response.data;
    }
  });

  // Инициализация фильтров из URL параметров
  useEffect(() => {
    const brandFromUrl = searchParams.get('brand');
    if (brandFromUrl) {
      const selectedMark = carMarks?.find(mark => mark.id === brandFromUrl);
      if (selectedMark) {
        setBrandSearch(selectedMark.name);
        setSelectedBrand(brandFromUrl);
        setFilters(prev => ({ ...prev, brand: brandFromUrl }));
      }
    }
  }, [searchParams, carMarks]);

  // Получаем объявления с фильтрами
  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => carsApi.getListings(filters),
  });

  // Обработчик клика вне полей ввода
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandInputRef.current && !brandInputRef.current.contains(event.target as Node)) {
        setShowBrandSuggestions(false);
      }
      if (modelInputRef.current && !modelInputRef.current.contains(event.target as Node)) {
        setShowModelSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация марок по поиску
  const filteredBrands = carMarks?.filter(mark => 
    mark.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    mark["cyrillic-name"].toLowerCase().includes(brandSearch.toLowerCase())
  ) || [];

  // Фильтрация моделей по поиску
  const filteredModels = selectedBrand && carModelsData
    ? carModelsData
        .find(b => b.id === selectedBrand)
        ?.models.filter(model =>
          model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
          model["cyrillic-name"].toLowerCase().includes(modelSearch.toLowerCase())
        ) || []
    : [];

  const handleBrandChange = (brandId: string) => {
    const selectedMark = carMarks?.find(mark => mark.id === brandId);
    setBrandSearch(selectedMark?.name || '');
    setSelectedBrand(brandId);
    setSelectedModel(null);
    setModelSearch('');
    setFilters(prev => ({
      ...prev,
      brand: brandId,
      model: undefined,
      minYear: undefined,
      maxYear: undefined
    }));
  };

  const handleModelChange = (modelId: string) => {
    if (selectedBrand && carModelsData) {
      const brand = carModelsData.find(b => b.id === selectedBrand);
      if (brand) {
        const model = brand.models.find(m => m.id === modelId);
        setModelSearch(model?.name || '');
        setSelectedModel(model || null);
        setFilters(prev => ({
          ...prev,
          model: modelId,
          minYear: model?.['year-from'],
          maxYear: model?.['year-to'] || new Date().getFullYear()
        }));
      }
    }
  };

  const handleFilterChange = (name: keyof ListingFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Марка</label>
            <div className="relative" ref={brandInputRef}>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Поиск марки..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                onFocus={() => setShowBrandSuggestions(true)}
              />
              {showBrandSuggestions && filteredBrands.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredBrands.map((mark: CarMark) => (
                    <div
                      key={mark.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleBrandChange(mark.id);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
            <div className="relative" ref={modelInputRef}>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder={selectedBrand ? "Поиск модели..." : "Сначала выберите марку"}
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                onFocus={() => selectedBrand && setShowModelSuggestions(true)}
                disabled={!selectedBrand}
              />
              {showModelSuggestions && selectedBrand && filteredModels.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Год выпуска</label>
            <div className="flex gap-2">
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.minYear || ''}
                onChange={(e) => handleFilterChange('minYear', e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedModel}
              >
                <option value="">От</option>
                {selectedModel && Array.from(
                  { length: (selectedModel['year-to'] || new Date().getFullYear()) - selectedModel['year-from'] + 1 },
                  (_, i) => selectedModel['year-from'] + i
                ).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={filters.maxYear || ''}
                onChange={(e) => handleFilterChange('maxYear', e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedModel}
              >
                <option value="">До</option>
                {selectedModel && Array.from(
                  { length: (selectedModel['year-to'] || new Date().getFullYear()) - selectedModel['year-from'] + 1 },
                  (_, i) => selectedModel['year-from'] + i
                ).reverse().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
            <CitySelect
              value={filters.location || ''}
              onChange={(city) => handleFilterChange('location', city)}
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((listing: Listing) => (
            <div 
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="text-base font-semibold truncate">
                  {listing.title}
                </h3>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {listing.price.toLocaleString()} ₽
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {listing.year} год • {listing.mileage.toLocaleString()} км
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {listing.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No listings found</p>
        </div>
      )}
    </div>
  );
};

export default Search;