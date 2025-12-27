import React, { createContext, useState, useContext, useEffect } from 'react';
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
    // Initialize from localStorage on first render
    const saved = localStorage.getItem('axum_language');
    if (saved === 'en' || saved === 'am') {
      return saved;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const changeLanguage = (lang) => {
    console.log('🌍 Changing language to:', lang);
    if (lang === 'en' || lang === 'am') {
      localStorage.setItem('axum_language', lang);
      setLanguage(lang);
      console.log('✅ Language changed to:', lang);
    }
  };

  const t = (key) => {
    if (!language) return '';
    
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};
