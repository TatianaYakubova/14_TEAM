import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CatalogPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/movies/')
      .then(res => res.json())
      .then(data => {
        const movieList = Array.isArray(data) ? data : data.results;
        setMovies(movieList || []);
        setLoading(false);
      });
  }, []);

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
    </div>
  );
}

export default CatalogPage;