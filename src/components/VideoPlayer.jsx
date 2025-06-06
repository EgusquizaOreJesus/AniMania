// src/components/VideoPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import logo2 from '../assets/logo2.png'; // Assuming you have a logo image in your assets
import Controls from './Controls';
import PlayPauseAnimation from './PlayPauseAnimation';


const VideoPlayer = ({ videoUrl, subtitleTracksConfig = [] }) => {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScreenFull, setIsScreenFull] = useState(false); // Renamed

  const [showControls, setShowControls] = useState(true);
  const [isMainLoading, setIsMainLoading] = useState(true);
  const [isQualityLoading, setIsQualityLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: "Error al cargar el video", text: "No se pudo cargar el contenido. Por favor, intenta de nuevo más tarde." });

  const [showSettings, setShowSettings] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 for auto
  const [availableAudioTracks, setAvailableAudioTracks] = useState([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0); // Default or first track
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState(-1); // -1 for off, index for specific track

  const [playPauseAnim, setPlayPauseAnim] = useState({ icon: '', trigger: 0 });


  const createPlayPauseAnimation = useCallback((icon) => {
     setPlayPauseAnim(prev => ({ icon, trigger: prev.trigger + 1 }));
  }, []);


  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(inactivityTimerRef.current);
    if (isPlaying && !showSettings) { // Don't hide if settings are open
      inactivityTimerRef.current = setTimeout(() => {
        //console.log('Timer fired: Hiding controls now'); // <-- Añade esto para depurar
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showSettings]);



useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitleTracksConfig) return; // Añadimos verificación de videoUrl

    const hls = hlsRef.current;

    // Función para actualizar la lista de subtítulos disponibles en la UI
    const updateAvailableSubtitles = () => {
        if (!video || !video.textTracks) return;

        const rawTracks = Array.from(video.textTracks);
        const uniqueUiTracks = [];
        const seenTracks = new Set(); // Para identificar tracks únicos por label y lang

        rawTracks.forEach((track, index) => {
            // Solo procesar tracks de subtítulos o captions
            if (track.kind !== 'subtitles' && track.kind !== 'captions') {
                return;
            }

            const identifier = `${track.label}-${track.language}`;
            if (!seenTracks.has(identifier)) {
                seenTracks.add(identifier);
                uniqueUiTracks.push({
                    label: track.label || `Track ${index + 1}`, // Usar un label genérico si no hay
                    lang: track.language,
                    id: index, // Este 'id' es el índice real en video.textTracks
                    mode: track.mode, // El modo actual real del TextTrack
                });
            }
        });

        setAvailableSubtitleTracks(uniqueUiTracks);

        // Lógica para determinar el subtítulo activo inicial o actual
        // Esta parte es delicada y puede necesitar ajustes según cómo HLS.js establece los tracks por defecto.
        let activeTrackIndexInUiList = -1;

        // 1. Buscar si ya hay un track activo ('showing')
        const currentlyShowingTrackOriginalIndex = rawTracks.findIndex(rt => rt.mode === 'showing' && (rt.kind === 'subtitles' || rt.kind === 'captions'));

        if (currentlyShowingTrackOriginalIndex !== -1) {
            // Encontrar este track en nuestra lista de UI (uniqueUiTracks)
            activeTrackIndexInUiList = uniqueUiTracks.findIndex(uit => uit.id === currentlyShowingTrackOriginalIndex);
        } else {
            // 2. Si no hay ninguno 'showing', buscar el 'default' de nuestra config manual
            const defaultConfigTrack = subtitleTracksConfig.find(conf => conf.default);
            if (defaultConfigTrack) {
                // Encontrar el track correspondiente en la lista de UI
                activeTrackIndexInUiList = uniqueUiTracks.findIndex(uit => uit.label === defaultConfigTrack.label && uit.lang === defaultConfigTrack.srclang);
            }
        }
        
        // Si el currentSubtitleTrack actual ya no es válido o es -1 y encontramos uno activo/default
        if (currentSubtitleTrack === -1 || currentSubtitleTrack >= uniqueUiTracks.length) {
            setCurrentSubtitleTrack(activeTrackIndexInUiList !== -1 ? activeTrackIndexInUiList : -1);
        } else {
            // Si ya había un currentSubtitleTrack válido, verificar si sigue siendo el que está 'showing'
            // y si no, actualizarlo. No, esto lo hará el siguiente useEffect.
            // Aquí solo establecemos el available y el initial si es necesario.
        }
    };

    // Añadir tracks de SUBTITLE_TRACKS_CONFIG si no existen ya
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
        // También se puede verificar si ya existe un elemento <track> con el mismo src.
        // Esta comprobación es menos fiable si HLS.js añade tracks sin src visible en el DOM <track>
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
            // No llamamos a updateAvailableSubtitles() aquí directamente,
            // lo haremos con onaddtrack o un timeout general.
        }
    });

    // Event listeners para actualizar la lista cuando cambien los tracks
    if (video.textTracks) {
        video.textTracks.addEventListener('addtrack', updateAvailableSubtitles);
        video.textTracks.addEventListener('removetrack', updateAvailableSubtitles);
        // 'change' es importante si HLS.js cambia el modo de un track
        video.textTracks.addEventListener('change', updateAvailableSubtitles);
    }

    if (hls) {
        // Estos eventos son cuando HLS.js maneja tracks que no son parte del stream nativo del video
        hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, updateAvailableSubtitles); // Cuando un track se carga
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, updateAvailableSubtitles); // Cuando la lista de tracks de HLS cambia
    }

    // Llamada inicial para poblar la lista, después de un breve delay para que los tracks se registren
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
}, [subtitleTracksConfig]); // Se ejecuta principalmente al montar. Las actualizaciones vienen de los event listeners.

// Este SEGUNDO useEffect se encarga de APLICAR el modo 'showing'/'hidden'
// basado en la selección del usuario (currentSubtitleTrack)
useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks || availableSubtitleTracks.length === 0) {
        // Si no hay video, tracks, o la lista de UI está vacía, desactivar todos (si hay tracks reales)
        if (video && video.textTracks) {
            Array.from(video.textTracks).forEach(track => {
                 if (track.kind === 'subtitles' || track.kind === 'captions') track.mode = 'hidden';
            });
        }
        return;
    }

    // currentSubtitleTrack es el ÍNDICE en la lista `availableSubtitleTracks`
    // `availableSubtitleTracks[currentSubtitleTrack].id` es el ÍNDICE REAL en `video.textTracks`

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

}, [currentSubtitleTrack, availableSubtitleTracks]); // Depende de la selección del usuario y de la lista disponible

  // HLS.js setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')){
          video.src = videoUrl; // Use the videoUrl prop directly
          video.addEventListener('loadedmetadata', () => {
            setIsMainLoading(false);
            // Native HLS might not expose quality/audio track selection easily
            // Consider hiding these options for Safari native HLS
            console.warn("Reproducción HLS nativa. Selección de calidad/audio limitada.");
            setAvailableQualities([]); // Hide quality options
            setAvailableAudioTracks([]); // Hide audio options
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
      hls.loadSource(videoUrl); // Usamos la prop videoUrl
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsMainLoading(false);
        setAvailableQualities(data.levels || []);
        if (data.levels && data.levels.length > 0) setCurrentQuality(hls.currentLevel); // Or -1 for auto by default

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
          // More specific error messages can be set here based on data.type / data.details
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
  }, [videoUrl]);


  // Video Element Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => { setIsPlaying(true); resetInactivityTimer();};
    const handlePause = () => { setIsPlaying(false); clearTimeout(inactivityTimerRef.current); setShowControls(true); };
    const handleEnded = () => { setIsPlaying(false); setShowControls(true); /* Maybe show replay icon */};
    const handleVolumeChange = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleDurationChange); // For initial duration
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
  }, [resetInactivityTimer]);

  // Fullscreen change listener
  useEffect(() => {
     const container = playerContainerRef.current;
     const handleFullscreenChange = () => {
         setIsScreenFull(!!document.fullscreenElement);
         // Update button icon if needed (handled in Controls component based on isScreenFull prop)
     };

     document.addEventListener('fullscreenchange', handleFullscreenChange);
     // For webkit browsers
     document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

     return () => {
         document.removeEventListener('fullscreenchange', handleFullscreenChange);
         document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
     };
 }, []);


  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.isContentEditable)) {
        return;
      }
      resetInactivityTimer(); // Show controls on any relevant key press

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
        // 'KeyC' for subtitles - usually handled by browser default or player UI
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, resetInactivityTimer]); // Add dependencies if functions use state/props from outside

  // Player Actions
  const handlePlayPause = () => {
    if (!videoRef.current) return;
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
    // State updates (volume, isMuted) will be handled by the 'volumechange' event listener on video
    resetInactivityTimer();
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    if (!newMuted && videoRef.current.volume === 0) {
      videoRef.current.volume = 0.1; // Unmute to a low volume if it was 0
    }
    // State updates handled by 'volumechange' listener
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
         } else if (elem.webkitRequestFullscreen) { /* Safari */
             elem.webkitRequestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
         }
     } else {
         if (document.exitFullscreen) {
             document.exitFullscreen();
         } else if (document.webkitExitFullscreen) { /* Safari */
             document.webkitExitFullscreen();
         }
     }
     resetInactivityTimer();
 };


  const handleSettingsToggle = () => {
     setShowSettings(prev => !prev);
     if (!showSettings) { // If opening settings
         clearTimeout(inactivityTimerRef.current); // Keep controls visible
         setShowControls(true);
     } else { // If closing settings
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
             // setCurrentAudioTrack will be updated by HLS event AUDIO_TRACK_SWITCHED
         }
     } else if (type === 'subtitles') {
          setCurrentSubtitleTrack(parseInt(value)); // This will trigger the useEffect to update track modes
     }
     // Settings menu will close itself via its own logic or prop
     // resetInactivityTimer(); // Ensure controls eventually hide
  };


  // Mouse move on player container
  useEffect(() => {
     const container = playerContainerRef.current;
     if (!container) return;

     container.addEventListener('mousemove', resetInactivityTimer);
     container.addEventListener('mouseleave', () => {
         if (isPlaying && !showSettings) { // Only hide if playing and settings are not open
             inactivityTimerRef.current = setTimeout(() => setShowControls(false), 1000);
         }
     });

     return () => {
         container.removeEventListener('mousemove', resetInactivityTimer);
         // eslint-disable-next-line react-hooks/exhaustive-deps
         container.removeEventListener('mouseleave', () => {
              if (isPlaying && !showSettings) {
                 inactivityTimerRef.current = setTimeout(() => setShowControls(false), 1000);
             }
         });
     }
  }, [isPlaying, resetInactivityTimer, showSettings]);


  return (
    <div
      className={`player-container ${isQualityLoading ? 'video-blur' : ''}`}
      id="player-container"
      ref={playerContainerRef}
      onClick={(e) => {
         // Allow clicks on controls without toggling play/pause
         if (e.target.closest('.controls-container') || e.target.closest('.settings-options')) {
             resetInactivityTimer(); // Keep controls visible if interacting with them
             return;
         }
         handlePlayPause();
      }}
    >
      <img src={logo2} alt="Anime Logo" className="player-logo-image" />

      <video id="video-player" ref={videoRef} crossOrigin="anonymous" playsInline webkit-playsinline="true"> 
        {/* Subtitle tracks are now added programmatically in useEffect */}
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
        hideControls={!showControls && isPlaying} // Controls visibility logic
      />
       {/* Shortcuts info can be added here if needed, conditionally rendered */}
       {/* <div className="shortcuts-info">
           <span>Space</span> Play/Pause | <span>F</span> Fullscreen | ...
       </div> */}
    </div>
  );
};

export default VideoPlayer;
