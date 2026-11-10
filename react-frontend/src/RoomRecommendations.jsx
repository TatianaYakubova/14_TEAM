import React, { useState, useEffect } from 'react';

const PURPOSES = [
    { code: 'friendly', name: 'Дружеский вечер', icon: '🍻' },
    { code: 'romantic', name: 'Романтика', icon: '❤️' },
    { code: 'horror', name: 'Ужастики', icon: '👻' },
    { code: 'family', name: 'Семейный вечер', icon: '👨‍👩‍👧‍👦' },
    { code: 'solo', name: 'Для себя', icon: '🧘' },
    { code: 'educational', name: 'Обучение', icon: '📚' },
    { code: 'true_story', name: 'Реальные события', icon: '🎬' },
];

const Spinner = () => (
    <span style={{ 
      display: 'inline-block', width: '16px', height: '16px', 
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', 
      borderRadius: '50%', animation: 'spin 1s linear infinite' 
    }}></span>
);

function RoomRecommendations({ roomId }) {
    const [recommendations, setRecommendations] = useState([]);
    const [activePurpose, setActivePurpose] = useState('friendly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [votingId, setVotingId] = useState(null); // Лоудер для конкретного фильма

    const fetchRecommendations = async (purposeCode = null) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const method = purposeCode ? 'POST' : 'GET';
            const url = `http://localhost:8000/api/recommendations/room/${roomId}/`;
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            };

            if (purposeCode) {
                options.body = JSON.stringify({ purpose: purposeCode });
            }

            const res = await fetch(url, options);
            const data = await res.json();

            if (res.ok) {
                setRecommendations(data.recommendations || []);
                if (data.active_purpose) {
                    setActivePurpose(data.active_purpose);
                }
            } else {
                setError(data.error || 'Ошибка загрузки рекомендаций');
            }
        } catch (err) {
            setError('Ошибка сети. Проверьте подключение к серверу.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roomId) {
            fetchRecommendations();
        }
    }, [roomId]);

    const handlePurposeClick = (code) => {
        if (code !== activePurpose && !loading) {
            fetchRecommendations(code);
        }
    };

    // ФУНКЦИЯ ГОЛОСОВАНИЯ (1 - лайк, -1 - дизлайк)
    const handleVote = async (movieId, voteValue) => {
        setVotingId(movieId);
        const token = localStorage.getItem('access_token');
        
        try {
            const res = await fetch(`http://localhost:8000/api/rooms/${roomId}/vote/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ movie_id: movieId, vote: voteValue })
            });

            if (res.ok) {
                // Убираем фильм из списка сразу после голосования
                setRecommendations(prev => prev.filter(m => m.id !== movieId));
            } else {
                alert('Ошибка при голосовании');
            }
        } catch (err) {
            alert('Ошибка сети при голосовании');
        } finally {
            setVotingId(null);
        }
    };

    return (
        <div style={{ marginTop: '30px', color: 'white' }}>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🎯 Цель вечера</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
                {PURPOSES.map((p) => (
                    <button
                        key={p.code}
                        onClick={() => handlePurposeClick(p.code)}
                        disabled={loading}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '20px',
                            border: activePurpose === p.code ? '2px solid #e50914' : '1px solid #444',
                            background: activePurpose === p.code ? '#e50914' : '#222',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>{p.icon}</span>
                        {p.name}
                    </button>
                ))}
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🍿 Рекомендации для вас</h2>
            
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aaa', marginBottom: '15px' }}>
                    <Spinner /> Подбираем лучшие фильмы...
                </div>
            )}
            {error && <p style={{ color: '#ff4444' }}>{error}</p>}
            
            {!loading && !error && recommendations.length === 0 && (
                <p style={{ color: '#aaa' }}>Пока нет рекомендаций. Попробуйте выбрать другую цель или подождите, пока участники добавят свои предпочтения.</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {recommendations.map((movie) => (
                    <div key={movie.id} style={{ background: '#1f1f1f', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{movie.title}</h3>
                            <p style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '0.9rem' }}>
                                {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <span style={{ color: '#f5c518', fontWeight: 'bold' }}>⭐ {movie.imdb_rating || 'Нет'}</span>
                            
                            {/* КНОПКИ ГОЛОСОВАНИЯ */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => handleVote(movie.id, 1)}
                                    disabled={votingId === movie.id}
                                    style={{ padding: '8px 12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: votingId === movie.id ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                                    title="Нравится"
                                >
                                    {votingId === movie.id ? <Spinner /> : '👍'}
                                </button>
                                <button 
                                    onClick={() => handleVote(movie.id, -1)}
                                    disabled={votingId === movie.id}
                                    style={{ padding: '8px 12px', background: '#c62828', color: 'white', border: 'none', borderRadius: '5px', cursor: votingId === movie.id ? 'not-allowed' : 'pointer', fontSize: '16px' }}
                                    title="Не нравится"
                                >
                                    {votingId === movie.id ? <Spinner /> : '👎'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoomRecommendations;