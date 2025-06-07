// SubtitlesSelector.jsx
import React, { useState } from 'react';
import VideoPlayerMobile from './VideoPlayer_mobile';

const SubtitlesSelector = ({ videoUrl, subtitleOptions }) => {
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  if (!selectedSubtitle) {
    return (
      <div className="subtitle-selector">
        <h3>Selecciona subtítulos:</h3>
        <ul>
          {subtitleOptions.map((option) => (
            <li key={option.srclang}>
              <button onClick={() => setSelectedSubtitle(option)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <VideoPlayerMobile 
      videoUrl={videoUrl} 
      subtitleUrl={selectedSubtitle.src} 
    />
  );
};

export default SubtitlesSelector;