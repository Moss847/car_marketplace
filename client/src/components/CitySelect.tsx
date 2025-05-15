import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import dadataApi, { CitySuggestion } from '../services/dadataApi';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
}

const CitySelect: React.FC<CitySelectProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [search, setSearch] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const { data: suggestions = [], isLoading } = useQuery<CitySuggestion[]>({
    queryKey: ['citySuggestions', search],
    queryFn: () => dadataApi.getCitySuggestions(search),
    enabled: search.length >= 2
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (suggestion: CitySuggestion) => {
    const cityName = `${suggestion.city_type} ${suggestion.city}`;
    setSearch(cityName);
    onChange(cityName);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full border border-gray-300 rounded-md px-3 py-2"
        placeholder="Введите город..."
        value={search}
        onChange={(e) => {
          const newValue = e.target.value;
          setSearch(newValue);
          if (newValue.length >= 2) {
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        }}
        onFocus={() => {
          if (search.length >= 2) {
            setShowSuggestions(true);
          }
        }}
        required={required}
      />
      {showSuggestions && search.length >= 2 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-gray-500">Загрузка...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion: CitySuggestion) => (
              <div
                key={suggestion.kladr_id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCitySelect(suggestion)}
              >
                {suggestion.city_type} {suggestion.city}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">Город не найден</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySelect; 