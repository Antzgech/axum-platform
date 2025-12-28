// src/pages/GamePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

// Assets
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';

export default function GamePage({ userId }) {
  const navigate = useNavigate();

  // Game state
  const [available, setAvailable] = useState(true); // whether user can start a 20s session
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20); // seconds remaining in active session
  const [coinCollected, setCoinCollected] = useState(0);
  const [gemCollected, setGemCollected] = useState(0);
  const cooldownRef = useRef(null);
  const timerRef = useRef(null);

  // Check cooldown from server (optional) or localStorage
  useEffect(() => {
    // Use localStorage key 'gameCooldown' to persist cooldown across tabs
    const raw = localStorage.getItem('gameCooldown');
    if (raw) {
      const until = Number(raw);
      if (Date.now() < until) {
        setAvailable(false);
        const remaining = Math.ceil((until - Date.now()) / 1000);
        // schedule re-enable
        cooldownRef.current = window.setTimeout(() => setAvailable(true), remaining * 1000);
      } else {
        localStorage.removeItem('gameCooldown');
        setAvailable(true);
      }
    }
    return () => {
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Start a 20s game session
  function startGame() {
    if (!available || running) return;
    setRunning(true);
    setTimeLeft(20);
    setCoinCollected(0);
    setGemCollected(0);

    // countdown
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Simple interaction: click the big target to collect random small rewards
  function collectTap() {
    if (!running) return;
    // small random increments per tap
    const coin = Math.floor(Math.random() * 50) + 10; // 10-59
    const gemChance = Math.random();
    const gem = gemChance < 0.12 ? 1 : 0; // ~12% chance to get 1 gem per tap
    setCoinCollected(c => c + coin);
    setGemCollected(g => g + gem);
  }

  // End game: persist to server, set cooldown (1 minute), notify dashboard via localStorage
  async function endGame() {
    setRunning(false);
    // set cooldown for 1 minute (60000 ms)
    const cooldownUntil = Date.now() + 60 * 1000;
    localStorage.setItem('gameCooldown', String(cooldownUntil));
    setAvailable(false);
    cooldownRef.current = window.setTimeout(() => {
      setAvailable(true);
      localStorage.removeItem('gameCooldown');
    }, 60 * 1000);

    // Prepare payload
    const payload = {
      userId,
      coinReward: coinCollected,
      gemReward: gemCollected,
      playedAt: new Date().toISOString(),
      duration: 20,
    };

    // POST to server endpoint to save results (replace URL with your API)
    try {
      await fetch('/api/game/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // handle error silently; still update UI
    }

    // Notify Dashboard via localStorage event (other tabs will receive storage event)
    localStorage.setItem('gameResult', JSON.stringify({ coinReward: coinCollected, gemReward: gemCollected, ts: Date.now() }));
    // remove key quickly to allow future events (some browsers require change)
    setTimeout(() => localStorage.removeItem('gameResult'), 200);

    // Optionally navigate back to dashboard or show summary
    // navigate('/dashboard');
  }

  return (
    <div className="game-page-root">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2>Boosts — Quick Play</h2>
      </div>

      <div className="game-area">
        <div className="game-info">
          <div className="status-row">
            <div className="status-item">
              <img src={iconCoin} alt="" className="status-icon" />
              <div className="status-value">{coinCollected.toLocaleString()}</div>
            </div>
            <div className="status-item">
              <img src={iconGem} alt="" className="status-icon" />
              <div className="status-value">{gemCollected}</div>
            </div>
          </div>

          <div className="timer-row">
            {running ? (
              <div className="timer">Time left: <strong>{timeLeft}s</strong></div>
            ) : available ? (
              <div className="ready">Ready to play — 20s session</div>
            ) : (
              <div className="cooldown">Cooldown active — please wait</div>
            )}
          </div>
        </div>

        <div className="game-target-area">
          <button
            className={`game-target ${running ? 'active' : 'disabled'}`}
            onClick={collectTap}
            disabled={!running}
            aria-label="Collect coins and gems"
          >
            {running ? 'TAP!' : 'Start to Play'}
          </button>
        </div>

        <div className="game-controls">
          <button className="start-btn" onClick={startGame} disabled={!available || running}>
            {running ? 'Playing...' : available ? 'Start 20s' : 'Locked'}
          </button>
        </div>
      </div>
    </div>
  );
}
