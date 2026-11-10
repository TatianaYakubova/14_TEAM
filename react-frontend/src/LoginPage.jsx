import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- Объединили в одну строчку

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Отправляем запрос на получение токена
    fetch('http://localhost:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (!res.ok) throw new Error('Неверный логин или пароль');
      return res.json();
    })
    .then(data => {
      // Сохраняем токены в localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      // Перенаправляем в профиль или на главную
      navigate('/profile'); 
    })
    .catch(err => setError(err.message));
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', background: '#14201c', borderRadius: '16px', border: '1px solid #1c2b25' }}>
      <h2 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>Вход в CineMatch</h2>
      
      {error && <p style={{ color: '#e50914', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Имя пользователя" 
          value={username} 
          onChange={e => setUsername(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white' }}
        />
        <button type="submit" style={{ padding: '12px', background: '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          Войти
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
        Нет аккаунта? <Link to="/register" style={{ color: '#e50914', textDecoration: 'none' }}>Зарегистрироваться</Link>
      </p>
    </div>
  );
}

export default LoginPage;