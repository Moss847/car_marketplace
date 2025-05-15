import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import { setCredentials, logout } from '../store/slices/authSlice';
import type { RootState } from '../store';
import type { LoginCredentials, RegisterCredentials } from '../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => auth.login(credentials),
    onSuccess: (response) => {
      dispatch(setCredentials(response.data));
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => auth.register(credentials),
    onSuccess: (response) => {
      dispatch(setCredentials(response.data));
      navigate('/');
    },
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: handleLogout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  };
}; 