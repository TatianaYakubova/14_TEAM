import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [genres, setGenres] = useState([]);

  const availableGenres = ['Драма', 'Комедия', 'Боевик', 'Фантастика', 'Ужасы', 'Триллер', 'Романтика'];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setIsAuthenticated(true);

    // Загружаем данные профиля при входе
    fetch('http://localhost:8000/api/users/profile/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setAge(data.age || '');
      setGenres(data.genres || []);
    });
  }, [navigate]);

  const handleGenreToggle = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter(g => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    fetch('http://localhost:8000/api/users/profile/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        age: age,
        genres: genres
      })
    })
    .then(res => {
      if (res.ok) alert('Профиль успешно сохранен!');
      else alert('Ошибка сохранения');
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="catalog-container" style={{ maxWidth: '800px' }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Мой профиль</h1>
      
      <form onSubmit={handleSaveProfile} style={{ background: '#14201c', padding: '30px', borderRadius: '16px', border: '1px solid #1c2b25' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px' }}>Имя</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px' }}>Фамилия</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px' }}>Возраст</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }} />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '10px' }}>Интересующие жанры</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableGenres.map(genre => (
              <button key={genre} type="button" onClick={() => handleGenreToggle(genre)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: genres.includes(genre) ? '#8fbf9f' : '#333', color: genres.includes(genre) ? '#0d1411' : '#fff', fontWeight: 'bold' }}>
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button type="submit" style={{ padding: '12px 24px', background: '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Сохранить профиль</button>
          <button type="button" onClick={handleLogout} style={{ padding: '12px 24px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Выйти</button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;