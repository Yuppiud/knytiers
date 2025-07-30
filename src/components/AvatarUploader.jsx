// src/components/AvatarUploader.jsx
import React, { useState } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

const AvatarUploader = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const storageRef = ref(storage, `avatars/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'users'), {
        avatar: url,
        createdAt: new Date()
      });

      alert('Успешно загружено!');
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
      alert('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Загрузить аватар</h2>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {preview && <img src={preview} alt="preview" width={100} />}
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </div>
  );
};

export default AvatarUploader;
