import React from 'react';
import './GamePage.css';

export default function LockedGameModal({ game, userLevel, onClose }) {
  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-box scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <span className="modal-icon">{game.icon}</span>
          <h2>{game.title}</h2>
        </div>

        <p className="modal-description">{game.description}</p>

        <div className="locked-info">
          <p>🔒 <strong>Locked</strong></p>
          <p>Unlocks at <strong>Level {game.unlockLevel}</strong></p>
          <p>Your current level: <strong>{userLevel}</strong></p>
        </div>
      </div>
    </div>
  );
}
