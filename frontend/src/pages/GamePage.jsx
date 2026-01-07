import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './GamePage.css';
import ActiveGameModal from './ActiveGameModal';
import LockedGameModal from './LockedGameModal';

let GebetaGameComponent;
try {
  GebetaGameComponent = require('../games/GebetaGame').default;
} catch (e) {
  GebetaGameComponent = null;
}

export default function GamePage({ user }) {
  const [activeGame, setActiveGame] = useState(null);
  const [lockedGame, setLockedGame] = useState(null);
  const [showGebeta, setShowGebeta] = useState(false);

  const level = user?.current_level || 1;

  const games = [
    { id: 1, title: "Gebeta", icon: "🎲", description: "Traditional Ethiopian strategy game.", reward: "🪙 20 coins", unlockLevel: 1 },
    { id: 2, title: "Genna", icon: "🏑", description: "Traditional Ethiopian hockey-style game.", reward: "🪙 15 coins", unlockLevel: 2 },
    { id: 3, title: "Senterej", icon: "♟️", description: "Ethiopian chess variant.", reward: "🪙 25 coins", unlockLevel: 3 },
    { id: 4, title: "Gugs", icon: "🎯", description: "Traditional marble game.", reward: "🪙 10 coins", unlockLevel: 4 },
    { id: 5, title: "Shekla", icon: "🪨", description: "Stone toss accuracy game.", reward: "🪙 12 coins", unlockLevel: 4 },
    { id: 6, title: "Ayo", icon: "🔥", description: "Fast reaction challenge.", reward: "🪙 18 coins", unlockLevel: 5 },
    { id: 7, title: "Kelela", icon: "🏹", description: "Target-based skill game.", reward: "🪙 16 coins", unlockLevel: 5 },
    { id: 8, title: "Tibeb", icon: "📜", description: "Wisdom and riddle game.", reward: "🪙 22 coins", unlockLevel: 6 },
    { id: 9, title: "Feres", icon: "🐎", description: "Horse racing timing game.", reward: "🪙 19 coins", unlockLevel: 6 },
    { id: 10, title: "Dama", icon: "🧿", description: "Board strategy game.", reward: "🪙 21 coins", unlockLevel: 6 },
  ];

  const unlockedGames = games.filter(g => level >= g.unlockLevel);
  const lockedGames = games.filter(g => level < g.unlockLevel);

  const handleUnlockedClick = (game) => {
    if (game.id === 1 && GebetaGameComponent) {
      setShowGebeta(true);
    } else {
      setActiveGame(game);
    }
  };

  return (
    <div className="game-page">

      {/* Header */}
      <div className="game-header">
        <h1>🎮 Games</h1>
        <Link to="/" className="back-btn right">Back →</Link>
      </div>

      <p className="subtitle">Unlock more games as you level up!</p>

      {/* Unlocked Games */}
      <div className="unlocked-games">
        {unlockedGames.map(game => (
          <div
            key={game.id}
            className="game-row fade-in"
            onClick={() => handleUnlockedClick(game)}
          >
            <div className="game-row-left">
              <span className="game-icon">{game.icon}</span>
              <h2>{game.title}</h2>
            </div>
            <button className="play-btn small">Play</button>
          </div>
        ))}
      </div>

      {/* Locked Games */}
      {lockedGames.length > 0 && (
        <>
          <h3 className="locked-title">Locked Games</h3>
          <div className="locked-games-grid">
            {lockedGames.map(game => (
              <div
                key={game.id}
                className="locked-card fade-in"
                onClick={() => setLockedGame(game)}
              >
                <span className="game-icon">{game.icon}</span>
                <h3>{game.title}</h3>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active Game Modal */}
      {activeGame && activeGame.id !== 1 && (
        <ActiveGameModal game={activeGame} onClose={() => setActiveGame(null)} />
      )}

      {/* Locked Game Modal */}
      {lockedGame && (
        <LockedGameModal
          game={lockedGame}
          userLevel={level}
          onClose={() => setLockedGame(null)}
        />
      )}

      {/* Gebeta Game Modal */}
      {showGebeta && GebetaGameComponent && (
        <div className="gebeta-overlay" onClick={() => setShowGebeta(false)}>
          <div className="gebeta-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="gebeta-close" onClick={() => setShowGebeta(false)}>×</button>
            <GebetaGameComponent user={user} onClose={() => setShowGebeta(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
