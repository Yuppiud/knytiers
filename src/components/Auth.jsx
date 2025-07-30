// src/components/Auth.jsx
import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Auth = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Пользователь вошёл — это событие будет слушаться в App.jsx
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('Ошибка при входе');
    }
  };

  return (
    <button onClick={signInWithGoogle}>
      Войти через Google
    </button>
  );
};

export default Auth;
