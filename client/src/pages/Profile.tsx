import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { auth, listings } from '../services/api';
import { RootState, AppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { useListings } from '../hooks/useListings';
import { useNavigate } from 'react-router-dom';
import { normalizePhone } from '../utils/validation';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  brand: string;
  model: string;
  brandName: string;
  modelName: string;
  year: number;
  mileage: number;
  location: string;
  images: string[];
  deletedAt?: string | null;
}

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone ? normalizePhone(user.phone) : '',
      });
    }
  }, [user]);

  const { data: userListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['userListings'],
    queryFn: () => listings.getUserListings(),
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) => auth.updateProfile(data),
    onSuccess: (response) => {
      dispatch(updateUser(response.data.user));
      queryClient.invalidateQueries({ queryKey: ['userListings'] });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      if (/[^0-9]/.test(value)) {
        setPhoneError('Номер телефона может содержать только цифры');
      } else {
        setPhoneError(null);
      }
      const filteredValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: filteredValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: UpdateProfilePayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: normalizePhone(formData.phone),
    };
    updateProfileMutation.mutate(dataToSend);
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await listings.permanentDeleteListing(id);
        queryClient.invalidateQueries({ queryKey: ['userListings'] });
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Пожалуйста, войдите в систему, чтобы просмотреть свой профиль.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Профиль</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Имя
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input mt-1"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Фамилия
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input mt-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              readOnly
              className="input mt-1 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Номер телефона
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              className="input mt-1"
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="btn btn-primary w-full"
          >
            {updateProfileMutation.isPending ? 'Updating...' : 'Обновить данные'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Мои объявления</h2>
        {isLoadingListings ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка объявлений...</p>
          </div>
        ) : (
          userListings?.data && userListings.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userListings.data
                .filter((listing) => !listing.deletedAt)
                .map((listing) => (
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
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-semibold truncate">
                        {listing.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteListing(listing.id);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
            <p className="text-gray-600">Вы еще не создали ни одного объявления.</p>
          )
        )}
      </div>
    </div>
  );
};

export default Profile; 