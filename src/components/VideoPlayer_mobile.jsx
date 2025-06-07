import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayerMobile = ({ videoUrl, subtitleUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Verificar que el componente está montado
    if (!containerRef.current || !videoRef.current) return;

    const initPlayer = () => {
      // Destruir player existente si hay uno
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Configuración básica
      const options = {
        controls: true,
        fluid: true,
        autoplay: false, // Desactivar autoplay para iOS
        playsinline: true, // Importante para iOS
        preload: 'auto',
        sources: [{
          src: videoUrl,
          type: isIOS ? 'application/vnd.apple.mpegURL' : 'application/x-mpegURL'
        }],
        html5: {
          vhs: {
            overrideNative: isIOS,
            enableLowInitialPlaylist: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        }
      };

      // Añadir subtítulos si están disponibles
      if (subtitleUrl) {
        options.tracks = [{
          kind: 'subtitles',
          src: subtitleUrl,
          srcLang: 'es',
          label: 'Español',
          default: true
        }];
      }

      // Inicializar el reproductor
      playerRef.current = videojs(videoRef.current, options, function() {
        console.log('Reproductor inicializado correctamente');
        
        // Manejar errores
        this.on('error', () => {
          const error = this.error();
          console.error('VideoJS Error:', error);
          if (error && error.code === 4) {
            console.warn('Posible problema de CORS o formato no soportado');
          }
        });
      });
    };

    // Esperar a que el elemento esté completamente en el DOM
    const timer = setTimeout(initPlayer, 100);
    
    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [videoUrl, subtitleUrl]);

  return (
    <div ref={containerRef} data-vjs-player style={{ width: '100%', aspectRatio: '16/9' }}>
      <video 
        ref={videoRef} 
        className="video-js vjs-default-skin"
        playsInline
        webkit-playsinline="true"
      />
    </div>
  );
};

export default VideoPlayerMobile;