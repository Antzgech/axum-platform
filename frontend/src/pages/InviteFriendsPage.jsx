// src/pages/InviteFriendsPage.jsx
import React, { useState, useEffect } from 'react';
import './InviteFriendsPage.css';

export default function InviteFriendsPage({ user }) {
  const [referralLink, setReferralLink] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateReferralLink();
  }, [user]);

  const generateReferralLink = () => {
    if (user?.telegram_id) {
      const referralCode = btoa(user.telegram_id.toString());
      const link = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;
      setReferralLink(link);
      setInvitedCount(user.invited_friends || 0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareOnTelegram = () => {
    const message = encodeURIComponent(
      `🏆 Join me in Queen Makeda's Quest!\n\n` +
      `Embark on an epic journey from Axum to Jerusalem!\n` +
      `🎮 Complete tasks • 💰 Earn rewards • ⭐ Level up\n\n` +
      `Start playing now:`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`, '_blank');
  };

  const rewards = [
    { friends: 1, coins: 50, gems: 1, label: '1st Friend', icon: '🎁' },
    { friends: 5, coins: 300, gems: 3, label: '5 Friends', icon: '🎉' },
    { friends: 10, coins: 750, gems: 10, label: '10 Friends', icon: '🏆' },
    { friends: 25, coins: 2000, gems: 25, label: '25 Friends', icon: '👑' },
    { friends: 50, coins: 5000, gems: 50, label: '50 Friends', icon: '💎' },
  ];

  return (
    <div className="invite-friends-page">
      <div className="invite-header">
        <h1>👥 Invite Friends</h1>
        <p className="subtitle">You both get rewards!</p>
        
        <div className="invite-stats">
          <div className="stat-box">
            <div className="stat-value">{invitedCount}</div>
            <div className="stat-label">Friends</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{invitedCount * 50}</div>
            <div className="stat-label">Coins Earned</div>
          </div>
        </div>
      </div>

      <div className="referral-section">
        <h2>📋 Your Link</h2>
        <div className="referral-link-box">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="referral-input"
          />
          <button 
            className="copy-btn"
            onClick={copyToClipboard}
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>

        <button className="share-telegram-btn" onClick={shareOnTelegram}>
          ✈️ Share on Telegram
        </button>

        <div className="how-it-works">
          <h3>How it works:</h3>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <span>Share your link</span>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <span>Friend joins & plays</span>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <span>You both get coins!</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rewards-section">
        <h2>🎁 Milestones</h2>
        <div className="rewards-grid">
          {rewards.map((reward, index) => (
            <div 
              key={index}
              className={`reward-card ${invitedCount >= reward.friends ? 'completed' : ''}`}
            >
              <div className="reward-icon">{reward.icon}</div>
              <div className="reward-title">{reward.label}</div>
              <div className="reward-amount">
                🪙 {reward.coins}<br/>
                💎 {reward.gems}
              </div>
              {invitedCount >= reward.friends && (
                <div className="reward-check">✅</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
