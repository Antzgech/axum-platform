import React, { useState, useEffect } from 'react';
import './GebetaGame.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function GebetaGame({ user, onClose }) {
  const [board, setBoard] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('Your turn! Select a pit.');
  const [animating, setAnimating] = useState(false);

  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [inviteStatus, setInviteStatus] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newBoard = [
      4, 4, 4, 4, 4, 4, // player pits 0–5
      4, 4, 4, 4, 4, 4  // opponent pits 6–11
    ];
    setBoard(newBoard);
    setPlayerScore(0);
    setOpponentScore(0);
    setCurrentPlayer('player');
    setGameOver(false);
    setWinner(null);
    setMessage('Your turn! Select a pit.');
    setMatchId(null);
    setIsMultiplayer(false);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('axum_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleInviteClick = async () => {
    setShowInvitePanel(prev => !prev);
    setInviteStatus('');
    if (!showInvitePanel) {
      await loadAvailablePlayers();
    }
  };

  const loadAvailablePlayers = async () => {
    try {
      setPlayersLoading(true);
      const res = await fetch(`${API_URL}/api/gebeta/players`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setAvailablePlayers(data.players || []);
    } catch (err) {
      console.error('Error loading players:', err);
      setInviteStatus('Failed to load players.');
    } finally {
      setPlayersLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!selectedPlayer || !betAmount || betAmount <= 0) {
      setInviteStatus('Select a player and enter bet.');
      return;
    }
    try {
      setInviteStatus('Sending invite...');
      const res = await fetch(`${API_URL}/api/gebeta/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          opponentId: selectedPlayer.id,
          bet: betAmount
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus(data.message || 'Invite failed.');
        return;
      }
      setMatchId(data.matchId);
      setIsMultiplayer(true);
      setInviteStatus('Invite sent. Waiting for opponent...');
    } catch (err) {
      console.error('Invite error:', err);
      setInviteStatus('Invite failed.');
    }
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

    while (seeds > 0) {
      currentIndex = (currentIndex + 1) % 12;
      newBoard[currentIndex]++;
      seeds--;
      lastPit = currentIndex;
      setBoard([...newBoard]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    let captured = 0;
    if (lastPit <= 5 && (newBoard[lastPit] === 2 || newBoard[lastPit] === 4)) {
      captured = newBoard[lastPit];
      newBoard[lastPit] = 0;
      setPlayerScore(prev => prev + captured);
    }

    setBoard(newBoard);

    if (captured > 0) {
      setMessage(`You captured ${captured} seeds!`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const playerEmpty = newBoard.slice(0, 6).every(p => p === 0);
    const opponentEmpty = newBoard.slice(6, 12).every(p => p === 0);

    if (playerEmpty || opponentEmpty) {
      await endGame(newBoard);
      setAnimating(false);
      return;
    }

    if (isMultiplayer) {
      await submitMultiplayerMove(newBoard, pitIndex);
      setCurrentPlayer('opponent');
      setMessage("Opponent's turn...");
    } else {
      setCurrentPlayer('opponent');
      setMessage("Computer's turn...");
      await new Promise(resolve => setTimeout(resolve, 800));
      await computerMove(newBoard);
    }

    setAnimating(false);
  };

  const submitMultiplayerMove = async (newBoard, pitIndex) => {
    if (!matchId) return;
    try {
      await fetch(`${API_URL}/api/gebeta/move`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          matchId,
          board: newBoard,
          moveIndex: pitIndex
        })
      });
    } catch (err) {
      console.error('Multiplayer move error:', err);
    }
  };

  const computerMove = async (currentBoard) => {
    const validPits = currentBoard
      .slice(6, 12)
      .map((seeds, idx) => ({ idx: idx + 6, seeds }))
      .filter(p => p.seeds > 0);

    if (validPits.length === 0) {
      await endGame(currentBoard);
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
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    let captured = 0;
    if (lastPit >= 6 && lastPit <= 11 && (newBoard[lastPit] === 2 || newBoard[lastPit] === 4)) {
      captured = newBoard[lastPit];
      newBoard[lastPit] = 0;
      setOpponentScore(prev => prev + captured);
    }

    setBoard(newBoard);

    if (captured > 0) {
      setMessage(`Computer captured ${captured} seeds!`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const playerEmpty = newBoard.slice(0, 6).every(p => p === 0);
    const opponentEmpty = newBoard.slice(6, 12).every(p => p === 0);

    if (playerEmpty || opponentEmpty) {
      await endGame(newBoard);
      return;
    }

    setCurrentPlayer('player');
    setMessage('Your turn! Select a pit.');
  };

  const awardCoinsOnWin = async (coinsWon, finalPlayerScore) => {
    try {
      await fetch(`${API_URL}/api/game/result`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user?.telegram_id,
          coinReward: coinsWon,
          gemReward: 0,
          score: finalPlayerScore
        })
      });
      alert(`You won ${coinsWon} coins!`);
    } catch (err) {
      console.error('Award error:', err);
    }
  };

  const endGame = async (finalBoard) => {
    const playerRemaining = finalBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const opponentRemaining = finalBoard.slice(6, 12).reduce((a, b) => a + b, 0);

    const finalPlayerScore = playerScore + playerRemaining;
    const finalOpponentScore = opponentScore + opponentRemaining;

    setPlayerScore(finalPlayerScore);
    setOpponentScore(finalOpponentScore);
    setGameOver(true);

    if (finalPlayerScore > finalOpponentScore) {
      setWinner('player');
      setMessage('🎉 You Win!');
      const coinsWon = isMultiplayer ? betAmount * 2 : 20;
      await awardCoinsOnWin(coinsWon, finalPlayerScore);
      if (isMultiplayer && matchId) {
        try {
          await fetch(`${API_URL}/api/gebeta/finish`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              matchId,
              winner: user?.telegram_id,
              playerScore: finalPlayerScore,
              opponentScore: finalOpponentScore
            })
          });
        } catch (err) {
          console.error('Finish match error:', err);
        }
      }
    } else if (finalPlayerScore < finalOpponentScore) {
      setWinner('opponent');
      setMessage(isMultiplayer ? 'Opponent wins!' : 'Computer wins!');
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

          <div className="gebeta-top-bar">
            <div className="gebeta-user">
              {user?.username || 'Player'}
            </div>
            <div className="gebeta-coins">
              🪙 Coins: {user?.coins ?? 0}
            </div>
            <button
              className="gebeta-invite-btn"
              onClick={handleInviteClick}
            >
              🤝 Invite
            </button>
          </div>
        </div>

        <div className={`gebeta-invite-panel ${showInvitePanel ? 'open' : ''}`}>
          <div className="invite-row">
            <div className="invite-column">
              <label className="invite-label">Available Players</label>
              {playersLoading ? (
                <div className="invite-status">Loading players...</div>
              ) : (
                <select
                  className="invite-select"
                  value={selectedPlayer?.id || ''}
                  onChange={e => {
                    const p = availablePlayers.find(pl => pl.id === e.target.value);
                    setSelectedPlayer(p || null);
                  }}
                >
                  <option value="">Select player</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.coins} 🪙)
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="invite-column">
              <label className="invite-label">Bet (coins)</label>
              <input
                type="number"
                className="invite-input"
                value={betAmount}
                min={1}
                onChange={e => setBetAmount(Number(e.target.value))}
              />
            </div>
            <div className="invite-column invite-column-button">
              <button className="invite-send-btn" onClick={sendInvite}>
                Send Invite
              </button>
            </div>
          </div>
          {inviteStatus && (
            <div className="invite-status">{inviteStatus}</div>
          )}
        </div>

        <div className="gebeta-scores">
          <div className="score-box">
            <div className="score-label">You</div>
            <div className="score-value">{playerScore}</div>
          </div>
          <div className="score-box computer">
            <div className="score-label">{isMultiplayer ? 'Opponent' : 'Computer'}</div>
            <div className="score-value">{opponentScore}</div>
          </div>
        </div>

        <div className="gebeta-message">{message}</div>

        <div className="gebeta-board">
          <div className="board-row computer-row">
            {board.slice(6, 12).reverse().map((seeds, idx) => {
              const actualIdx = 11 - idx;
              return (
                <div key={actualIdx} className="pit-wrapper">
                  <div className="seeds-count">{seeds}</div>
                  <div className="pit computer-pit">
                    <div className="seeds">
                      {Array(seeds).fill(0).map((_, i) => (
                        <span
                          key={i}
                          className="seed"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="board-row player-row">
            {board.slice(0, 6).map((seeds, idx) => (
              <div key={idx} className="pit-wrapper">
                <div
                  className={`pit player-pit ${seeds === 0 ? 'empty' : ''}`}
                  onClick={() => makeMove(idx)}
                >
                  <div className="seeds">
                    {Array(seeds).fill(0).map((_, i) => (
                      <span
                        key={i}
                        className="seed"
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        ●
                      </span>
                    ))}
                  </div>
                </div>
                <div className="seeds-count">{seeds}</div>
              </div>
            ))}
          </div>
        </div>

        {gameOver && (
          <div className="game-over">
            <h3>{message}</h3>
            <p>Final Score: You {playerScore} - {opponentScore} {isMultiplayer ? 'Opponent' : 'Computer'}</p>
            {winner === 'player' && (
              <p className="reward">
                +{isMultiplayer ? betAmount * 2 : 20} Coins! 🪙
              </p>
            )}
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
