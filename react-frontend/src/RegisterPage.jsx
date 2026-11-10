import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    fetch('http://localhost:8000/api/users/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        alert('Регистрация успешна! Теперь вы можете войти.');
        navigate('/login'); // Перенаправляем на страницу входа
      } else {
        setError(data.error || 'Ошибка при регистрации');
      }
    })
    .catch(() => setError('Ошибка сети. Проверьте соединение.'))
    .finally(() => setIsLoading(false));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'white' }}>
      <div style={{ background: '#14201c', padding: '40px', borderRadius: '12px', border: '1px solid #1c2b25', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Регистрация в CineMatch</h2>
        
        {error && <div style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Логин</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#0d1411', color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ padding: '12px', background: isLoading ? '#555' : '#e50914', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
          Уже есть аккаунт? <Link to="/login" style={{ color: '#e50914', textDecoration: 'none' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;