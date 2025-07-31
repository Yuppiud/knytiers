import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from './firebase';  // Импортируем Firebase
import TierList from './TierList';

const ADMIN_EMAIL = "slaxyt1on@gmail.com";  // Админский email, для редактирования

export default function App() {
  const [user, setUser] = useState(null);  // Состояние для текущего пользователя

  // Проверка состояния пользователя при монтировании компонента
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Функция для входа через Google
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      console.log('Пользователь вошел:', result.user.displayName);
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('Ошибка входа: ' + error.message);
    }
  };

  // Функция для выхода из аккаунта
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>🔥 KNYTIERS Tier List</h1>
      
      {/* Если пользователь авторизован, показываем возможность редактирования */}
      {user ? (
        <div style={{ textAlign: 'center' }}>
          <p>Вы вошли как: {user.displayName}</p>
          <button onClick={handleLogout}>Выйти</button>
          <TierList editable={user.email === ADMIN_EMAIL} /> {/* Только админ может редактировать */}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleLogin} style={{ padding: '10px 16px', fontSize: '16px', borderRadius: '6px', background: '#4285F4', color: '#fff' }}>
            Войти через Google
          </button>
          <TierList editable={false} /> {/* Без редактирования для неавторизованных */}
        </div>
      )}
    </div>
  );
}
