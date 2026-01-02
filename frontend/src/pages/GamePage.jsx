// src/pages/GamePage.jsx
// COMPLETE VERSION - Works even if GebetaGame.jsx is missing
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './GamePage.css';

// Try to import external GebetaGame, fallback to inline version
let GebetaGameComponent;
try {
  GebetaGameComponent = require('../games/GebetaGame').default;
  console.log('✅ GebetaGame loaded from ../games/GebetaGame');
} catch (err) {
  console.log('⚠️ GebetaGame not found externally, using inline version');
  
  // INLINE GEBETA GAME - Full implementation
  GebetaGameComponent = ({ user, onClose }) => {
    const [board, setBoard] = useState([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    const [playerScore, setPlayerScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState('player');
    const [selectedPit, setSelectedPit] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [message, setMessage] = useState('Your turn! Select a pit.');
    const [animating, setAnimating] = useState(false);

    const makeMove = async (pitIndex) => {
      if (animating || gameOver || currentPlayer !== 'player') return;
      if (pitIndex > 5 || board[pitIndex] === 0) return;

      setAnimating(true);
      setMessage('Moving seeds...');

      let newBoard = [...board];
      let seeds = newBoard[pitIndex];
      newBoard[pitIndex] = 0;
      let currentIndex = pitIndex;
      let lastPit = -1;

      while (seeds > 0) {
        currentIndex = (currentIndex + 1) % 12;
        newBoard[currentIndex]++;
        seeds--;
        lastPit = currentIndex;
        setBoard([...newBoard]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      let captured = 0;
      if (lastPit <= 5) {
        if (newBoard[lastPit] === 2 || newBoard[lastPit] === 4) {
          captured = newBoard[lastPit];
          newBoard[lastPit] = 0;
          setPlayerScore(prev => prev + captured);
        }
      }

      setBoard(newBoard);
      
      if (captured > 0) {
        setMessage(`You captured ${captured} seeds!`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const playerEmpty = newBoard.slice(0, 6).every(p => p === 0);
      const computerEmpty = newBoard.slice(6, 12).every(p => p === 0);

      if (playerEmpty || computerEmpty) {
        endGame(newBoard);
      } else {
        setCurrentPlayer('computer');
        setMessage("Computer's turn...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        computerMove(newBoard);
      }

      setAnimating(false);
    };

    const computerMove = async (currentBoard) => {
      setAnimating(true);
      
      const validPits = currentBoard
        .slice(6, 12)
        .map((seeds, idx) => ({ idx: idx + 6, seeds }))
        .filter(p => p.seeds > 0);

      if (validPits.length === 0) {
        endGame(currentBoard);
        return;
      }

      const chosen = validPits[Math.floor(Math.random() * validPits.length)];
      let newBoard = [...currentBoard];
      let seeds = newBoard[chosen.idx];
      newBoard[chosen.idx] = 0;
      let currentIndex = chosen.idx;
      let lastPit = -1;

      while (seeds > 0) {
        currentIndex = (currentIndex + 1) % 12;
        newBoard[currentIndex]++;
        seeds--;
        lastPit = currentIndex;
        setBoard([...newBoard]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      let captured = 0;
      if (lastPit >= 6 && lastPit <= 11) {
        if (newBoard[lastPit] === 2 || newBoard[lastPit] === 4) {
          captured = newBoard[lastPit];
          newBoard[lastPit] = 0;
          setComputerScore(prev => prev + captured);
        }
      }

      setBoard(newBoard);

      if (captured > 0) {
        setMessage(`Computer captured ${captured} seeds!`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const playerEmpty = newBoard.slice(0, 6).every(p => p === 0);
      const computerEmpty = newBoard.slice(6, 12).every(p => p === 0);

      if (playerEmpty || computerEmpty) {
        endGame(newBoard);
      } else {
        setCurrentPlayer('player');
        setMessage('Your turn! Select a pit.');
      }

      setAnimating(false);
    };

    const endGame = (finalBoard) => {
      const playerRemaining = finalBoard.slice(0, 6).reduce((a, b) => a + b, 0);
      const computerRemaining = finalBoard.slice(6, 12).reduce((a, b) => a + b, 0);
      
      const finalPlayerScore = playerScore + playerRemaining;
      const finalComputerScore = computerScore + computerRemaining;

      setPlayerScore(finalPlayerScore);
      setComputerScore(finalComputerScore);
      setGameOver(true);

      if (finalPlayerScore > finalComputerScore) {
        setWinner('player');
        setMessage('🎉 You Win!');
      } else if (finalPlayerScore < finalComputerScore) {
        setWinner('computer');
        setMessage('Computer wins!');
      } else {
        setWinner('tie');
        setMessage("It's a tie!");
      }
    };

    const resetGame = () => {
      setBoard([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
      setPlayerScore(0);
      setComputerScore(0);
      setCurrentPlayer('player');
      setGameOver(false);
      setWinner(null);
      setMessage('Your turn! Select a pit.');
    };

    return (
      <div className="gebeta-overlay" onClick={onClose}>
        <div className="gebeta-modal" onClick={(e) => e.stopPropagation()} style={{
          background: 'linear-gradient(135deg, #2D1B3A 0%, #1a1a1a 100%)',
          border: '3px solid #D4AF37',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.2)',
            border: '2px solid #D4AF37',
            color: '#D4AF37',
            fontSize: '24px',
            cursor: 'pointer'
          }}>×</button>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#FFD700', fontSize: '2rem', margin: '0 0 10px 0' }}>🎲 Gebeta</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Ethiopian Traditional Game</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(212,175,55,0.2)', padding: '15px', borderRadius: '12px', flex: 1, marginRight: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>You</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>{playerScore}</div>
            </div>
            <div style={{ background: 'rgba(139,0,0,0.3)', padding: '15px', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Computer</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFD700' }}>{computerScore}</div>
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '15px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '10px',
            marginBottom: '20px',
            color: '#FFD700',
            fontWeight: 'bold'
          }}>
            {message}
          </div>

          <div style={{ padding: '20px', background: 'rgba(139,111,78,0.2)', borderRadius: '15px', marginBottom: '20px' }}>
            {/* Computer pits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '10px' }}>
              {board.slice(6, 12).reverse().map((seeds, idx) => {
                const actualIdx = 11 - idx;
                return (
                  <div key={actualIdx} style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B0000, #660000)',
                    border: '3px solid rgba(220,20,60,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: '5px', 
                      right: '5px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFD700',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>{seeds}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '5px' }}>
                      {Array(seeds).fill(0).map((_, i) => (
                        <span key={i} style={{ color: '#F4E4B8', fontSize: '1rem' }}>●</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Player pits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
              {board.slice(0, 6).map((seeds, idx) => (
                <div 
                  key={idx}
                  onClick={() => makeMove(idx)}
                  onMouseEnter={() => !animating && setSelectedPit(idx)}
                  onMouseLeave={() => setSelectedPit(null)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B6F47, #6B5437)',
                    border: `3px solid ${selectedPit === idx ? '#FFD700' : '#D4AF37'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70px',
                    cursor: seeds === 0 ? 'not-allowed' : 'pointer',
                    opacity: seeds === 0 ? 0.4 : 1,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    transform: selectedPit === idx ? 'translateY(-5px)' : 'none'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '5px', 
                    right: '5px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#FFD700',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>{seeds}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '5px' }}>
                    {Array(seeds).fill(0).map((_, i) => (
                      <span key={i} style={{ color: '#F4E4B8', fontSize: '1rem' }}>●</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {gameOver && (
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, rgba(30,95,62,0.3), rgba(42,122,82,0.2))',
              border: '3px solid rgba(30,95,62,0.4)',
              borderRadius: '15px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#90EE90', fontSize: '1.5rem', margin: '0 0 10px 0' }}>{message}</h3>
              <p style={{ color: '#F4E4B8', margin: '10px 0' }}>
                Final Score: You {playerScore} - {computerScore} Computer
              </p>
              {winner === 'player' && (
                <p style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>+20 Coins! 🪙</p>
              )}
              <button onClick={resetGame} style={{
                marginTop: '15px',
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#000'
              }}>
                Play Again
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            <small>Select your pits to move seeds • Capture 2 or 4 seeds</small>
          </div>
        </div>
      </div>
    );
  };
}

export default function GamePage({ user }) {
  const [showGebeta, setShowGebeta] = useState(false);

  const handleGameClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎮 Opening Gebeta game...');
    setShowGebeta(true);
  };

  const handleCloseGebeta = () => {
    console.log('🎮 Closing Gebeta game...');
    setShowGebeta(false);
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🎮 Games</h1>
        <p className="subtitle">Play traditional Ethiopian games and earn rewards!</p>
      </div>

      <div className="games-grid">
        {/* Gebeta Game Card */}
        <div className="game-card" onClick={handleGameClick}>
          <div className="game-card-header">
            <span className="game-icon">🎲</span>
            <h2>Gebeta</h2>
          </div>
          <p className="game-description">
            Traditional Ethiopian strategy game. Capture seeds and outsmart your opponent!
          </p>
          <div className="game-rewards">
            <span className="reward-item">🪙 20 coins per win</span>
          </div>
          <button className="play-btn" onClick={handleGameClick}>
            Play Now
          </button>
        </div>

        {/* Coming Soon Cards */}
        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">🏃</span>
            <h2>Genna</h2>
          </div>
          <p className="game-description">
            Traditional Ethiopian hockey game. Score goals and win prizes!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>

        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">♟️</span>
            <h2>Senterej</h2>
          </div>
          <p className="game-description">
            Ethiopian chess variant. Test your strategic thinking!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>

        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">🎯</span>
            <h2>Gugs</h2>
          </div>
          <p className="game-description">
            Traditional marble game. Aim, shoot, and collect rewards!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>
      </div>

      {/* User Stats */}
      <div className="game-stats">
        <h3>Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-icon">🎮</span>
            <div className="stat-info">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{user?.games_played || 0}</span>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🪙</span>
            <div className="stat-info">
              <span className="stat-label">Total Coins</span>
              <span className="stat-value">{user?.coins || 0}</span>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">💎</span>
            <div className="stat-info">
              <span className="stat-label">Total Gems</span>
              <span className="stat-value">{user?.gems || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Dashboard */}
      <Link to="/" className="back-btn">
        ← Back to Dashboard
      </Link>

      {/* Gebeta Game Modal */}
      {showGebeta && (
        <GebetaGameComponent 
          user={user} 
          onClose={handleCloseGebeta} 
        />
      )}
    </div>
  );
}