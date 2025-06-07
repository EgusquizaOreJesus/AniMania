// src/components/VideoPlayer_ios.jsx

import React from 'react';
// Importamos ReactPlayer, que ahora usaremos para iOS.
import ReactPlayer from 'react-player/lazy';

const VideoPlayerIOS = ({ videoUrl, subtitleUrl }) => {

  // Configuración para que ReactPlayer pueda manejar los subtítulos.
  const playerConfig = {
    file: {
      attributes: {
        // Atributo importante para la compatibilidad con subtítulos y CORS.
        crossOrigin: 'anonymous',
      },
      tracks: subtitleUrl ? [
        {
          kind: 'subtitles',
          src: subtitleUrl,
          srcLang: 'es',
          default: true,
          label: 'Español'
        }
      ] : []
    }
  };

  return (
    // Este div contenedor ayuda a mantener la proporción 16:9.
    <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: 'black' }}>
      <ReactPlayer
        // Estilos para que el reproductor se ajuste al div contenedor.
        style={{ position: 'absolute', top: 0, left: 0 }}
        url={videoUrl}
        config={playerConfig}
        
        // --- Opciones Clave para iOS ---
        playsinline={true}   // Esencial para evitar la pantalla completa automática.
        controls={true}      // Muestra los controles nativos.
        width='100%'
        height='100%'

        // Añadimos un manejador de errores para poder depurar si algo falla.
        onError={e => console.error('Error de ReactPlayer en iOS:', e, 'URL:', videoUrl)}
      />
    </div>
  );
};

export default VideoPlayerIOS;