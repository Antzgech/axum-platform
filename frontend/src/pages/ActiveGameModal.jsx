import React from 'react';
import './GamePage.css';

export default function ActiveGameModal({ game, onClose }) {
  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-box scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <span className="modal-icon">{game.icon}</span>
          <h2>{game.title}</h2>
        </div>

        <p className="modal-description">{game.description}</p>
        <p className="modal-reward">{game.reward}</p>

        <button className="play-btn big">Play Now</button>
      </div>
    </div>
  );
}
