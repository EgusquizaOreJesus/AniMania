// src/components/SettingsMenu.jsx
import React, { useState, useEffect, useRef } from 'react';

const SettingsMenu = ({
  hls,
  videoElement, // Pass the video element for subtitle tracks
  show,
  onClose,
  onSettingChange,
  currentQuality,
  currentAudioTrack,
  currentSubtitleTrack,
  availableQualities,
  availableAudioTracks,
  availableSubtitleTracks // This will be derived from videoElement.textTracks
}) => {
  const [expandedSection, setExpandedSection] = useState(null); // 'quality', 'audio', 'subtitles'
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleOptionClick = (type, value) => {
    onSettingChange(type, value);
    setExpandedSection(null); // Close section
    onClose(); // Close menu
  };

  const getLanguageName = (langCode) => {
     if (!langCode) return 'Desconocido';
     try {
         // Use 'en' as a fallback for DisplayNames if 'es' is not fully supported or for broader coverage
         const displayName = new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode);
         return displayName.charAt(0).toUpperCase() + displayName.slice(1); // Capitalize
     } catch (e) {
         const langMap = { 'es': 'Español', 'en': 'English', 'ja': 'Japonés', 'fr': 'Francés', 'de': 'Alemán', 'und': 'Indefinido' };
         return langMap[langCode.toLowerCase()] || langCode;
     }
 };


  return (
    <div className={`settings-options ${show ? 'show' : ''}`} id="settings-options" ref={menuRef}>
      {/* Quality Section */}
      {availableQualities && availableQualities.length > 1 && (
         <div className="settings-section">
             <div
             className={`settings-section-title ${expandedSection === 'quality' ? 'expanded' : ''}`}
             onClick={() => toggleSection('quality')}
             >
             Calidad <i className="fas fa-chevron-right"></i>
             </div>
             <div className={`settings-options-container ${expandedSection === 'quality' ? 'show' : ''}`}>
             <div
                 className={`settings-option ${currentQuality === -1 ? 'selected' : ''}`}
                 onClick={() => handleOptionClick('quality', 'auto')}
             >
                 <i className="fas fa-check"></i> Auto
             </div>
             {availableQualities.map((level, index) => (
                 <div
                 key={index}
                 className={`settings-option ${currentQuality === index ? 'selected' : ''}`}
                 onClick={() => handleOptionClick('quality', index)}
                 >
                 <i className="fas fa-check"></i> {level.height}p
                 </div>
             ))}
             </div>
         </div>
      )}

      {/* Audio Section */}
      {availableAudioTracks && availableAudioTracks.length > 0 && (
         <div className="settings-section">
             <div
             className={`settings-section-title ${expandedSection === 'audio' ? 'expanded' : ''}`}
             onClick={() => toggleSection('audio')}
             >
             Audio <i className="fas fa-chevron-right"></i>
             </div>
             <div className={`settings-options-container ${expandedSection === 'audio' ? 'show' : ''}`}>
             {availableAudioTracks.map((track) => (
                 <div
                 key={track.id}
                 className={`settings-option ${currentAudioTrack === track.id ? 'selected' : ''}`}
                 onClick={() => handleOptionClick('audio', track.id)}
                 >
                 <i className="fas fa-check"></i> {track.name || getLanguageName(track.lang) || `Pista ${track.id + 1}`}
                 </div>
             ))}
             </div>
         </div>
      )}

      {/* Subtitles Section */}
      {availableSubtitleTracks && ( /* Always show subtitles option, even if only "Desactivados" */
         <div className="settings-section">
             <div
             className={`settings-section-title ${expandedSection === 'subtitles' ? 'expanded' : ''}`}
             onClick={() => toggleSection('subtitles')}
             >
             Subtítulos <i className="fas fa-chevron-right"></i>
             </div>
             <div className={`settings-options-container ${expandedSection === 'subtitles' ? 'show' : ''}`}>
             <div
                 className={`settings-option ${currentSubtitleTrack === -1 ? 'selected' : ''}`}
                 onClick={() => handleOptionClick('subtitles', -1)}
             >
                 <i className="fas fa-check"></i> Desactivados
             </div>
             {availableSubtitleTracks.map((track, index) => (
                 <div
                 key={index}
                 className={`settings-option ${currentSubtitleTrack === index ? 'selected' : ''}`}
                 onClick={() => handleOptionClick('subtitles', index)}
                 >
                 <i className="fas fa-check"></i> {track.label || `Subtítulo ${index + 1}`}
                 </div>
             ))}
             </div>
         </div>
       )}
    </div>
  );
};

export default SettingsMenu;