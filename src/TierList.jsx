import React, { useState, useEffect } from 'react';
import { DndContext, rectIntersection, useDroppable } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { db, auth } from './firebase'; // добавил auth
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const initialData = {
  'S+': [],
  S: [],
  'A+': [],
  A: [],
  'B+': [],
  B: [],
  C: [],
};

const tierColors = {
  'S+': '#ff4d4d',
  S: '#ff944d',
  'A+': '#ffd966',
  A: '#d9ff66',
  'B+': '#66ff99',
  B: '#66b3ff',
  C: '#b366ff',
};

const tierOrder = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C'];

const allowedEmail = 'slaxyt1on@gmail.com'; // Разрешённый email

const SortableItem = ({ user }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: user.id });

  const isLong = user.name.length > 12;
  const fontSize = isLong ? 14 : 18;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: 130,
    height: 130,
    background: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} title={user.name}>
      <img
        src={user.avatar}
        alt={user.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 32,
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#fff',
          fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
        }}
      >
        {user.name}
      </div>
    </div>
  );
};

const DroppableTier = ({ id, children, isDisabled }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: isOver && !isDisabled ? '#333' : '#1e1e1e',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        flexWrap: 'wrap',
        gap: 10,
        minHeight: 150,
        height: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'background 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

export default function TierList() {
  const [tiers, setTiers] = useState(initialData);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newTier, setNewTier] = useState('S+');
  const [deleteId, setDeleteId] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, 'tierlists', 'default');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTiers(docSnap.data().tiers);
          console.log('Данные загружены из Firestore');
        } else {
          setTiers(initialData);
          await setDoc(docRef, { tiers: initialData });
          console.log('Создан новый документ с начальными данными');
        }
      } catch (error) {
        console.error('Ошибка загрузки из Firestore', error);
        setTiers(initialData);
      }
    }
    loadData();

    // Подписка на изменение авторизации
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(db, 'tierlists', 'default');
        await setDoc(docRef, { tiers });
        console.log('Данные сохранены в Firestore');
      } catch (error) {
        console.error('Ошибка сохранения в Firestore', error);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [tiers]);

  const handleDragEnd = (event) => {
    if (!user) return; // запрет на перетаскивание без авторизации

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceTier = Object.keys(tiers).find((tier) =>
      tiers[tier].some((u) => u.id === active.id)
    );

    const isOverTier = tiers.hasOwnProperty(over.id);

    if (isOverTier) {
      const userItem = tiers[sourceTier].find((u) => u.id === active.id);
      if (!userItem || sourceTier === over.id) return;

      setTiers((prev) => ({
        ...prev,
        [sourceTier]: prev[sourceTier].filter((u) => u.id !== active.id),
        [over.id]: [...prev[over.id], userItem],
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

  const handleAdd = () => {
    if (!user) return alert('Войдите через Google для редактирования');
    if (!newName || !newAvatar) return alert('Заполни имя и картинку');
    const newUser = {
      id: Date.now().toString(),
      name: newName,
      avatar: newAvatar,
    };
    setTiers((prev) => ({
      ...prev,
      [newTier]: [...prev[newTier], newUser],
    }));
    setNewName('');
    setNewAvatar('');
    setNewTier('S+');
  };

  const handleDelete = () => {
    if (!user) return alert('Войдите через Google для редактирования');
    if (!deleteId) return alert('Выбери участника для удаления');
    const updated = {};
    for (const [tier, users] of Object.entries(tiers)) {
      updated[tier] = users.filter((u) => u.id !== deleteId);
    }
    setTiers(updated);
    setDeleteId('');
  };

  const allUsers = Object.values(tiers).flat();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      if (loggedUser.email !== allowedEmail) {
        alert('Доступ разрешён только для определённого аккаунта');
        await signOut(auth);
        setUser(null);
        return;
      }

      setUser(loggedUser);
    } catch (error) {
      console.error('Ошибка входа:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: '#111',
        color: '#fff',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
      }}
    >
      <header
        style={{
          marginBottom: 20,
          background: '#222',
          padding: 20,
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>
          🔥 KNYTIERS Tier List
        </h1>
        {user ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              fontSize: 16,
              borderRadius: 6,
              background: '#444',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              padding: '10px 16px',
              fontSize: 16,
              borderRadius: 6,
              background: '#444',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Войти через Google
          </button>
        )}
      </header>

      {user && (
        <div
          style={{
            marginBottom: 20,
            background: '#222',
            padding: 20,
            borderRadius: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 40,
          }}
        >
          <div>
            <h3 style={{ marginBottom: 10 }}>➕ Добавить</h3>
            <input
              placeholder="Имя"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                padding: '10px 12px',
                fontSize: '16px',
                borderRadius: '6px',
                marginRight: 10,
              }}
            />
            <input
              placeholder="URL картинки"
              value={newAvatar}
              onChange={(e) => setNewAvatar(e.target.value)}
              style={{
                padding: '10px 12px',
                fontSize: '16px',
                borderRadius: '6px',
                marginRight: 10,
              }}
            />
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value)}
              style={{
                padding: '10px',
                fontSize: '16px',
                borderRadius: '6px',
                marginRight: 10,
              }}
            >
              {tierOrder.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                borderRadius: '6px',
                background: '#444',
                color: '#fff',
              }}
            >
              Добавить
            </button>
          </div>

          <div>
            <h3 style={{ marginBottom: 10 }}>🗑️ Удалить</h3>
            <select
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              style={{
                padding: '10px',
                fontSize: '16px',
                borderRadius: '6px',
                minWidth: 180,
                marginRight: 10,
              }}
            >
              <option value="">Выбери участника</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                borderRadius: '6px',
                background: '#444',
                color: '#fff',
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      <DndContext
        collisionDetection={rectIntersection}
        onDragEnd={handleDragEnd}
        // запрещаем drag, если нет авторизации
        sensors={user ? undefined : []}
      >
        <SortableContext items={allUsers.map((u) => u.id)} strategy={rectSortingStrategy}>
          {tierOrder.map((tier) => (
            <DroppableTier key={tier} id={tier} isDisabled={!user}>
              <div
                style={{
                  width: 130,
                  background: tierColors[tier],
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  textAlign: 'center',
                  padding: 10,
                  boxSizing: 'border-box',
                  alignSelf: 'stretch',
                }}
              >
                {tier}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  flex: 1,
                  alignItems: 'stretch',
                }}
              >
                {(tiers[tier] || []).map((userItem) => (
                  <SortableItem key={userItem.id} user={userItem} />
                ))}
              </div>
            </DroppableTier>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
