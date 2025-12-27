import React, { createContext, useState, useContext } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('axum_language');
    return saved === 'en' || saved === 'am' ? saved : null;
  });

  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'am') {
      localStorage.setItem('axum_language', lang);
      setLanguage(lang);
    }
  };

  const t = (key) => {
    if (!language) return key;

    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
