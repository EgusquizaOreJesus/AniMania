// src/components/VideoPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import logo2 from '../assets/logo2.png';
import Controls from './Controls';
import PlayPauseAnimation from './PlayPauseAnimation';

// Función para detectar dispositivos móviles
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const VideoPlayer = ({ videoUrl, subtitleTracksConfig = [] }) => {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScreenFull, setIsScreenFull] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isQualityLoading, setIsQualityLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: "Error al cargar el video", text: "No se pudo cargar el contenido. Por favor, intenta de nuevo más tarde." });

  const [showSettings, setShowSettings] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState(-1);

  const [playPauseAnim, setPlayPauseAnim] = useState({ icon: '', trigger: 0 });

  // Detectar si es dispositivo móvil al montar
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    // Silenciar automáticamente en iOS para permitir reproducción
    if (isMobileDevice() && videoRef.current) {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }, []);

  const createPlayPauseAnimation = useCallback((icon) => {
     setPlayPauseAnim(prev => ({ icon, trigger: prev.trigger + 1 }));
  }, []);

  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(inactivityTimerRef.current);
    
    // No ocultar controles en dispositivos móviles
    if (isPlaying && !showSettings) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showSettings]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitleTracksConfig) return;

    const updateAvailableSubtitles = () => {
        if (!video || !video.textTracks) return;

        const rawTracks = Array.from(video.textTracks);
        const uniqueUiTracks = [];
        const seenTracks = new Set();

        rawTracks.forEach((track, index) => {
            if (track.kind !== 'subtitles' && track.kind !== 'captions') {
                return;
            }

            const identifier = `${track.label}-${track.language}`;
            if (!seenTracks.has(identifier)) {
                seenTracks.add(identifier);
                uniqueUiTracks.push({
                    label: track.label || `Track ${index + 1}`,
                    lang: track.language,
                    id: index,
                    mode: track.mode,
                });
            }
        });

        setAvailableSubtitleTracks(uniqueUiTracks);

        let activeTrackIndexInUiList = -1;
        const currentlyShowingTrackOriginalIndex = rawTracks.findIndex(rt => rt.mode === 'showing' && (rt.kind === 'subtitles' || rt.kind === 'captions'));

        if (currentlyShowingTrackOriginalIndex !== -1) {
            activeTrackIndexInUiList = uniqueUiTracks.findIndex(uit => uit.id === currentlyShowingTrackOriginalIndex);
        } else {
            const defaultConfigTrack = subtitleTracksConfig.find(conf => conf.default);
            if (defaultConfigTrack) {
                activeTrackIndexInUiList = uniqueUiTracks.findIndex(uit => uit.label === defaultConfigTrack.label && uit.lang === defaultConfigTrack.srclang);
            }
        }
        
        if (currentSubtitleTrack === -1 || currentSubtitleTrack >= uniqueUiTracks.length) {
            setCurrentSubtitleTrack(activeTrackIndexInUiList !== -1 ? activeTrackIndexInUiList : -1);
        }
    };

    subtitleTracksConfig.forEach(config => {
        let trackExists = false;
        if (video.textTracks) {
            for (let i = 0; i < video.textTracks.length; i++) {
                const existingTrack = video.textTracks[i];
                if (existingTrack.label === config.label && existingTrack.language === config.srclang) {
                    trackExists = true;
                    break;
                }
            }
        }
        if (video.querySelector(`track[src="${config.src}"]`)) {
            trackExists = true;
        }

        if (!trackExists) {
            const trackElement = document.createElement('track');
            trackElement.kind = 'subtitles';
            trackElement.label = config.label;
            trackElement.srclang = config.srclang;
            trackElement.src = config.src;
            trackElement.default = config.default || false;
            video.appendChild(trackElement);
        }
    });

    if (video.textTracks) {
        video.textTracks.addEventListener('addtrack', updateAvailableSubtitles);
        video.textTracks.addEventListener('removetrack', updateAvailableSubtitles);
        video.textTracks.addEventListener('change', updateAvailableSubtitles);
    }

    const hls = hlsRef.current;
    if (hls) {
        hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, updateAvailableSubtitles);
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, updateAvailableSubtitles);
    }

    const initialLoadTimeoutId = setTimeout(updateAvailableSubtitles, 250);

    return () => {
        clearTimeout(initialLoadTimeoutId);
        if (video.textTracks) {
            video.textTracks.removeEventListener('addtrack', updateAvailableSubtitles);
            video.textTracks.removeEventListener('removetrack', updateAvailableSubtitles);
            video.textTracks.removeEventListener('change', updateAvailableSubtitles);
        }
        if (hls) {
            hls.off(Hls.Events.SUBTITLE_TRACK_LOADED, updateAvailableSubtitles);
            hls.off(Hls.Events.SUBTITLE_TRACKS_UPDATED, updateAvailableSubtitles);
        }
    };
}, [subtitleTracksConfig]);

useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks || availableSubtitleTracks.length === 0) {
        if (video && video.textTracks) {
            Array.from(video.textTracks).forEach(track => {
                 if (track.kind === 'subtitles' || track.kind === 'captions') track.mode = 'hidden';
            });
        }
        return;
    }

    Array.from(video.textTracks).forEach((actualVideoTrack, realIndexInVideo) => {
        if (actualVideoTrack.kind !== 'subtitles' && actualVideoTrack.kind !== 'captions') {
            return;
        }

        let shouldBeShowing = false;
        if (currentSubtitleTrack !== -1 && availableSubtitleTracks[currentSubtitleTrack]) {
            if (availableSubtitleTracks[currentSubtitleTrack].id === realIndexInVideo) {
                shouldBeShowing = true;
            }
        }
        actualVideoTrack.mode = shouldBeShowing ? 'showing' : 'hidden';
    });

}, [currentSubtitleTrack, availableSubtitleTracks]);

  // HLS.js setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    // Configuración específica para móviles
    if (isMobile) {
      video.style.objectFit = 'contain';
      video.style.width = '100%';
      video.style.height = 'auto';
      video.style.maxHeight = '100vh';
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')){
          video.src = videoUrl;
          video.addEventListener('loadedmetadata', () => {
            setIsMainLoading(false);
            console.warn("Reproducción HLS nativa. Selección de calidad/audio limitada.");
            setAvailableQualities([]);
            setAvailableAudioTracks([]);
          });
          video.addEventListener('error', () => {
            setShowError(true);
            setIsMainLoading(false);
          });
    }
    else if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsMainLoading(false);
        setAvailableQualities(data.levels || []);
        if (data.levels && data.levels.length > 0) setCurrentQuality(hls.currentLevel);

        setAvailableAudioTracks(hls.audioTracks || []);
        if (hls.audioTracks && hls.audioTracks.length > 0) setCurrentAudioTrack(hls.audioTrack);
      });

      let wasPlayingBeforeQualitySwitch = false;
      hls.on(Hls.Events.LEVEL_SWITCHING, () => {
        wasPlayingBeforeQualitySwitch = !video.paused;
        if (wasPlayingBeforeQualitySwitch) video.pause();
        setIsQualityLoading(true);
        playerContainerRef.current.classList.add('video-blur');
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        setTimeout(() => {
         setIsQualityLoading(false);
         playerContainerRef.current.classList.remove('video-blur');
         if (wasPlayingBeforeQualitySwitch) video.play();
        }, 500)
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
         setAvailableAudioTracks(hls.audioTracks || []);
         setCurrentAudioTrack(hls.audioTrack);
      });
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
         setCurrentAudioTrack(data.id);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setShowError(true);
          setIsMainLoading(false);
          setIsQualityLoading(false);
        }
      });

    } else {
      setShowError(true);
      setIsMainLoading(false);
      setErrorMessage({title: "Error de compatibilidad", text: "Su navegador no soporta la reproducción de video HLS."})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      clearTimeout(inactivityTimerRef.current);
    };
  }, [videoUrl, isMobile]);

  // Video Element Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => { 
      setIsPlaying(true); 
      resetInactivityTimer();
      // Forzar silencio solo en iOS para primera reproducción
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !isMuted) {
        video.muted = true;
        setIsMuted(true);
      }
    };
    const handlePause = () => { 
      setIsPlaying(false); 
      clearTimeout(inactivityTimerRef.current); 
      setShowControls(true); 
    };
    const handleEnded = () => { setIsPlaying(false); setShowControls(true); };
    const handleVolumeChange = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [resetInactivityTimer, isMuted]);

  // Fullscreen change listener
  useEffect(() => {
     const container = playerContainerRef.current;
     const handleFullscreenChange = () => {
         setIsScreenFull(!!document.fullscreenElement);
     };

     document.addEventListener('fullscreenchange', handleFullscreenChange);
     document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

     return () => {
         document.removeEventListener('fullscreenchange', handleFullscreenChange);
         document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
     };
 }, []);

  // Keyboard Shortcuts (solo en escritorio)
  useEffect(() => {
    if (isMobile) return; // No aplicar atajos de teclado en móviles

    const handleKeyDown = (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.isContentEditable)) {
        return;
      }
      resetInactivityTimer();

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'KeyF':
          e.preventDefault();
          handleFullscreenToggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleRewind();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          handleMuteToggle();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, resetInactivityTimer, isMobile]);

  // Player Actions
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    // Comportamiento especial para iOS
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error("iOS play error:", err);
          // Mostrar mensaje de ayuda si falla
          setErrorMessage({
            title: "Error en iOS",
            text: "Por favor toque la pantalla para iniciar la reproducción"
          });
          setShowError(true);
        });
        createPlayPauseAnimation('pause');
      } else {
        videoRef.current.pause();
        createPlayPauseAnimation('play');
      }
    } else {
      // Comportamiento normal para otros dispositivos
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setShowError(true);
        });
        createPlayPauseAnimation('pause');
      } else {
        videoRef.current.pause();
        createPlayPauseAnimation('play');
      }
    }
    
    resetInactivityTimer();
  };

  const handleRewind = () => {
    if (!videoRef.current || isNaN(videoRef.current.duration)) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    createPlayPauseAnimation('backward');
    resetInactivityTimer();
  };

  const handleForward = () => {
    if (!videoRef.current || isNaN(videoRef.current.duration)) return;
    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
    createPlayPauseAnimation('forward');
    resetInactivityTimer();
  };

  const handleVolumeChange = (newVolume) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    resetInactivityTimer();
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    if (!newMuted && videoRef.current.volume === 0) {
      videoRef.current.volume = 0.1;
    }
    resetInactivityTimer();
  };

  const handleSeek = (time) => {
    if (!videoRef.current || isNaN(videoRef.current.duration)) return;
    videoRef.current.currentTime = time;
    resetInactivityTimer();
  };

  const handleFullscreenToggle = () => {
     const elem = playerContainerRef.current;
     if (!elem) return;

     if (!document.fullscreenElement && !document.webkitFullscreenElement) {
         if (elem.requestFullscreen) {
             elem.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
         } else if (elem.webkitRequestFullscreen) {
             elem.webkitRequestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
         }
     } else {
         if (document.exitFullscreen) {
             document.exitFullscreen();
         } else if (document.webkitExitFullscreen) {
             document.webkitExitFullscreen();
         }
     }
     resetInactivityTimer();
 };

  const handleSettingsToggle = () => {
     setShowSettings(prev => !prev);
     if (!showSettings) {
         clearTimeout(inactivityTimerRef.current);
         setShowControls(true);
     } else {
         resetInactivityTimer();
     }
 };

  const handleSettingChange = (type, value) => {
     if (type === 'quality') {
         if (hlsRef.current) {
             hlsRef.current.currentLevel = value === 'auto' ? -1 : parseInt(value);
             setCurrentQuality(hlsRef.current.currentLevel);
         }
     } else if (type === 'audio') {
         if (hlsRef.current) {
             hlsRef.current.audioTrack = parseInt(value);
         }
     } else if (type === 'subtitles') {
          setCurrentSubtitleTrack(parseInt(value));
     }
  };

  // Eventos de ratón y táctiles
  useEffect(() => {
     const container = playerContainerRef.current;
     if (!container) return;

     const handleTouchMove = () => resetInactivityTimer();
     const handleTouchEnd = () => {
        if (isPlaying && !showSettings) {
          inactivityTimerRef.current = setTimeout(() => setShowControls(false), 2000);
        }
     };

     container.addEventListener('mousemove', resetInactivityTimer);
     container.addEventListener('touchmove', handleTouchMove);
     container.addEventListener('touchend', handleTouchEnd);

     return () => {
         container.removeEventListener('mousemove', resetInactivityTimer);
         container.removeEventListener('touchmove', handleTouchMove);
         container.removeEventListener('touchend', handleTouchEnd);
     };
  }, [isPlaying, resetInactivityTimer, showSettings]);

  return (
    <div
      className={`player-container ${isQualityLoading ? 'video-blur' : ''} ${isMobile ? 'mobile' : ''}`}
      id="player-container"
      ref={playerContainerRef}
      onClick={(e) => {
         if (e.target.closest('.controls-container') || e.target.closest('.settings-options')) {
             resetInactivityTimer();
             return;
         }
         
         // Comportamiento especial para iOS
         if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
           if (!isPlaying) {
             handlePlayPause();
           }
         } else {
           handlePlayPause();
         }
      }}
    >
      <img src={logo2} alt="Anime Logo" className="player-logo-image" />

      <video 
        id="video-player" 
        ref={videoRef} 
        crossOrigin="anonymous" 
        playsInline 
        webkit-playsinline="true"
        muted={isMobile} // Silenciado por defecto en móviles
      >
        {/* Subtítulos se añaden programáticamente */}
      </video>

      {isMainLoading && (
        <div className="loading" id="main-loading">
          <div className="loading-spinner"></div>
          <div>Cargando contenido premium...</div>
        </div>
      )}

      {isQualityLoading && (
        <div className="loading quality-loading" id="quality-loading">
          <div className="loading-spinner"></div>
          <div>Cambiando calidad...</div>
        </div>
      )}

      {showError && (
        <div className="error-message show" id="error-message">
          <i className="fas fa-exclamation-triangle fa-2x" style={{ marginBottom: '15px' }}></i>
          <h2 style={{ marginBottom: '10px' }}>{errorMessage.title}</h2>
          <p>{errorMessage.text}</p>
        </div>
      )}

      <PlayPauseAnimation icon={playPauseAnim.icon} trigger={playPauseAnim.trigger} />

      {/* Mensaje para iOS */}
      {/iPhone|iPad|iPod/i.test(navigator.userAgent) && !isPlaying && !showError && (
        <div className="ios-play-help">
          <p>Toque la pantalla para comenzar la reproducción</p>
        </div>
      )}

      <Controls
        videoRef={videoRef}
        playerContainerRef={playerContainerRef}
        hls={hlsRef.current}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onForward={handleForward}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onMuteToggle={handleMuteToggle}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isScreenFull={isScreenFull}
        onFullscreenToggle={handleFullscreenToggle}
        showSettings={showSettings}
        onSettingsToggle={handleSettingsToggle}
        onSettingChange={handleSettingChange}
        currentQuality={currentQuality}
        currentAudioTrack={currentAudioTrack}
        currentSubtitleTrack={currentSubtitleTrack}
        availableQualities={availableQualities}
        availableAudioTracks={availableAudioTracks}
        availableSubtitleTracks={availableSubtitleTracks}
        hideControls={!showControls && isPlaying && !isMobile} // Siempre mostrar controles en móvil
        isMobile={isMobile}
      />
    </div>
  );
};

export default VideoPlayer;
