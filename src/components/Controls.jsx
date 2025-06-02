// src/components/Controls.jsx
import React, { useState, useEffect, useRef } from 'react';
import SettingsMenu from './SettingsMenu';

const Controls = ({
  videoRef,
  playerContainerRef,
  hls,
  isPlaying,
  onPlayPause,
  onRewind,
  onForward,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  currentTime,
  duration,
  onSeek,
  isScreenFull, // Renamed from isFullscreen for clarity
  onFullscreenToggle,
  // Settings related props
  showSettings,
  onSettingsToggle,
  onSettingChange,
  currentQuality,
  currentAudioTrack,
  currentSubtitleTrack, // Added
  availableQualities,
  availableAudioTracks,
  availableSubtitleTracks, // Added
  hideControls // boolean to control visibility
}) => {

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

  const handleProgressClick = (e) => {
    const progressContainer = e.currentTarget;
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(percent * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`controls-container ${hideControls ? 'hide-controls' : ''}`}>
      <div className="progress-container" onClick={handleProgressClick}>
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="controls">
        <div className="left-controls">
          <button className="control-btn" id="play-pause-btn" onClick={onPlayPause}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button className="control-btn" id="rewind-btn" onClick={onRewind}>
            <i className="fas fa-backward"></i>
          </button>
          <button className="control-btn" id="forward-btn" onClick={onForward}>
            <i className="fas fa-forward"></i>
          </button>
          <div className="volume-container">
            <button className="control-btn" id="volume-btn" onClick={onMuteToggle}>
              <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
            </button>
            <input
              type="range"
              className="volume-slider"
              id="volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            />
          </div>
          <div className="time-display">
            <span id="current-time">{formatTime(currentTime)}</span> / <span id="total-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="right-controls">
          <div className="settings-container" id="settings-container">
            <button className="settings-btn" id="settings-btn" onClick={onSettingsToggle}>
              <i className="fas fa-cog"></i>
            </button>
            <SettingsMenu
              hls={hls}
              videoElement={videoRef.current}
              show={showSettings}
              onClose={onSettingsToggle} // Or a dedicated close function
              onSettingChange={onSettingChange}
              currentQuality={currentQuality}
              currentAudioTrack={currentAudioTrack}
              currentSubtitleTrack={currentSubtitleTrack}
              availableQualities={availableQualities}
              availableAudioTracks={availableAudioTracks}
              availableSubtitleTracks={availableSubtitleTracks}
            />
          </div>
          <button className="control-btn" id="fullscreen-btn" onClick={onFullscreenToggle}>
            <i className={`fas ${isScreenFull ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;