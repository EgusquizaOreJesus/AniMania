import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayerMobile = ({ videoUrl, subtitleTracksConfig }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const subtitles = subtitleTracksConfig[0].src; // Asumiendo que siempre hay al menos un track de subtítulos
  useEffect(() => {
  let mounted = true;

  if (videoRef.current && !playerRef.current) {
    // Esperar al siguiente ciclo de render
    requestAnimationFrame(() => {
      if (!mounted) return;

      playerRef.current = videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        sources: [
          {
            src: videoUrl,
            type: 'application/x-mpegURL',
          },
        ],
        tracks: [
          {
            kind: 'subtitles',
            src: subtitles,
            srcLang: 'es',
            label: 'Español',
            default: true,
          },
        ],
      });
    });
  }

  return () => {
    mounted = false;
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };
}, [videoUrl, subtitles]);
  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-default-skin" playsInline />
    </div>
  );
};

export default VideoPlayerMobile;
