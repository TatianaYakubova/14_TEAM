import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Компонент спиннера
const Spinner = () => (
  <span style={{ 
    display: 'inline-block', width: '16px', height: '16px', 
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', 
    borderRadius: '50%', animation: 'spin 1s linear infinite' 
  }}></span>
);

function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Состояния для отзыва
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // Состояния для оценки (1-10)
  const [userRating, setUserRating] = useState(null);
  const [isRating, setIsRating] = useState(false);

  // Загружаем данные фильма, отзывы и оценку пользователя
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    // 1. Загружаем фильм
    fetch(`http://localhost:8000/api/v1/movies/${id}/`)
      .then(res => res.json())
      .then(data => {
        setMovie(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Загружаем отзывы
    fetch(`http://localhost:8000/api/v1/reviews/?movie=${id}`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : data.results || []));

    // 3. Загружаем текущую оценку пользователя
    if (token) {
      fetch(`http://localhost:8000/api/history/ratings/list/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data[id]) {
          setUserRating(data[id]);
        }
      })
      .catch(() => console.log("Оценки не загрузились"));
    }
  }, [id]);

  // Отправка нового отзыва
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return; 
    
    setIsSubmitting(true); 
    const token = localStorage.getItem('access_token'); 

    fetch('http://localhost:8000/api/v1/reviews/', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ movie: id, text: text })
    })
    .then(async res => {
      if (res.ok) {
        setText('');
        fetch(`http://localhost:8000/api/v1/reviews/?movie=${id}`)
          .then(r => r.json())
          .then(d => setReviews(Array.isArray(d) ? d : d.results || []));
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Ошибка при отправке.');
      }
    })
    .catch(() => alert('Ошибка сети'))
    .finally(() => setIsSubmitting(false)); 
  };

  // Отправка оценки фильма (1-10)
  const handleRate = (ratingValue) => {
    const token = localStorage.getItem('access_token');
    if (!token) return alert('Войдите, чтобы оценивать фильмы!');
    
    setIsRating(true);
    
    fetch('http://localhost:8000/api/history/ratings/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ movie: id, rating: ratingValue })
    })
    .then(res => {
      if (res.ok) {
        setUserRating(ratingValue);
      } else {
        alert('Ошибка при сохранении оценки');
      }
    })
    .catch(() => alert('Ошибка сети при сохранении оценки'))
    .finally(() => setIsRating(false));
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;
  if (!movie) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Фильм не найден</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

      <button 
        onClick={() => navigate('/')} 
        style={{ marginBottom: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        ← Назад в каталог
      </button>
      
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'white' }}>
        {movie.title} 
        {movie.release_year && <span style={{ color: '#aaa', fontSize: '1.2rem' }}> ({movie.release_year})</span>}
      </h1>
      
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || 'Жанры не указаны'}
      </p>

      {/* БЛОК ОЦЕНКИ ФИЛЬМА (1-10) */}
      <div style={{ background: '#1f1f1f', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#f5c518' }}>
          {userRating ? `Ваша оценка: ${userRating}/10` : 'Оцените фильм (1-10):'}
        </h3>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', opacity: isRating ? 0.5 : 1 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              onClick={() => handleRate(num)}
              disabled={isRating}
              style={{
                width: '35px', height: '35px', borderRadius: '50%',
                border: 'none',
                background: userRating && userRating >= num ? '#e50914' : '#333',
                color: 'white', fontWeight: 'bold', cursor: isRating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <hr style={{ margin: '30px 0', borderColor: '#333' }} />

      <h2 style={{ color: 'white' }}>Оставить отзыв</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Напишите ваш отзыв..." 
          disabled={isSubmitting} 
          style={{ padding: '10px', height: '100px', borderRadius: '5px', background: '#222', color: '#fff', border: '1px solid #444', resize: 'vertical' }}
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            padding: '10px', 
            background: isSubmitting ? '#555' : '#e50914', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
            fontSize: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {isSubmitting ? <><Spinner /> Отправка...</> : 'Отправить'}
        </button>
      </form>

      <h2 style={{ color: 'white' }}>Отзывы ({reviews.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reviews.map(review => (
          <div key={review.id} style={{ background: '#1f1f1f', padding: '15px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: '#e50914', fontSize: '1.1rem' }}>
                {/* ВОТ ЗДЕСЬ ИЗМЕНЕНИЕ: user_name вместо user */}
                {review.user_name || 'Аноним'}
              </strong>
              <small style={{ color: '#666' }}>
                {new Date(review.created_at).toLocaleString()}
              </small>
            </div>
            <p style={{ margin: '0', color: 'white' }}>{review.text}</p>
          </div>
        ))}
        {reviews.length === 0 && <p style={{ color: '#aaa' }}>Пока нет отзывов. Будьте первым!</p>}
      </div>
    </div>
  );
}

export default MoviePage;