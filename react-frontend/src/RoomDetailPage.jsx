import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoomMembers from './RoomMembers';
import RoomRecommendations from './RoomRecommendations';

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

    // ЗАПРАШИВАЕМ КОНКРЕТНУЮ КОМНАТУ ПО ID
    fetch(`http://localhost:8000/api/rooms/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Комната не найдена или нет доступа');
      return res.json();
    })
    .then(data => {
      setRoom(data);
      setLoading(false); 
    })
    .catch((err) => {
      console.error(err);
      setRoom(null);
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Загрузка комнаты...</div>;
  if (!room) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Комната не найдена или у вас нет к ней доступа</div>;

  return (
    <div className="catalog-container" style={{ maxWidth: '900px' }}>
      <button 
        onClick={() => navigate('/rooms')} 
        style={{ marginBottom: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        ← Назад к комнатам
      </button>

      <h1 style={{ color: 'white', marginBottom: '10px' }}>Комната: {room.code}</h1>
      
      {/* Блок Участников */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25', marginBottom: '30px' }}>
        <h3 style={{ color: 'white', marginBottom: '15px' }}>Участники</h3>
        <RoomMembers roomId={id} />
      </div>

      {/* Блок Рекомендаций (тут сработает запрос к recommendations/room/id/) */}
      <div style={{ background: '#14201c', padding: '20px', borderRadius: '12px', border: '1px solid #1c2b25' }}>
        <RoomRecommendations roomId={id} />
      </div>
    </div>
  );
}

export default RoomDetailPage;