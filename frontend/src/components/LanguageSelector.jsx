import React from 'react';
import './LanguageSelector.css';

function LanguageSelector({ onSelectLanguage }) {
  return (
    <div className="language-selector-page">
      <div className="language-background"></div>

      <div className="language-container">
        <div className="language-header">
          <span className="language-icon">⚜️</span>
          <h1 className="language-title">AXUM</h1>
          <p className="language-tagline">Queen Makeda's Quest</p>
        </div>

        <div className="language-content">
          <h2 className="selection-title">Choose Your Language</h2>
          <p className="selection-subtitle">ቋንቋዎን ይምረጡ</p>

          <div className="language-options">
            <button
              className="language-option"
              onClick={() => onSelectLanguage('am')}
            >
              <span className="option-flag">🇪🇹</span>
              <div className="option-text">
                <span className="option-name">አማርኛ</span>
                <span className="option-label">Amharic</span>
              </div>
              <span className="option-arrow">→</span>
            </button>

            <button
              className="language-option"
              onClick={() => onSelectLanguage('en')}
            >
              <span className="option-flag">🌍</span>
              <div className="option-text">
                <span className="option-name">English</span>
                <span className="option-label">English</span>
              </div>
              <span className="option-arrow">→</span>
            </button>
          </div>
        </div>

        <div className="language-footer">
          <p>Walk in the footsteps of Queen Makeda</p>
          <p>በንግስት ማክዳ ፈለግ ይራመዱ</p>
        </div>
      </div>

      <div className="language-pattern"></div>
    </div>
  );
}

export default LanguageSelector;
