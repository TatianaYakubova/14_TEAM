import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import './App.css';
import HomePage from './HomePage';
import CatalogPage from './CatalogPage';
import MoviePage from './MoviePage';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';
import RoomsPage from './RoomsPage';
import RoomDetailPage from './RoomDetailPage';
import RegisterPage from './RegisterPage';

function App() {
  const navigate = useNavigate();
  
  // Проверяем, залогинен ли пользователь (есть ли токен)
  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleLogout = () => {
    // Удаляем токены
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Перекидываем на страницу логина
    navigate('/login');
  };

  return (
    <div>
      <header className="main-header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🎬 CineMatch</h1>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
          <Link to="/rooms">Комнаты</Link>
          <Link to="/profile">Профиль</Link>
          
          {/* Кнопка Выйти / Войти */}
          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              style={{ background: '#e50914', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            >
              Выйти
            </button>
          ) : (
            <Link 
              to="/login" 
              style={{ background: '#e50914', color: 'white', padding: '8px 15px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}
            >
              Войти
            </Link>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/movie/:id" element={<MoviePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/room/:id" element={<RoomDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;