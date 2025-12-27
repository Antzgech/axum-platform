import React from 'react';
import './LoadingPage.css';
import { useLanguage } from '../i18n/LanguageContext';

function LoadingPage() {
  const { t } = useLanguage();

  return (
    <div className="loading-screen">
      <div className="loading-icon">⚜️</div>
      <p className="loading-text">{t('loading.preparing')}</p>
    </div>
  );
}

export default LoadingPage;
