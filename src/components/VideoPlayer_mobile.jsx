import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayerMobile = ({ videoUrl, subtitleUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    // --- CONFIGURACIÓN SIMPLIFICADA ---
    // Eliminamos por completo el bloque "html5".
    // Dejamos que video.js se encargue de la compatibilidad nativa.
    // Esta es la forma más robusta de hacerlo.
    const options = {
      controls: true,
      fluid: true,
      autoplay: false,
      playsinline: true,
      preload: 'auto',
      sources: [{
        src: videoUrl,
        // Usamos el tipo más estándar para HLS, compatible con todos.
        type: 'application/x-mpegURL'
      }]
    };

    // Añadimos subtítulos si están disponibles
    if (subtitleUrl) {
      options.tracks = [{
        kind: 'subtitles',
        src: subtitleUrl,
        srclang: 'es',
        label: 'Español',
        default: true
      }];
    }

    // Mantenemos el mismo método de inicialización que funcionaba antes.
    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      playerRef.current = videojs(videoRef.current, options, function() {
        console.log('Reproductor inicializado con configuración simple.');
        this.on('error', () => {
          const error = this.error();
          console.error('Error en Video.js:', error);
        });
      });
    };
    
    const timer = setTimeout(initPlayer, 100);

    // Función de limpieza
    return () => {
      clearTimeout(timer);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl, subtitleUrl]);

  return (
    <div data-vjs-player style={{ width: '100%', aspectRatio: '16/9' }}>
      <video 
        ref={videoRef} 
        className="video-js vjs-default-skin"
        playsInline
      />
    </div>
  );
};

export default VideoPlayerMobile;