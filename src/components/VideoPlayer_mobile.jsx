import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import logo2 from '../assets/logo2.png';
import {
  FiPlay,
  FiPause,
  FiMaximize,
  FiMinimize,
  FiRewind,
  FiMessageSquare,
} from 'react-icons/fi';

const VideoPlayerMobile = ({ videoUrl, subtitleTracksConfig = [] }) => {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const tapTimerRef = useRef(null);

  // Estados principales
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estados de UI
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados de configuración
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState(-1);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Gestión de controles táctiles
  const hideControlsTimer = useCallback(() => {
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showSubtitleMenu) {
        setShowControls(false);
      }
    }, 4000);
  }, [isPlaying, showSubtitleMenu]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    hideControlsTimer();
  }, [hideControlsTimer]);

  // Configuración de HLS y video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setShowError(true);
          setErrorMessage('Error al cargar el video');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadeddata', () => setIsLoading(false));
    } else {
      setShowError(true);
      setErrorMessage('Tu navegador no soporta este formato');
      setIsLoading(false);
    }
    return () => hlsRef.current?.destroy();
  }, [videoUrl]);

  // Configuración de subtítulos
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const timer = setTimeout(() => {
        if (video.textTracks.length > 0) {
            const tracks = Array.from(video.textTracks).map((track, index) => ({
                label: track.label || `Subtítulo ${index + 1}`,
                lang: track.language,
                id: index,
            }));
            setAvailableSubtitleTracks(tracks);
            const defaultTrackIndex = subtitleTracksConfig.findIndex(t => t.default);
            if (defaultTrackIndex !== -1 && currentSubtitleTrack === -1) {
                setCurrentSubtitleTrack(defaultTrackIndex);
            }
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [subtitleTracksConfig, currentSubtitleTrack]);

  // Aplicar selección de subtítulos
  useEffect(() => {
    const video = videoRef.current;
    if (!video?.textTracks) return;
    Array.from(video.textTracks).forEach((track, index) => {
      track.mode = currentSubtitleTrack === index ? 'showing' : 'hidden';
    });
  }, [currentSubtitleTrack]);

  // Event listeners del video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => { setIsPlaying(true); hideControlsTimer(); };
    const handlePause = () => { setIsPlaying(false); setShowControls(true); clearTimeout(controlsTimerRef.current); };
    const handleEnded = () => { setIsPlaying(false); setIsFinished(true); setShowControls(true); };
    const handleLoadStart = () => { setIsLoading(true); setIsFinished(false); };
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => { setShowError(true); setErrorMessage('Error al reproducir el video'); setIsLoading(false); };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [hideControlsTimer]);

  // Fullscreen listeners
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Funciones de control
  const handlePlayPause = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (isFinished) {
      video.currentTime = 0;
      setIsFinished(false);
      video.play();
    } else {
      video.paused ? video.play() : video.pause();
    }
    showControlsTemporarily();
  };
  
  const handleSeek = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    if (video && isFinite(duration)) { video.currentTime = seekTime; }
  };
  
  const handleFullscreenToggle = (e) => {
    e.stopPropagation();
    const elem = playerContainerRef.current;
    if (!document.fullscreenElement) {
        elem.requestFullscreen?.().catch(err => console.error(err));
    } else {
        document.exitFullscreen?.();
    }
    showControlsTemporarily();
  };
  
  const handleSubtitleToggle = (e) => {
    e.stopPropagation();
    setShowSubtitleMenu(prev => !prev);
    hideControlsTimer();
  };
  
  const handleSubtitleSelect = (e, trackIndex) => {
    e.stopPropagation();
    setCurrentSubtitleTrack(trackIndex);
    setShowSubtitleMenu(false);
    showControlsTemporarily();
  };
  
  const handleTapToggle = useCallback(() => {
    // Si el menú de subtítulos está abierto, al tocar se cierra
    if (showSubtitleMenu) {
      setShowSubtitleMenu(false);
      showControlsTemporarily();
      return;
    }
    
    // En pantalla completa, al tocar se muestran los controles
    if (isFullscreen) {
      setShowControls(prev => !prev);
      hideControlsTimer();
      return;
    }

    // Para pantalla normal, comportamiento original
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        setShowControls(prev => !prev);
      }, 200);
    }
  }, [showSubtitleMenu, isFullscreen, hideControlsTimer, showControlsTemporarily]);
  
  const formatTime = (time) => {
    if (isNaN(time) || time === 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mobile-player-container" ref={playerContainerRef} onClick={handleTapToggle}>
      <div className="video-wrapper">
        <video 
          ref={videoRef} 
          className="video-element" 
          playsInline 
          webkit-playsinline="true"
          crossOrigin="anonymous"
        >
          {subtitleTracksConfig.map((track) => (
            <track 
              key={track.src} 
              kind="subtitles" 
              label={track.label} 
              srcLang={track.srclang} 
              src={track.src} 
              default={track.default}
            />
          ))}
        </video>
      </div>
      
      <div className={`overlay logo-overlay ${showControls ? 'visible' : ''}`}>
        <img src={logo2} alt="Logo"/>
      </div>
      
      {isLoading && (
        <div className="overlay spinner-overlay">
          <div className="spinner" />
        </div>
      )}
      
      {showError && (
        <div className="overlay error-overlay">
          <div className="error-icon">⚠️</div>
          <div>{errorMessage}</div>
        </div>
      )}
      
      <div 
        className={`overlay controls-overlay ${showControls ? 'visible' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="center-controls">
          {!isLoading && (
            <button className="center-button" onClick={handlePlayPause}>
              {isFinished ? <FiRewind /> : isPlaying ? <FiPause /> : <FiPlay />}
            </button>
          )}
        </div>
        
        <div className="bottom-controls">
          <div className="progress-bar-wrapper" onClick={handleSeek}>
            <div className="progress-bar">
              <div className="progress-bar-bg" />
              <div 
                className="progress-bar-filled" 
                style={{ transform: `scaleX(${(currentTime / duration) || 0})` }} 
              />
              <div 
                className="progress-bar-thumb" 
                style={{ left: `calc(${(currentTime / duration) * 100 || 0}% - 8px)` }}
              />
            </div>
          </div>
          
          <div className="controls-row">
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="spacer" />
            {availableSubtitleTracks.length > 0 && (
              <button 
                className={`icon-button ${currentSubtitleTrack !== -1 ? 'active' : ''}`} 
                onClick={handleSubtitleToggle}
              >
                <FiMessageSquare />
              </button>
            )}
            <button className="icon-button" onClick={handleFullscreenToggle}>
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
          </div>
        </div>
        
        {showSubtitleMenu && (
          <div className="subtitle-menu">
            <ul>
              <li 
                className={currentSubtitleTrack === -1 ? 'active' : ''} 
                onClick={(e) => handleSubtitleSelect(e, -1)}
              >
                Desactivado
              </li>
              {availableSubtitleTracks.map((track, index) => (
                <li 
                  key={index} 
                  className={currentSubtitleTrack === index ? 'active' : ''} 
                  onClick={(e) => handleSubtitleSelect(e, index)}
                >
                  {track.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .mobile-player-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          background-color: #000;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        
        .video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* Fullscreen styles */
        .mobile-player-container:fullscreen {
          padding-top: 0;
          width: 100%;
          height: 100%;
        }
        .mobile-player-container:fullscreen .video-wrapper {
          height: 100vh;
        }
        
        /* Prefixed fullscreen */
        :global(.mobile-player-container:-webkit-full-screen) {
          padding-top: 0;
          width: 100%;
          height: 100%;
        }
        :global(.mobile-player-container:-webkit-full-screen .video-wrapper) {
          height: 100vh;
        }
        :global(.mobile-player-container:-moz-full-screen) {
          padding-top: 0;
          width: 100%;
          height: 100%;
        }
        
        /* --- Overlays --- */
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s ease;
          pointer-events: none;
          opacity: 0;
        }
        .overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        
        .logo-overlay {
          justify-content: flex-start;
          align-items: flex-start;
          padding: 15px;
          z-index: 5;
        }
        .logo-overlay img {
          width: 60px;
        }
        
        .spinner-overlay, .error-overlay {
          background-color: rgba(0, 0, 0, 0.7);
          flex-direction: column;
          z-index: 20;
          pointer-events: auto;
          opacity: 1;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .error-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .controls-overlay {
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.7) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0, 0, 0, 0.4) 100%
          );
          flex-direction: column;
          z-index: 10;
        }
        
        .center-controls {
          flex-grow: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
        }
        
        .center-button {
          background: rgba(30, 30, 30, 0.6);
          border: none;
          color: white;
          border-radius: 50%;
          width: 64px;
          height: 64px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          backdrop-filter: blur(5px);
          transition: transform 0.2s;
          pointer-events: auto;
        }
        
        .center-button:active {
          transform: scale(0.9);
        }
        
        .center-button svg {
          font-size: 36px;
        }
        
        .bottom-controls {
          width: 100%;
          padding: 10px 15px 15px;
          box-sizing: border-box;
        }
        
        .progress-bar-wrapper {
          width: 100%;
          height: 16px;
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 5px;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .progress-bar-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        
        .progress-bar-filled {
          background-color: #3b82f6;
          width: 100%;
          height: 100%;
          border-radius: 2px;
          transform-origin: left;
          position: relative;
          z-index: 1;
        }
        
        .progress-bar-thumb {
          position: absolute;
          width: 16px;
          height: 16px;
          background-color: #fff;
          border-radius: 50%;
          z-index: 2;
          pointer-events: none;
        }
        
        .controls-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .time-display {
          font-size: 13px;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
        }
        
        .spacer {
          flex-grow: 1;
        }
        
        .icon-button {
          background: none;
          border: none;
          color: white;
          padding: 0;
          margin-left: 16px;
          cursor: pointer;
        }
        
        .icon-button svg {
          font-size: 24px;
          filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.7));
        }
        
        .icon-button.active {
          color: #3b82f6;
        }
        
        .subtitle-menu {
          position: absolute;
          bottom: 75px;
          right: 15px;
          background-color: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 8px;
          z-index: 30;
          max-height: 200px;
          overflow-y: auto;
          pointer-events: auto;
        }
        
        .subtitle-menu ul {
          list-style: none;
          padding: 8px;
          margin: 0;
        }
        
        .subtitle-menu li {
          padding: 10px 16px;
          cursor: pointer;
          font-size: 15px;
          white-space: nowrap;
          border-radius: 4px;
        }
        
        .subtitle-menu li:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .subtitle-menu li.active {
          color: #3b82f6;
          font-weight: bold;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayerMobile;