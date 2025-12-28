import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css";

export default function GamePage({ userId }) {
  const navigate = useNavigate();

  // Game state
  const [available, setAvailable] = useState(true);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [coinReward, setCoinReward] = useState(0);
  const [gemReward, setGemReward] = useState(0);
  const [cooldownText, setCooldownText] = useState("");
  const [showResult, setShowResult] = useState(false);

  const cooldownTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const animationRef = useRef(null);

  // Player physics
  const playerRef = useRef({ y: 0, vy: 0, jumping: false });
  const obstaclesRef = useRef([]);
  const collectiblesRef = useRef([]);

  // Cooldown check
  useEffect(() => {
    const raw = localStorage.getItem("gameCooldown");
    if (raw) {
      const until = Number(raw);
      const now = Date.now();
      if (now < until) {
        setAvailable(false);
        const remaining = Math.ceil((until - now) / 1000);
        startCooldownCountdown(remaining);
      }
    }
  }, []);

  function startCooldownCountdown(seconds) {
    setCooldownText(`Next in ${seconds}s`);
    cooldownTimerRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(cooldownTimerRef.current);
        setAvailable(true);
        setCooldownText("");
        localStorage.removeItem("gameCooldown");
      } else {
        setCooldownText(`Next in ${seconds}s`);
      }
    }, 1000);
  }

  function startGame() {
    if (!available || running) return;

    setRunning(true);
    setTimeLeft(20);
    setScore(0);
    setCoinReward(0);
    setGemReward(0);
    setShowResult(false);

    obstaclesRef.current = [];
    collectiblesRef.current = [];
    playerRef.current = { y: 0, vy: 0, jumping: false };

    // Timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animation loop
    const startTime = performance.now();
    let lastSpawn = startTime;
    let lastCollectible = startTime;

    const loop = (now) => {
      const elapsed = now - startTime;
      const speed = 1.2 + elapsed / 20000;

      // Spawn obstacles
      if (now - lastSpawn > 1600) {
        obstaclesRef.current.push({ x: 105, w: 40, h: 50, speed });
        lastSpawn = now;
      }

      // Spawn collectibles
      if (now - lastCollectible > 1400) {
        collectiblesRef.current.push({
          x: 105,
          y: Math.random() * 80 + 40,
          type: Math.random() < 0.75 ? "coin" : "gem",
          speed,
          collected: false,
        });
        lastCollectible = now;
      }

      // Player physics
      playerRef.current.vy += 0.5;
      playerRef.current.y += playerRef.current.vy;
      if (playerRef.current.y > 0) {
        playerRef.current.y = 0;
        playerRef.current.vy = 0;
        playerRef.current.jumping = false;
      }

      // Move obstacles
      obstaclesRef.current.forEach((o) => (o.x -= o.speed));
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -15);

      // Move collectibles
      collectiblesRef.current.forEach((c) => {
        if (!c.collected) c.x -= c.speed;
      });
      collectiblesRef.current = collectiblesRef.current.filter((c) => c.x > -15);

      // Collision detection
      const playerBox = { x: 15, w: 50, y: -playerRef.current.y, h: 50 };

      // Check obstacles
      for (const o of obstaclesRef.current) {
        const obsBox = { x: o.x, w: o.w, y: 0, h: o.h };
        if (
          playerBox.x < obsBox.x + obsBox.w &&
          playerBox.x + playerBox.w > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.h &&
          playerBox.y + playerBox.h > obsBox.y
        ) {
          endGame(true);
          return;
        }
      }

      // Collect items
      collectiblesRef.current.forEach((c) => {
        if (c.collected) return;
        const colBox = { x: c.x, w: 30, y: c.y, h: 30 };
        if (
          playerBox.x < colBox.x + colBox.w &&
          playerBox.x + playerBox.w > colBox.x &&
          playerBox.y < colBox.y + colBox.h &&
          playerBox.y + playerBox.h > colBox.y
        ) {
          c.collected = true;
          if (c.type === "coin") setCoinReward((v) => v + 1);
          else setGemReward((v) => v + 1);
        }
      });

      setScore((prev) => prev + 1);
      renderScene();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
  }

  function jump() {
    if (!running) return;
    if (playerRef.current.jumping) return;
    playerRef.current.vy = -10;
    playerRef.current.jumping = true;
  }

  function renderScene() {
    const canvas = document.getElementById("runner-canvas");
    if (!canvas) return;

    const playerEl = canvas.querySelector(".runner-player");
    if (playerEl) {
      playerEl.style.transform = `translateY(${playerRef.current.y}px)`;
    }

    const obsContainer = canvas.querySelector(".runner-obstacles");
    obsContainer.innerHTML = "";
    obstaclesRef.current.forEach((o) => {
      const el = document.createElement("div");
      el.className = "runner-obstacle";
      el.style.left = `${o.x}%`;
      el.style.width = `${o.w}px`;
      el.style.height = `${o.h}px`;
      obsContainer.appendChild(el);
    });

    const colContainer = canvas.querySelector(".runner-collectibles");
    colContainer.innerHTML = "";
    collectiblesRef.current.forEach((c) => {
      if (c.collected) return;
      const el = document.createElement("div");
      el.className = `runner-collectible ${c.type}`;
      el.textContent = c.type === "coin" ? "🪙" : "💎";
      el.style.left = `${c.x}%`;
      el.style.bottom = `${c.y}px`;
      colContainer.appendChild(el);
    });
  }

  async function endGame(collision = false) {
    if (!running) return;
    setRunning(false);
    setShowResult(true);

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const cooldownUntil = Date.now() + 60_000;
    localStorage.setItem("gameCooldown", String(cooldownUntil));
    setAvailable(false);
    startCooldownCountdown(60);

    try {
      await fetch("/api/game/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, score, coinReward, gemReward, duration: 20 }),
      });
      localStorage.setItem("gameUpdated", Date.now().toString());
      setTimeout(() => localStorage.removeItem("gameUpdated"), 200);
    } catch (err) {
      console.error("Error saving game result", err);
    }
  }

  // Handle keyboard and touch
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    
    const onTouch = (e) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener("keydown", onKey);
    
    const canvas = document.getElementById("runner-canvas");
    if (canvas) {
      canvas.addEventListener("touchstart", onTouch, { passive: false });
      canvas.addEventListener("click", onTouch);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (canvas) {
        canvas.removeEventListener("touchstart", onTouch);
        canvas.removeEventListener("click", onTouch);
      }
    };
  }, [running]);

  return (
    <div className="game-fullscreen">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="game-title">🏃 Queen's Run</h2>
        <div className="game-hud">
          <div className="hud-item">
            <span className="hud-icon">⏱</span>
            <span className="hud-value">{timeLeft}s</span>
          </div>
          <div className="hud-item">
            <span className="hud-icon">⭐</span>
            <span className="hud-value">{score}</span>
          </div>
        </div>
      </div>

      <div id="runner-canvas" className="runner-canvas">
        <div className="bg-layer bg-sky" />
        <div className="bg-layer bg-mountains" />
        <div className="bg-layer bg-hills" />
        
        <div className="runner-ground" />
        <div className="runner-player">
          <div className="player-character">👸🏾</div>
        </div>
        <div className="runner-obstacles" />
        <div className="runner-collectibles" />
        
        {!running && available && (
          <div className="tap-hint">👆 Tap to Jump</div>
        )}
      </div>

      <div className="game-controls">
        <button
          className={`start-btn ${!available || running ? 'disabled' : ''}`}
          onClick={startGame}
          disabled={!available || running}
        >
          {running ? (
            <><span className="btn-icon">🎮</span><span>Playing...</span></>
          ) : available ? (
            <><span className="btn-icon">🚀</span><span>Start 20s Game</span></>
          ) : (
            <><span className="btn-icon">⏳</span><span>{cooldownText}</span></>
          )}
        </button>
      </div>

      {showResult && (
        <div className="game-result-overlay">
          <div className="result-panel">
            <h3 className="result-title">🎉 Game Over!</h3>
            <div className="result-score">
              <div className="score-big">
                <span className="score-label">Score</span>
                <span className="score-number">{score}</span>
              </div>
            </div>
            <div className="result-rewards">
              <div className="reward-item">
                <span className="reward-emoji">🪙</span>
                <span className="reward-value">+{coinReward}</span>
              </div>
              <div className="reward-item">
                <span className="reward-emoji">💎</span>
                <span className="reward-value">+{gemReward}</span>
              </div>
            </div>
            <button className="close-result-btn" onClick={() => setShowResult(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {running && (coinReward > 0 || gemReward > 0) && (
        <div className="live-rewards">
          {coinReward > 0 && (
            <div className="live-reward-item">
              <span className="live-reward-emoji">🪙</span>
              <span>{coinReward}</span>
            </div>
          )}
          {gemReward > 0 && (
            <div className="live-reward-item">
              <span className="live-reward-emoji">💎</span>
              <span>{gemReward}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
