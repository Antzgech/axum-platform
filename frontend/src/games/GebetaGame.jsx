// src/games/GebetaGame.jsx
import React, { useState, useEffect } from 'react';
import './GebetaGame.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function GebetaGame({ user, onClose }) {
  const [board, setBoard] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [selectedPit, setSelectedPit] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('Your turn! Select a pit.');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Gebeta board: 6 pits per player, 4 seeds each
    const newBoard = [
      4, 4, 4, 4, 4, 4, // Player pits (0-5)
      4, 4, 4, 4, 4, 4  // Computer pits (6-11)
    ];
    setBoard(newBoard);
    setPlayerScore(0);
    setComputerScore(0);
    setCurrentPlayer('player');
    setGameOver(false);
    setWinner(null);
    setMessage('Your turn! Select a pit.');
  };

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

    // Distribute seeds
    while (seeds > 0) {
      currentIndex = (currentIndex + 1) % 12;
      newBoard[currentIndex]++;
      seeds--;
      lastPit = currentIndex;
      
      // Animate
      setBoard([...newBoard]);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Capture logic
    let captured = 0;
    if (lastPit <= 5) { // Landed in player's side
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

    // Check if game over
    const playerEmpty = newBoard.slice(0, 6).every(p => p === 0);
    const computerEmpty = newBoard.slice(6, 12).every(p => p === 0);

    if (playerEmpty || computerEmpty) {
      endGame(newBoard);
    } else {
      // Computer's turn
      setCurrentPlayer('computer');
      setMessage("Computer's turn...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      computerMove(newBoard);
    }

    setAnimating(false);
  };

  const computerMove = async (currentBoard) => {
    setAnimating(true);
    
    // Simple AI: pick random non-empty pit
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

    // Computer capture
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

    // Check game over
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

  const endGame = async (finalBoard) => {
    // Count remaining seeds
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
      
      // Award coins
      const coinsWon = 20;
      try {
        const token = localStorage.getItem('axum_token');
        await fetch(`${API_URL}/api/game/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user?.telegram_id,
            coinReward: coinsWon,
            gemReward: 0,
            score: finalPlayerScore
          })
        });
      } catch (err) {
        console.log('Award error:', err);
      }
    } else if (finalPlayerScore < finalComputerScore) {
      setWinner('computer');
      setMessage('Computer wins!');
    } else {
      setWinner('tie');
      setMessage("It's a tie!");
    }
  };

  return (
    <div className="gebeta-overlay">
      <div className="gebeta-modal">
        <button className="gebeta-close" onClick={onClose}>×</button>
        
        <div className="gebeta-header">
          <h2>🎲 Gebeta</h2>
          <p className="gebeta-subtitle">Ethiopian Traditional Game</p>
        </div>

        <div className="gebeta-scores">
          <div className="score-box">
            <div className="score-label">You</div>
            <div className="score-value">{playerScore}</div>
          </div>
          <div className="score-box computer">
            <div className="score-label">Computer</div>
            <div className="score-value">{computerScore}</div>
          </div>
        </div>

        <div className="gebeta-message">{message}</div>

        <div className="gebeta-board">
          {/* Computer's pits (top row, reversed for visual) */}
          <div className="board-row computer-row">
            {board.slice(6, 12).reverse().map((seeds, idx) => {
              const actualIdx = 11 - idx;
              return (
                <div key={actualIdx} className="pit computer-pit">
                  <div className="seeds-count">{seeds}</div>
                  <div className="seeds">
                    {Array(seeds).fill(0).map((_, i) => (
                      <span key={i} className="seed">●</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player's pits (bottom row) */}
          <div className="board-row player-row">
            {board.slice(0, 6).map((seeds, idx) => (
              <div 
                key={idx} 
                className={`pit player-pit ${selectedPit === idx ? 'selected' : ''} ${seeds === 0 ? 'empty' : ''}`}
                onClick={() => makeMove(idx)}
                onMouseEnter={() => !animating && setSelectedPit(idx)}
                onMouseLeave={() => setSelectedPit(null)}
              >
                <div className="seeds-count">{seeds}</div>
                <div className="seeds">
                  {Array(seeds).fill(0).map((_, i) => (
                    <span key={i} className="seed">●</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {gameOver && (
          <div className="game-over">
            <h3>{message}</h3>
            <p>Final Score: You {playerScore} - {computerScore} Computer</p>
            {winner === 'player' && <p className="reward">+20 Coins! 🪙</p>}
            <button className="play-again-btn" onClick={initializeGame}>
              Play Again
            </button>
          </div>
        )}

        <div className="gebeta-footer">
          <small>Select your pits to move seeds • Capture 2 or 4 seeds</small>
        </div>
      </div>
    </div>
  );
}
