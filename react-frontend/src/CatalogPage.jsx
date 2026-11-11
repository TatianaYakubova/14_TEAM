import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CatalogPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // Текущая страница
  const [totalPages, setTotalPages] = useState(1); // Всего страниц
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Добавляем параметр ?page= в запрос
    fetch(`http://localhost:8000/api/v1/movies/?page=${page}`)
      .then(res => res.json())
      .then(data => {
        // Если бэкенд вернул пагинированный ответ (с полем results)
        if (data.results) {
          setMovies(data.results);
          // Считаем общее количество страниц (всего фильмов / 20 на страницу)
          setTotalPages(Math.ceil(data.count / 20));
        } else {
          // Если пагинация вдруг отключена (массив)
          setMovies(data);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]); // Эффект срабатывает при смене страницы

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Загрузка фильмов...</div>;

  return (
    <div className="catalog-container">
      <h2 style={{ color: 'white', marginBottom: '20px' }}>Каталог фильмов</h2>
      
      <div className="movie-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)}>
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>{movie.release_year}</p>
              <p className="genres">{Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}</p>
            </div>
          </div>
        ))}
      </div>

      {/* БЛОК ПАГИНАЦИИ */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', marginBottom: '20px' }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          style={{ 
            padding: '10px 20px', 
            background: page === 1 ? '#444' : '#e50914', 
            color: page === 1 ? '#888' : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          ← Назад
        </button>
        
        <span style={{ color: 'white', fontSize: '16px' }}>
          Страница <strong>{page}</strong> из {totalPages}
        </span>
        
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
          disabled={page >= totalPages}
          style={{ 
            padding: '10px 20px', 
            background: page >= totalPages ? '#444' : '#e50914', 
            color: page >= totalPages ? '#888' : 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}

export default CatalogPage;