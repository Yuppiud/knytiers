import React, { useState, useEffect } from 'react';
import { DndContext, rectIntersection, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db, auth, provider } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';

const TierList = () => {
  const [tiers, setTiers] = useState({ 'S+': [], S: [], 'A+': [], A: [], 'B+': [], B: [], C: [] });
  const [user, setUser] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newTier, setNewTier] = useState('S+');
  const [deleteId, setDeleteId] = useState('');

  useEffect(() => {
    async function loadData() {
      const snap = await getDoc(doc(db, 'tierlists', 'default'));
      if (snap.exists()) {
        setTiers(snap.data().tiers);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const save = setTimeout(() => {
      setDoc(doc(db, 'tierlists', 'default'), { tiers });
    }, 1000);
    return () => clearTimeout(save);
  }, [tiers]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e) {
      alert('Ошибка входа: ' + e.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAdd = () => {
    if (!newName || !newAvatar) return;
    const newUser = { id: Date.now().toString(), name: newName, avatar: newAvatar };
    setTiers((prev) => ({ ...prev, [newTier]: [...prev[newTier], newUser] }));
    setNewName(''); setNewAvatar(''); setNewTier('S+');
  };

  const handleDelete = () => {
    const updated = {};
    for (let tier in tiers) {
      updated[tier] = tiers[tier].filter((u) => u.id !== deleteId);
    }
    setTiers(updated);
    setDeleteId('');
  };

  const handleDragEnd = (event) => {
    if (!user) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceTier = Object.keys(tiers).find((tier) =>
      tiers[tier].some((u) => u.id === active.id)
    );
    const isOverTier = tiers.hasOwnProperty(over.id);

    if (isOverTier) {
      const user = tiers[sourceTier].find((u) => u.id === active.id);
      if (!user || sourceTier === over.id) return;

      setTiers((prev) => ({
        ...prev,
        [sourceTier]: prev[sourceTier].filter((u) => u.id !== active.id),
        [over.id]: [...prev[over.id], user],
      }));
      return;
    }

    const targetTier = Object.keys(tiers).find((tier) =>
      tiers[tier].some((u) => u.id === over.id)
    );
    if (!sourceTier || !targetTier) return;

    const sourceList = [...tiers[sourceTier]];
    const targetList = [...tiers[targetTier]];
    const movedUser = sourceList.find((u) => u.id === active.id);

    if (sourceTier === targetTier) {
      const oldIndex = sourceList.findIndex((u) => u.id === active.id);
      const newIndex = targetList.findIndex((u) => u.id === over.id);
      const reordered = arrayMove(sourceList, oldIndex, newIndex);
      setTiers((prev) => ({ ...prev, [sourceTier]: reordered }));
    } else {
      const newTargetIndex = targetList.findIndex((u) => u.id === over.id);
      setTiers((prev) => ({
        ...prev,
        [sourceTier]: sourceList.filter((u) => u.id !== active.id),
        [targetTier]: [
          ...targetList.slice(0, newTargetIndex),
          movedUser,
          ...targetList.slice(newTargetIndex),
        ],
      }));
    }
  };

  const allUsers = Object.values(tiers).flat();

  return (
    <div style={{ padding: 20, background: '#111', color: '#fff', minHeight: '100vh' }}>
      {/* Авторизация */}
      <div style={{ marginBottom: 20 }}>
        {user ? (
          <div>
            Привет, {user.displayName}
            <button onClick={handleLogout} style={{ marginLeft: 10 }}>Выйти</button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              padding: '10px 16px',
              fontSize: 16,
              borderRadius: 6,
              background: '#4285F4',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Войти через Google
          </button>
        )}
      </div>

      {/* Управление — только если вошёл */}
      {user && (
        <div style={{ background: '#222', padding: 20, borderRadius: 10, marginBottom: 20 }}>
          <h3>➕ Добавить</h3>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя" />
          <input value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} placeholder="URL" />
          <select value={newTier} onChange={(e) => setNewTier(e.target.value)}>
            {Object.keys(tiers).map((t) => <option key={t}>{t}</option>)}
          </select>
          <button onClick={handleAdd}>Добавить</button>

          <h3>🗑 Удалить</h3>
          <select value={deleteId} onChange={(e) => setDeleteId(e.target.value)}>
            <option value="">Выбери участника</option>
            {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={handleDelete}>Удалить</button>
        </div>
      )}

      {/* Доска */}
      <DndContext
        collisionDetection={rectIntersection}
        onDragEnd={user ? handleDragEnd : undefined}
      >
        <SortableContext items={allUsers.map((u) => u.id)} strategy={rectSortingStrategy}>
          {Object.keys(tiers).map((tier) => (
            <div key={tier} style={{ marginBottom: 20 }}>
              <div style={{
                width: 130, background: '#444', color: '#fff', padding: 10,
                fontWeight: 'bold', fontSize: 22, borderRadius: 10
              }}>{tier}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                {tiers[tier].map((u) => (
                  <div key={u.id} style={{
                    width: 130, height: 130, background: '#333', borderRadius: 10,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    position: 'relative'
                  }}>
                    <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.7)',
                      color: '#fff', textAlign: 'center', padding: '4px', fontSize: 14
                    }}>{u.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TierList;
