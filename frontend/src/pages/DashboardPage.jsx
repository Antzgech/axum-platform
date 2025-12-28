// src/components/ImageTest.jsx
import React from 'react';
import queenMakeda from '../assets/queen-makeda.png';

export default function ImageTest() {
  return (
    <div style={{ padding: 20, background: '#0b0710', color: '#fff' }}>
      <h3 style={{ marginBottom: 12 }}>Image Test</h3>
      <img
        src={queenMakeda}
        alt="Queen Makeda"
        style={{ maxWidth: 320, width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}
