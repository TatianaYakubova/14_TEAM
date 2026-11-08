import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './HomePage';
import CatalogPage from './CatalogPage';
import MoviePage from './MoviePage';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';
import RoomsPage from './RoomsPage';
import RoomDetailPage from './RoomDetailPage'; // <--- Импорт страницы комнаты

function App() {
  return (
    <div>
      <header className="main-header">
        <h1 onClick={() => window.location.href = '/'}>🎬 CineMatch</h1>
        <nav>
          <a href="/">Главная</a>
          <a href="/catalog">Каталог</a>
          <a href="/rooms">Комнаты</a>
          <a href="/profile">Профиль</a>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/movie/:id" element={<MoviePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        
        {/* ВОТ ЭТА СТРОКА ОТВЕЧАЕТ ЗА КОМНАТУ */}
        <Route path="/room/:id" element={<RoomDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;