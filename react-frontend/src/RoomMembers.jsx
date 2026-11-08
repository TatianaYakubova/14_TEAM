import { useEffect, useState } from 'react';

function RoomMembers({ roomId }) {
  const [membersData, setMembersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    fetch(`http://localhost:8000/api/rooms/${roomId}/members/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Не удалось загрузить участников');
      return res.json();
    })
    .then(data => {
      setMembersData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [roomId]);

  if (loading) return <p style={{ color: '#a0a0a0' }}>Загрузка участников...</p>;
  if (error) return <p style={{ color: '#e50914' }}>Ошибка: {error}</p>;
  if (!membersData) return null;

  // Вспомогательная функция для красивого вывода имени
  const getDisplayName = (person) => {
    if (person.first_name || person.last_name) {
      return `${person.first_name || ''} ${person.last_name || ''}`.trim();
    }
    return person.username; // Если имя не заполнено, показываем логин
  };

  return (
    <ul style={{ color: '#a0a0a0', listStyle: 'none', padding: 0, margin: 0 }}>
      {/* Создатель */}
      {membersData.creator && (
        <li style={{ marginBottom: '10px', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
          👑 {getDisplayName(membersData.creator)} 
          <span style={{ color: '#6a8a7a', fontSize: '12px', marginLeft: '5px' }}>(@{membersData.creator.username})</span>
        </li>
      )}
      
      {/* Участники */}
      {membersData.members && membersData.members.map(member => (
        <li key={member.id} style={{ marginBottom: '8px', fontSize: '15px' }}>
          👤 {getDisplayName(member)}
          <span style={{ color: '#6a8a7a', fontSize: '12px', marginLeft: '5px' }}>(@{member.username})</span>
        </li>
      ))}
      
      {/* Если участников нет */}
      {(!membersData.members || membersData.members.length === 0) && (
        <li style={{ marginBottom: '5px', color: '#6a8a7a', fontStyle: 'italic' }}>
          Других участников пока нет. Пригласите друзей!
        </li>
      )}
    </ul>
  );
}

export default RoomMembers;