import React from 'react';
import './LanguageSelector.css';

function LanguageSelector({ setLanguage }) {
  const chooseLanguage = (lang) => {
    localStorage.setItem('axum_lang', lang);
    setLanguage(lang);
  };

  return (
    <div className="language-selector">
      <h1>Choose Your Language</h1>
      <button onClick={() => chooseLanguage('en')} className="lang-btn">English 🇬🇧</button>
      <button onClick={() => chooseLanguage('am')} className="lang-btn">አማርኛ 🇪🇹</button>
    </div>
  );
}

export default LanguageSelector;
