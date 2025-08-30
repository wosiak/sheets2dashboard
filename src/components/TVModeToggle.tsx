import React from 'react';

interface TVModeToggleProps {
  isTVMode: boolean;
  onToggle: (isTVMode: boolean) => void;
}

export const TVModeToggle: React.FC<TVModeToggleProps> = ({ isTVMode, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!isTVMode)}
      className={`px-4 py-2 rounded-md shadow-lg transition-colors ${
        isTVMode
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-purple-500 text-white hover:bg-purple-600'
      }`}
    >
      {isTVMode ? '🖥️ Sair do Modo TV' : '📺 Modo TV'}
    </button>
  );
};
