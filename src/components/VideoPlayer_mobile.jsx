// src/components/VideoPlayer_mobile.jsx
import React from 'react';
import ReactPlayer from 'react-player/lazy'; // Usamos lazy load para optimizar

const VideoPlayerMobile = ({ videoUrl }) => {
  console.log("Video URL:", videoUrl); // Para depuración, puedes eliminarlo después
  return (
    <div className="player-wrapper">
      <ReactPlayer
        className="react-player"
        url={videoUrl}
        width="100%"
        height="100%"
        // --- Controles ---
        controls={true} // ¡Importante! Usa los controles nativos/optimizados de la librería
        
        // --- Comportamiento de Reproducción ---
        playing={false} // Para móviles, es mejor empezar en pausa y que el usuario pulse play
        playsinline={true} // Esencial para iOS, para que no se ponga en pantalla completa solo

        // --- Configuración avanzada (maneja HLS automáticamente) ---
        config={{
          file: {
            attributes: {
              crossOrigin: 'anonymous'
            },
            forceHLS: true // Puedes forzar el uso de hls.js si es necesario, pero usualmente no hace falta
          }
        }}
      />
    </div>
  );
};

// CSS básico para que el reproductor ocupe su contenedor
const styles = `
.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9; /* Mantiene la proporción 16:9 */
  background-color: #000;
}

.react-player {
  position: absolute;
  top: 0;
  left: 0;
}
`;

// Inyectamos los estilos en el head del documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default VideoPlayerMobile;