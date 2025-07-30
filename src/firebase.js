// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";  // <- добавляем импорт

// Твоя конфигурация проекта
const firebaseConfig = {
  apiKey: "AIzaSyCphH8dgBYpShmMi4FqDW9RU30a2EGxNAI",
  authDomain: "knytierlist.firebaseapp.com",
  projectId: "knytierlist",
  storageBucket: "knytierlist.appspot.com",
  messagingSenderId: "874447979520",
  appId: "1:874447979520:web:146a1bbadd736bc75984e5"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт Firestore, Storage и Auth
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);  // <- экспортируем auth
