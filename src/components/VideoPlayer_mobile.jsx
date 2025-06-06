// src/components/VideoPlayerMobile.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import './VideoPlayerMobile.css';

const VideoPlayerMobile = ({ videoUrl, subtitleTracksConfig }) => {
  const [showSubtitleSelector, setShowSubtitleSelector] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const playerRef = useRef(null);
  
  const hasSubtitles = subtitleTracksConfig.length > 0;

  useEffect(() => {
    if (!hasSubtitles) {
      setPlaying(true);
    }
  }, [hasSubtitles]);

  const handleSubtitleSelect = (track) => {
    setSelectedSubtitle(track);
    setShowSubtitleSelector(false);
    setPlaying(true);
  };

  const handleNoSubtitle = () => {
    setSelectedSubtitle(null);
    setShowSubtitleSelector(false);
    setPlaying(true);
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
    setShowControls(true);
    // Ocultar controles después de 3 segundos
    setTimeout(() => setShowControls(false), 3000);
  };

  const handleProgress = (state) => {
    setProgress(state.played);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleSeek = (e) => {
    const seekPosition = parseFloat(e.target.value);
    setProgress(seekPosition);
    playerRef.current.seekTo(seekPosition);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const subtitleConfig = selectedSubtitle
    ? [{
        kind: 'subtitles',
        src: selectedSubtitle.src,
        srcLang: selectedSubtitle.srclang,
        label: selectedSubtitle.label,
        default: true,
      }]
    : [];

  return (
    <div className="mobile-player-container">
      {showSubtitleSelector && (
        <div className="subtitle-modal">
          <div className="modal-content">
            <h3>Seleccionar subtítulos</h3>
            <div className="subtitle-options">
              {subtitleTracksConfig.map((track) => (
                <button
                  key={track.src}
                  className="subtitle-option"
                  onClick={() => handleSubtitleSelect(track)}
                >
                  {track.label}
                </button>
              ))}
              <button
                className="subtitle-option no-subtitle"
                onClick={handleNoSubtitle}
              >
                Sin subtítulos
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="video-wrapper" onClick={() => setShowControls(!showControls)}>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          width="100%"
          height="100%"
          playsinline
          onProgress={handleProgress}
          onDuration={handleDuration}
          config={{
            file: {
              attributes: {
                crossOrigin: 'anonymous'
              },
              tracks: subtitleConfig
            }
          }}
        />
        
        {!playing && (
          <button className="play-button" onClick={handlePlayPause}>
            ▶
          </button>
        )}
        
        {(showControls || !playing) && (
          <div className="video-controls">
            <button className="control-button" onClick={handlePlayPause}>
              {playing ? '⏸' : '▶'}
            </button>
            
            <div className="progress-container">
              <span className="time-display">{formatTime(progress * duration)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={progress}
                onChange={handleSeek}
                className="progress-bar"
              />
              <span className="time-display">{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerMobile;