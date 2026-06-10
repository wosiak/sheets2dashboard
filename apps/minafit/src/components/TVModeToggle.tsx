import React from 'react';

interface TVModeToggleProps {
  isTVMode: boolean;
  onToggle: (isTVMode: boolean) => void;
}

export const TVModeToggle: React.FC<TVModeToggleProps> = ({ isTVMode, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!isTVMode)}
      className={isTVMode ? 'btn-tv-off' : 'btn-tv-on'}
    >
      {isTVMode ? '🖥️ Sair do Modo TV' : '📺 Modo TV'}
    </button>
  );
};
