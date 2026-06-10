import React from 'react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      <div className={`theme-toggle-track ${theme === 'light' ? 'is-light' : ''}`}>
        <span className="theme-toggle-icon theme-toggle-moon">🌙</span>
        <span className="theme-toggle-icon theme-toggle-sun">☀️</span>
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  );
};
