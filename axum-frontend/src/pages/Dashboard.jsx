import React from 'react';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('axum_user') || 'null');

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard</h2>
        <p>No user found. Open the app inside Telegram to authenticate.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p><strong>Welcome:</strong> {user.first_name || user.username}</p>
      <p><strong>Telegram ID:</strong> {user.id || user.telegram_id}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Points:</strong> {user.points ?? 0}</p>
      <p><strong>Current level:</strong> {user.current_level ?? 1}</p>
    </div>
  );
}
