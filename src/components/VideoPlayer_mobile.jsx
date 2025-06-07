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

    const videoElement = videoRef.current;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const options = {
      controls: true,
      fluid: true,
      autoplay: false,
      playsinline: true,
      preload: 'auto',
      sources: [{
        src: videoUrl,
        type: isIOS ? 'application/vnd.apple.mpegURL' : 'application/x-mpegURL'
      }],
      html5: {
        vhs: {
          // Lógica correcta para dispositivos reales:
          // false en iOS (usa nativo), true en Android (usa vjs).
          overrideNative: !isIOS,
        },
        nativeAudioTracks: isIOS,
        nativeVideoTracks: isIOS
      }
    };

    if (subtitleUrl) {
      options.tracks = [{
        kind: 'subtitles',
        src: subtitleUrl,
        srclang: 'es',
        label: 'Español',
        default: true
      }];
    }

    // --- ESTA ES LA CORRECCIÓN ---
    // Se reintroduce un retardo para asegurar que el DOM está listo.
    // Esto soluciona el warning "VJS WARN: The element supplied is not included in the DOM".
    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      playerRef.current = videojs(videoElement, options, function() {
        console.log('Reproductor móvil inicializado correctamente.');
        this.on('error', () => {
          const error = this.error();
          console.error('Error en Video.js:', error);
          if (error && error.code === 4) {
             // Este error puede ocurrir en la emulación de escritorio si se intenta usar el reproductor nativo.
            console.warn('VideoJS: Formato no soportado o problema de CORS. Si emulas iOS en escritorio, esto es esperado.');
          }
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