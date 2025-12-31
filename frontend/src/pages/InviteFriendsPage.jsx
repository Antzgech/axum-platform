// src/pages/InviteFriendsPage.jsx
import React, { useState, useEffect } from 'react';
import './InviteFriendsPage.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function InviteFriendsPage({ user }) {
  const [referralLink, setReferralLink] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateReferralLink();
  }, [user]);

  const generateReferralLink = () => {
    if (user?.telegram_id) {
      // Encode user ID for referral
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
      // Fallback for older browsers
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
      `🎮 Complete tasks\n💰 Earn rewards\n⭐ Level up\n\n` +
      `Start playing now:`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`, '_blank');
  };

  const rewards = [
    { friends: 1, coins: 50, gems: 1, label: '1st Friend' },
    { friends: 5, coins: 300, gems: 3, label: '5 Friends' },
    { friends: 10, coins: 750, gems: 10, label: '10 Friends' },
    { friends: 25, coins: 2000, gems: 25, label: '25 Friends' },
    { friends: 50, coins: 5000, gems: 50, label: '50 Friends' },
  ];

  return (
    <div className="invite-friends-page">
      <div className="invite-header">
        <h1>👥 Invite Friends</h1>
        <p className="subtitle">Earn rewards for every friend you invite!</p>
        
        <div className="invite-stats">
          <div className="stat-box">
            <div className="stat-value">{invitedCount}</div>
            <div className="stat-label">Friends Invited</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{invitedCount * 50}</div>
            <div className="stat-label">Coins Earned</div>
          </div>
        </div>
      </div>

      <div className="referral-section">
        <h2>📋 Your Referral Link</h2>
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
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        <button className="share-telegram-btn" onClick={shareOnTelegram}>
          <span className="telegram-icon">✈️</span>
          Share on Telegram
        </button>
      </div>

      <div className="rewards-section">
        <h2>🎁 Referral Rewards</h2>
        <div className="rewards-list">
          {rewards.map((reward, index) => (
            <div 
              key={index}
              className={`reward-item ${invitedCount >= reward.friends ? 'completed' : ''}`}
            >
              <div className="reward-icon">
                {invitedCount >= reward.friends ? '✅' : '🎁'}
              </div>
              <div className="reward-info">
                <div className="reward-title">{reward.label}</div>
                <div className="reward-amount">
                  🪙 {reward.coins} • 💎 {reward.gems}
                </div>
              </div>
              <div className="reward-progress">
                {invitedCount}/{reward.friends}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="how-it-works">
        <h3>How It Works</h3>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <span className="step-text">Share your referral link with friends</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span className="step-text">They join using your link</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span className="step-text">You both get rewards!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
