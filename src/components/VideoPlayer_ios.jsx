import React from 'react';

const VideoPlayerIOS = ({ videoUrl, subtitleUrl }) => {
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: 'black' }}>
      <video
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        controls
        playsInline
        src={videoUrl}
        crossOrigin="anonymous"
      >
        {subtitleUrl && (
          <track
            kind="subtitles"
            src={subtitleUrl}
            srcLang="es"
            label="Español"
            default
          />
        )}
      </video>
    </div>
  );
};

export default VideoPlayerIOS;