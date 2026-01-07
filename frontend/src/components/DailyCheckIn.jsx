import React, { useState, useEffect } from 'react';
import './DailyCheckIn.css';

const API_URL = process.env.REACT_APP_API_URL;

const DAILY_REWARDS = {
  1: { coins: 10, gems: 0 },
  2: { coins: 20, gems: 0 },
  3: { coins: 30, gems: 1 },
  4: { coins: 40, gems: 1 },
  5: { coins: 50, gems: 2 },
  6: { coins: 60, gems: 2 },
  7: { coins: 100, gems: 5 }
};

export default function DailyCheckIn({ onClose, onClaim }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("daily");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("axum_token");
      const res = await fetch(`${API_URL}/api/checkin/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Check-in status error:", err);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem("axum_token");
      const res = await fetch(`${API_URL}/api/checkin/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        onClaim?.(); // refresh user
        onClose();   // close modal
      } else {
        const error = await res.json();
        alert(error.error || "Failed to claim reward");
      }
    } catch (err) {
      console.error("Claim error:", err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !status) return null;

  const streak = status.streak || 0;
  const todayIndex = ((streak % 7) || 0) + 1;

  const dailyBoxes = [
    { label: "Yesterday", day: todayIndex - 1 },
    { label: "Today", day: todayIndex },
    { label: "Tomorrow", day: todayIndex + 1 }
  ];

  const normalizeDay = (d) => {
    if (d < 1) return 7;
    if (d > 7) return 1;
    return d;
  };

  return (
    <div className="checkin-overlay" onClick={onClose}>
      <div className="checkin-box" onClick={(e) => e.stopPropagation()}>
        <button className="checkin-close" onClick={onClose}>×</button>
        <h2 className="checkin-title">🎁 Daily Check‑In</h2>

        <div className="checkin-toggle">
          <button className={view === "daily" ? "active" : ""} onClick={() => setView("daily")}>Daily</button>
          <button className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")}>Weekly</button>
        </div>

        {view === "daily" && (
          <div className="daily-view">
            {dailyBoxes.map((box, i) => {
              const day = normalizeDay(box.day);
              const reward = DAILY_REWARDS[day];
              const isToday = box.label === "Today";
              const isTomorrow = box.label === "Tomorrow";
              const claimed = day < todayIndex;
              const canClaim = isToday && status.canClaim;

              return (
                <div key={i} className={`daily-box ${claimed ? "claimed" : ""} ${isToday ? "today" : ""} ${isTomorrow ? "disabled" : ""}`}>
                  <div className="daily-label">{box.label}</div>
                  <div className="daily-reward">
                    🪙 {reward.coins}
                    {reward.gems > 0 && <> | 💎 {reward.gems}</>}
                  </div>
                </div>
              );
            })}

            {status.canClaim && (
              <button className="claim-btn" onClick={claimReward} disabled={claiming}>
                {claiming ? "Claiming..." : "Claim Reward"}
              </button>
            )}
          </div>
        )}

        {view === "weekly" && (
          <div className="weekly-view">
            {[1,2,3,4,5,6,7].map(day => {
              const reward = DAILY_REWARDS[day];
              const claimed = day < todayIndex;
              const isToday = day === todayIndex;
              const upcoming = day > todayIndex;

              return (
                <div key={day} className={`week-box ${claimed ? "claimed" : ""} ${isToday ? "today" : ""} ${upcoming ? "disabled" : ""}`}>
                  <div className="week-day">Day {day}</div>
                  <div className="week-reward">
                    🪙 {reward.coins}
                    {reward.gems > 0 && <> | 💎 {reward.gems}</>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
