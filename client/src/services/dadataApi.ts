import axios from 'axios';

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
const DADATA_API_KEY = '63dafc9ca1b8c8161f64dae0eb5a38807aeaef1e';

const dadataApi = {
  getCitySuggestions: async (query: string): Promise<CitySuggestion[]> => {
    try {
      const response = await axios.post(
        DADATA_API_URL,
        {
          query,
          locations: [{ country: 'Россия' }],
          locations_boost: [{ country: 'Россия' }],
          from_bound: { value: 'city' },
          to_bound: { value: 'city' },
          restrict_value: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${DADATA_API_KEY}`
          }
        }
      );

      return response.data.suggestions.map((suggestion: any) => ({
        value: suggestion.value,
        city: suggestion.data.city,
        city_type: suggestion.data.city_type,
        kladr_id: suggestion.data.kladr_id
      }));
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    }
  }
};

export interface CitySuggestion {
  value: string;
  city: string;
  city_type: string;
  kladr_id: string;
}

export default dadataApi; 