import React, { useEffect, useRef } from 'react';

const VideoPlayerMobile = () => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // Cargar scripts dinámicamente si no están disponibles
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
            }
          });

          playerRef.current = player;
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

    // Limpieza al desmontar
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ height: '400px', maxWidth: '100%', margin: '0 auto' }}>
      <video 
        ref={videoRef} 
        controls 
        crossOrigin="anonymous"
        playsInline
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

export default VideoPlayerMobile;