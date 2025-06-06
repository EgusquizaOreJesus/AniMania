import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manejar cambio de orientación
  useEffect(() => {
    const handleOrientationChange = () => {
      if (!playerRef.current) return;
      
      // Forzar pantalla completa al rotar a horizontal
      if (window.orientation === 90 || window.orientation === -90) {
        if (!document.fullscreenElement) {
          playerRef.current.fullscreen.enter();
        }
      } else {
        if (document.fullscreenElement) {
          playerRef.current.fullscreen.exit();
        }
      }
    };

    // Escuchar eventos de orientación y pantalla completa
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', () => {
      setIsFullscreen(!!document.fullscreenElement);
    });

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', () => {});
    };
  }, []);

  useEffect(() => {
    const loadScripts = () => {
      return new Promise((resolve) => {
        if (!window.Hls || !window.Plyr) {
          const hlsScript = document.createElement('script');
          hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          hlsScript.onload = resolve;
          document.body.appendChild(hlsScript);

          const plyrScript = document.createElement('script');
          plyrScript.src = 'https://cdn.plyr.io/3.7.8/plyr.js';
          document.body.appendChild(plyrScript);

          const plyrStyle = document.createElement('link');
          plyrStyle.rel = 'stylesheet';
          plyrStyle.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
          document.head.appendChild(plyrStyle);
        } else {
          resolve();
        }
      });
    };

    const initializePlayer = async () => {
      await loadScripts();
      
      const source = 'https://mianimecdn.b-cdn.net/Dekoboko/episodio-10/master.m3u8';
      const video = videoRef.current;

      if (window.Hls.isSupported()) {
        const hls = new window.Hls();
        hlsRef.current = hls;
        
        hls.loadSource(source);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          const availableQualities = hls.levels.map(level => level.height);
          
          const player = new window.Plyr(video, {
            controls: [
              'play-large', 'restart', 'rewind', 'play', 'fast-forward',
              'progress', 'current-time', 'duration', 'mute', 'volume',
              'captions', 'settings', 'pip', 'airplay', 'download', 'fullscreen'
            ],
            quality: {
              default: availableQualities[0],
              options: availableQualities,
              forced: true,
              onChange: (quality) => updateQuality(quality, hls)
            },
            fullscreen: {
              iosNative: true,  // Habilitar pantalla completa nativa en iOS
              container: isFullscreen ? null : undefined
            }
          });

          playerRef.current = player;
          
          // Manejar pantalla completa manualmente en iOS
          player.on('enterfullscreen', () => setIsFullscreen(true));
          player.on('exitfullscreen', () => setIsFullscreen(false));
        });
      }
    };

    const updateQuality = (quality, hls) => {
      hls.levels.forEach((level, index) => {
        if (level.height === quality) {
          hls.currentLevel = index;
        }
      });
    };

    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [isFullscreen]);

  return (
    <div style={{
      height: isFullscreen ? '100vh' : '400px',
      width: '100%',
      maxWidth: '100%',
      margin: '0 auto',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <video 
        ref={videoRef} 
        controls 
        crossOrigin="anonymous"
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      >
        <track
          kind="captions"
          label="Español"
          srcLang="es"
          src="https://mianimecdn.b-cdn.net/Dekoboko/episodio-10/sub_spa_es.vtt"
          default
        />
        <track
          kind="captions"
          label="English"
          srcLang="en"
          src="https://mianimecdn.b-cdn.net/Dekoboko/episodio-10/sub_eng.vtt"
        />
      </video>
    </div>
  );
};

export default VideoPlayer;