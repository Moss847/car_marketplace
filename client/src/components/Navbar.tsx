import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleLoginClick = () => {
    console.log('Login button clicked');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">АвтоМаркет</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/search" className="text-gray-600 hover:text-gray-900">
              Поиск
            </Link>
            <Link to="/favorites" className="text-gray-600 hover:text-gray-900">
              Избранное
            </Link>
            <Link to="/messages" className="text-gray-600 hover:text-gray-900">
              Сообщения
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/create-listing"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Создать объявление
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Профиль
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;