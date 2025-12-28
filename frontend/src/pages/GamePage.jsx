// src/pages/GamePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css";

import iconCoin from "../assets/icon-coin.png";
import iconGem from "../assets/icon-gem.png";

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

      // MUCH SLOWER SPEED
      const speed = 1.5 + elapsed / 15000; // slow ramp

      // Spawn obstacles (slower)
      if (now - lastSpawn > 1400) {
        obstaclesRef.current.push({
          x: 100,
          w: 14,
          speed,
        });
        lastSpawn = now;
      }

      // Spawn collectibles (coins/gems)
      if (now - lastCollectible > 1800) {
        collectiblesRef.current.push({
          x: 100,
          y: Math.random() * 40 + 10,
          type: Math.random() < 0.8 ? "coin" : "gem",
          speed,
        });
        lastCollectible = now;
      }

      // Player physics
      playerRef.current.vy += 0.4; // slower gravity
      playerRef.current.y += playerRef.current.vy;
      if (playerRef.current.y > 0) {
        playerRef.current.y = 0;
        playerRef.current.vy = 0;
        playerRef.current.jumping = false;
      }

      // Move obstacles
      obstaclesRef.current.forEach((o) => (o.x -= o.speed));
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -10);

      // Move collectibles
      collectiblesRef.current.forEach((c) => (c.x -= c.speed));
      collectiblesRef.current = collectiblesRef.current.filter((c) => c.x > -10);

      // Collision detection
      const playerBox = { x: 10, w: 12, y: -playerRef.current.y, h: 30 };

      for (const o of obstaclesRef.current) {
        const obsBox = { x: o.x, w: o.w, y: 0, h: 30 };
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

      // Collect coins/gems
      collectiblesRef.current.forEach((c) => {
        const colBox = { x: c.x, w: 10, y: c.y, h: 10 };
        if (
          playerBox.x < colBox.x + colBox.w &&
          playerBox.x + playerBox.w > colBox.x &&
          playerBox.y < colBox.y + colBox.h &&
          playerBox.y + playerBox.h > colBox.y
        ) {
          if (c.type === "coin") setCoinReward((v) => v + 1);
          else setGemReward((v) => v + 1);

          c.x = -999; // remove
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
    playerRef.current.vy = -8; // smoother jump
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
      obsContainer.appendChild(el);
    });

    const colContainer = canvas.querySelector(".runner-collectibles");
    colContainer.innerHTML = "";
    collectiblesRef.current.forEach((c) => {
      const el = document.createElement("img");
      el.className = "runner-collectible";
      el.src = c.type === "coin" ? iconCoin : iconGem;
      el.style.left = `${c.x}%`;
      el.style.bottom = `${c.y}px`;
      colContainer.appendChild(el);
    });
  }

  async function endGame() {
    if (!running) return;
    setRunning(false);

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

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
          coinReward,
          gemReward,
          duration: 20,
        }),
      });

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
    <div className="game-fullscreen">
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

      <div id="runner-canvas" className="runner-canvas" onClick={jump}>
        <div className="runner-ground" />
        <div className="runner-player" />
        <div className="runner-obstacles" />
        <div className="runner-collectibles" />
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
        <div>Coins collected: {coinReward}</div>
        <div>Gems collected: {gemReward}</div>
      </div>
    </div>
  );
}
