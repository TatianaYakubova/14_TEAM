import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  // Загружаем данные фильма и отзывы
  useEffect(() => {
    // 1. Загружаем сам фильм
    fetch(`http://localhost:8000/api/v1/movies/${id}/`)
      .then(res => res.json())
      .then(data => {
        setMovie(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Загружаем отзывы для этого фильма
    fetch(`http://localhost:8000/api/v1/reviews/?movie=${id}`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : data.results || []));
  }, [id]);

  // Отправка нового отзыва
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Достаем токен из localStorage (проверь, как он у тебя называется: 'access_token', 'token' или 'access')
    const token = localStorage.getItem('access_token'); 

    fetch('http://localhost:8000/api/v1/reviews/', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          // Если токен есть, добавляем его в заголовок
          ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ movie: id, text: text })
    })
    .then(async res => {
      if (res.ok) {
        setText('');
        // Обновляем список отзывов
        fetch(`http://localhost:8000/api/v1/reviews/?movie=${id}`)
          .then(r => r.json())
          .then(d => setReviews(Array.isArray(d) ? d : d.results || []));
      } else {
        // Пытаемся прочитать ошибку от Django (например, "Вы уже оставили отзыв")
        const errorData = await res.json();
        if (errorData.error) {
            alert(errorData.error); // Показываем текст ошибки пользователю
        } else {
            alert('Ошибка при отправке. Проверьте, что Django запущен.');
        }
      }
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;
  if (!movie) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Фильм не найден</div>;

 return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ marginBottom: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        ← Назад в каталог
      </button>
      
      {/* Название фильма - делаем белым */}
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'white' }}>
        {movie.title} 
        {movie.release_year && <span style={{ color: '#aaa', fontSize: '1.2rem' }}> ({movie.release_year})</span>}
      </h1>
      
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || 'Жанры не указаны'}
      </p>

      <hr style={{ margin: '30px 0', borderColor: '#333' }} />

      {/* Заголовок формы - делаем белым */}
      <h2 style={{ color: 'white' }}>Оставить отзыв</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Напишите ваш отзыв..." 
          style={{ padding: '10px', height: '100px', borderRadius: '5px', background: '#222', color: '#fff', border: '1px solid #444', resize: 'vertical' }}
        />
        <button 
          type="submit" 
          style={{ padding: '10px', background: '#e50914', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          Отправить
        </button>
      </form>

      {/* Заголовок отзывов - делаем белым */}
      <h2 style={{ color: 'white' }}>Отзывы ({reviews.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reviews.map(review => (
  <div key={review.id} style={{ background: '#1f1f1f', padding: '15px', borderRadius: '5px' }}>
    
    {/* ДОБАВЛЯЕМ ИМЯ АВТОРА И ДАТУ */}
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <strong style={{ color: '#e50914', fontSize: '1.1rem' }}>
        {review.user || 'Аноним'}
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