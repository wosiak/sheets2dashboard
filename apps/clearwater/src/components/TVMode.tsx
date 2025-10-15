import React, { useEffect, useState } from 'react';

interface TVModeProps {
  children: React.ReactNode;
}

export const TVMode: React.FC<TVModeProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Detecta se está em modo tela cheia
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Auto-refresh para TV
    const interval = setInterval(() => {
      if (isFullscreen) {
        window.location.reload();
      }
    }, 5 * 60 * 1000); // Recarrega a cada 5 minutos em modo TV

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(interval);
    };
  }, [isFullscreen]);

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <div className="tv-mode">
      {/* Botão de controle para TV */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-600 transition-colors"
        >
          {isFullscreen ? 'Sair da TV' : 'Modo TV'}
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className={isFullscreen ? 'tv-content' : ''}>
        {children}
      </div>
    </div>
  );
};
