import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoomMembers from './RoomMembers';

function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Загружаем данные самой комнаты (название)
    // Так как API для получения одной комнаты нет, мы просто запросим список и найдем нужную
    fetch('http://localhost:8000/api/rooms/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const roomList = Array.isArray(data) ? data : data.results || [];
      const foundRoom = roomList.find(r => r.id === parseInt(id));
      setRoom(foundRoom);
      setLoading(false); 
    });
  }, [id, navigate]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Загрузка комнаты...</div>;
  if (!room) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Комната не найдена</div>;

  return (
    <div className="catalog-container" style={{ maxWidth: '900px' }}>
      <button 
        onClick={() => navigate('/rooms')} 
        style={{ marginBottom: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        ← Назад к комнатам
      </button>

      <h1 style={{ color: 'white', marginBottom: '10px' }}>Комната: {room.code}</h1>
      
      {/* Блок Участников (использует наш новый компонент) */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25', marginBottom: '30px' }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Участники</h3>
        <RoomMembers roomId={id} />
      </div>

      {/* Блок Голосования */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25' }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Голосование</h3>
        <p style={{ color: '#a0a0a0' }}>Здесь будет список фильмов для голосования.</p>
      </div>
    </div>
  );
}

export default RoomDetailPage;