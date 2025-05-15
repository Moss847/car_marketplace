import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, RootState, AppDispatch } from './store';
import { fetchCurrentUser } from './store/slices/authSlice';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import CreateListing from './pages/CreateListing';
import ListingDetails from './pages/ListingDetails';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import Chat from './pages/Chat';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

// Компонент для инициализации состояния аутентификации
const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="/chat/:listingId" element={<Chat />} />
          {isAuthenticated && (
            <>
              <Route
                path="/create-listing"
                element={<CreateListing />}
              />
              <Route
                path="/profile"
                element={<Profile />}
              />
              <Route
                path="/messages"
                element={<Messages />}
              />
              <Route
                path="/favorites"
                element={<Favorites />}
              />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

const AppContent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
    </QueryClientProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;