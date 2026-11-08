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

function RoomRecommendations({ roomId }) {
    const [recommendations, setRecommendations] = useState([]);
    const [activePurpose, setActivePurpose] = useState('friendly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Функция для загрузки рекомендаций (с возможностью передать новую цель)
    const fetchRecommendations = async (purposeCode = null) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            
            // Если цель передана, отправляем POST (чтобы сменить цель в базе)
            // Если нет - отправляем GET (просто загрузить текущие)
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

    // Загружаем рекомендации при первом открытии страницы
    useEffect(() => {
        if (roomId) {
            fetchRecommendations();
        }
    }, [roomId]);

    // Обработчик клика по цели
    const handlePurposeClick = (code) => {
        if (code !== activePurpose) {
            fetchRecommendations(code); // Перезагружаем фильмы с новой целью
        }
    };

    return (
        <div style={{ marginTop: '30px', color: 'white' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🎯 Цель вечера</h2>
            
            {/* Кнопки выбора цели */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
                {PURPOSES.map((p) => (
                    <button
                        key={p.code}
                        onClick={() => handlePurposeClick(p.code)}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '20px',
                            border: activePurpose === p.code ? '2px solid #e50914' : '1px solid #444',
                            background: activePurpose === p.code ? '#e50914' : '#222',
                            color: '#fff',
                            cursor: 'pointer',
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

            {/* Блок с рекомендациями */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🍿 Рекомендации для вас</h2>
            
            {loading && <p>Загрузка рекомендаций...</p>}
            {error && <p style={{ color: '#ff4444' }}>{error}</p>}
            
            {!loading && !error && recommendations.length === 0 && (
                <p style={{ color: '#aaa' }}>Пока нет рекомендаций. Попробуйте выбрать другую цель или добавьте участников.</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {recommendations.map((movie) => (
                    <div key={movie.id} style={{ background: '#1f1f1f', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{movie.title}</h3>
                        <p style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '0.9rem' }}>
                            {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#f5c518', fontWeight: 'bold' }}>⭐ {movie.imdb_rating || 'Нет'}</span>
                            <button style={{ padding: '5px 10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                В избранное
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoomRecommendations;