// src/pages/GamePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css";

export default function GamePage({ userId }) {
  const navigate = useNavigate();

  const [available, setAvailable] = useState(true);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [coinReward, setCoinReward] = useState(0);
  const [gemReward, setGemReward] = useState(0);
  const [cooldownText, setCooldownText] = useState("");

  const cooldownTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const animationRef = useRef(null);

  const playerRef = useRef({ y: 0, vy: 0, jumping: false });
  const obstaclesRef = useRef([]);

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
      } else {
        localStorage.removeItem("gameCooldown");
      }
    }
  }, []);

  function startCooldownCountdown(seconds) {
    setCooldownText(`Locked (${seconds}s)`);
    cooldownTimerRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(cooldownTimerRef.current);
        setAvailable(true);
        setCooldownText("");
        localStorage.removeItem("gameCooldown");
      } else {
        setCooldownText(`Locked (${seconds}s)`);
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
    obstaclesRef.current = [];
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

    const loop = (now) => {
      const elapsed = now - startTime;
      const speedFactor = 4 + Math.floor(elapsed / 4000);

      // Spawn obstacles
      if (now - lastSpawn > 800 - Math.min(500, Math.floor(elapsed / 10))) {
        obstaclesRef.current.push({
          x: 100,
          w: 6 + Math.random() * 12,
          speed: speedFactor + Math.random() * 2,
        });
        lastSpawn = now;
      }

      // Player physics
      playerRef.current.vy += 0.6;
      playerRef.current.y += playerRef.current.vy;
      if (playerRef.current.y > 0) {
        playerRef.current.y = 0;
        playerRef.current.vy = 0;
        playerRef.current.jumping = false;
      }

      // Move obstacles
      obstaclesRef.current.forEach((o) => (o.x -= o.speed * 0.5));
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.w > -10);

      // Collision
      const playerBox = { x: 10, w: 10, y: -playerRef.current.y, h: 30 };
      for (const o of obstaclesRef.current) {
        const obsBox = { x: o.x, w: 4, y: 0, h: 30 };
        if (
          playerBox.x < obsBox.x + obsBox.w &&
          playerBox.x + playerBox.w > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.h &&
          playerBox.y + playerBox.h > obsBox.y
        ) {
          endGame();
          return;
        }
      }

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
    if (obsContainer) {
      obsContainer.innerHTML = "";
      obstaclesRef.current.forEach((o) => {
        const el = document.createElement("div");
        el.className = "runner-obstacle";
        el.style.left = `${o.x}%`;
        el.style.width = `${o.w}px`;
        obsContainer.appendChild(el);
      });
    }
  }

  async function endGame() {
    if (!running) return;
    setRunning(false);

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Rewards
    const coins = Math.floor(score / 5);
    const gems = Math.floor(score / 100);

    setCoinReward(coins);
    setGemReward(gems);

    // Cooldown
    const cooldownUntil = Date.now() + 60_000;
    localStorage.setItem("gameCooldown", String(cooldownUntil));
    setAvailable(false);
    startCooldownCountdown(60);

    // Send to backend
    try {
      await fetch("/api/game/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          score,
          coinReward: coins,
          gemReward: gems,
          duration: 20,
        }),
      });

      // Notify Dashboard
      localStorage.setItem("gameUpdated", Date.now().toString());
      setTimeout(() => localStorage.removeItem("gameUpdated"), 200);
    } catch (err) {
      console.error("Error saving game result", err);
    }
  }

  // Space to jump
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="game-page-root">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Boosts — Quick Play</h2>
        <div className="game-hud">
          <div>Time: {timeLeft}s</div>
          <div>Score: {score}</div>
        </div>
      </div>

      <div
        id="runner-canvas"
        className="runner-canvas"
        onClick={jump}
      >
        <div className="runner-ground" />
        <div className="runner-player" />
        <div className="runner-obstacles" />
      </div>

      <div className="game-controls">
        <button
          className="start-btn"
          onClick={startGame}
          disabled={!available || running}
        >
          {running ? "Playing..." : available ? "Start 20s" : cooldownText}
        </button>
      </div>

      <div className="game-result-panel">
        <div>Coins earned: {coinReward}</div>
        <div>Gems earned: {gemReward}</div>
      </div>
    </div>
  );
}
