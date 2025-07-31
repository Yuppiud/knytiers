import React from 'react';
import TierList from './TierList';
// Убрал импорт AvatarUploader

export default function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>🔥 KNYTIERS Tier List</h1>

      {/* Удалил блок с AvatarUploader */}

      <TierList />
    </div>
  );
}
