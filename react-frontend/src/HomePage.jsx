import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">CINEMATCH — СОВМЕСТНЫЙ ПОДБОР</span>
          <h1>Что посмотреть? Подберите фильм по настроению или вкусу</h1>
          <p>Ищите по жанру, году, или опишите, что хочется посмотреть. А если оцените несколько фильмов, CineMatch изучит ваш вкус и сделает рекомендации персональными.</p>
        </div>
      </div>

      <div className="features-section">
        <h2>Как подобрать фильм</h2>
        <p className="subtitle">Выберите тот путь, который подходит именно сейчас.</p>
        
        <div className="features-grid">
          {/* Карточка 1: Каталог */}
          <div className="feature-card" onClick={() => navigate('/catalog')}>
            <div className="icon">🎬</div>
            <h3>Каталог фильмов</h3>
            <p>Просмотрите все фильмы в нашей базе и найдите что-то интересное.</p>
          </div>

          {/* Карточка 2: Комнаты */}
          <div className="feature-card" onClick={() => navigate('/rooms')}>
            <div className="icon">🍿</div>
            <h3>Комнаты</h3>
            <p>Создайте комнату для совместного просмотра и голосуйте за фильмы вместе с друзьями.</p>
          </div>

          {/* Карточка 3: Профиль */}
          <div className="feature-card" onClick={() => navigate('/profile')}>
            <div className="icon">👤</div>
            <h3>Мой профиль</h3>
            <p>Выберите любимые жанры, посмотрите свою подборку и оставьте отзывы.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage; // <--- ВОТ ЭТА СТРОКА БЫЛА ПРОПУЩЕНА