import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PURPOSES = [
    { code: 'friendly', name: 'Дружеский вечер', icon: '🍻' },
    { code: 'romantic', name: 'Романтика', icon: '❤️' },
    { code: 'horror', name: 'Ужастики', icon: '👻' },
    { code: 'family', name: 'Семейный вечер', icon: '👨‍👩‍👧‍👦' },
    { code: 'solo', name: 'Для себя', icon: '🧘' },
    { code: 'educational', name: 'Обучение', icon: '📚' },
    { code: 'true_story', name: 'Реальные события', icon: '🎬' },
];

// Компонент крутящегося спиннера
const Spinner = () => (
  <span style={{ 
    display: 'inline-block', width: '16px', height: '16px', 
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', 
    borderRadius: '50%', animation: 'spin 1s linear infinite' 
  }}></span>
);

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPurpose, setNewRoomPurpose] = useState('friendly');
  const [isCreating, setIsCreating] = useState(false); // Лоудер для создания
  
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false); // Лоудер для присоединения
  
  const navigate = useNavigate();

  // Функция загрузки комнат (С ИСПОЛЬЗОВАНИЕМ my_rooms)
  const fetchRooms = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:8000/api/rooms/my_rooms/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401) throw new Error('Требуется повторный вход');
      return res.json();
    })
    .then(data => {
      const roomList = Array.isArray(data) ? data : data.results || [];
      setRooms(roomList);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Создание комнаты
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setIsCreating(true); // Включаем лоудер

    const token = localStorage.getItem('access_token');

    fetch('http://localhost:8000/api/rooms/create/', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        code: newRoomName,
        purpose: newRoomPurpose
      }) 
    })
    .then(res => {
      if (res.ok) {
        setNewRoomName('');
        fetchRooms();
      } else {
        return res.json().then(err => { 
          alert(`Ошибка: ${err.error || 'Не удалось создать'}`); 
        });
      }
    })
    .catch(() => alert('Ошибка сети'))
    .finally(() => setIsCreating(false)); // Выключаем лоудер в любом случае
  };

  // Присоединение к комнате
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true); // Включаем лоудер

    const token = localStorage.getItem('access_token');

    fetch('http://localhost:8000/api/rooms/join/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ invite_code: joinCode })
    })
    .then(res => {
      if (res.ok) {
        setJoinCode('');
        alert('Вы успешно присоединились!');
        fetchRooms();
      } else {
        return res.json().then(err => { throw new Error(err.error || 'Неверный код') });
      }
    })
    .catch(err => alert(err.message))
    .finally(() => setIsJoining(false)); // Выключаем лоудер
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>Загрузка комнат...</div>;
  if (error) return <div style={{ color: '#e50914', textAlign: 'center', marginTop: '50px' }}>Ошибка: {error}</div>;

  return (
    <div className="catalog-container">
      {/* CSS для анимации спиннера */}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      
      <h2>Комнаты для совместного просмотра</h2>
      
      {/* Форма создания комнаты */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25', marginBottom: '30px' }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Создать новую комнату</h3>
        <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <input 
            type="text" 
            placeholder="Название комнаты (например: Вечер с друзьями)" 
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }}
          />

          <div>
            <p style={{ color: '#aaa', marginBottom: '8px', fontSize: '14px' }}>Выберите цель вечера:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PURPOSES.map(p => (
                    <button
                        key={p.code}
                        type="button"
                        onClick={() => setNewRoomPurpose(p.code)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: newRoomPurpose === p.code ? '2px solid #e50914' : '1px solid #444',
                            background: newRoomPurpose === p.code ? '#e50914' : '#222',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        {p.icon} {p.name}
                    </button>
                ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isCreating} // Блокируем кнопку во время загрузки
            style={{ 
              padding: '12px', 
              background: isCreating ? '#555' : '#e50914', // Меняем цвет
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: isCreating ? 'not-allowed' : 'pointer', // Меняем курсор
              fontWeight: 'bold', 
              fontSize: '16px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {isCreating ? <><Spinner /> Создаем...</> : 'Создать комнату'}
          </button>
        </form>
      </div>

      {/* Форма присоединения */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25', marginBottom: '30px' }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Присоединиться к комнате</h3>
        <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Введите код приглашения" 
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }}
          />
          <button 
            type="submit" 
            disabled={isJoining}
            style={{ 
              padding: '10px 20px', 
              background: isJoining ? '#555' : '#8fbf9f', 
              color: isJoining ? '#fff' : '#0d1411', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: isJoining ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isJoining ? <><Spinner /> Вход...</> : 'Войти'}
          </button>
        </form>
      </div>

      {/* Список комнат */}
      {rooms.length === 0 ? (
        <p style={{ color: '#a0a0a0' }}>Пока нет ни одной комнаты. Создайте первую!</p>
      ) : (
        <div className="movie-grid">
          {rooms.map(room => (
            <div 
              key={room.id} 
              className="movie-card" 
              onClick={() => navigate(`/room/${room.id}`)} 
              style={{ cursor: 'pointer' }}
            >
              <div className="movie-info">
                <h3>{room.code || `Комната #${room.id}`}</h3>
                <p>Создатель: {room.creator || 'Вы'}</p>
                <p className="genres">Участников: {room.member_count || 0}</p>
                
                <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const code = room.invite_link.split('=')[1];
                      navigator.clipboard.writeText(code);
                      alert(`Код комнаты: ${code}\nСкопирован в буфер обмена!`);
                    }}
                    style={{ flex: 1, padding: '8px', background: '#8fbf9f', color: '#0d1411', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    📋 Копировать код
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(room.invite_link);
                      alert('Ссылка скопирована! Отправьте её другу.');
                    }}
                    style={{ flex: 1, padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🔗 Ссылка
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomsPage;