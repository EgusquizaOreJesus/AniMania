import React, { useEffect, useRef } from "react";
import Hls from "hls.js";
import Plyr from "plyr/dist/plyr.polyfilled"; // ✅ Import correcto
import "plyr/dist/plyr.css";

const VideoPlayer_mobile = ({ videoUrl, subtitleTracksConfig = [] }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  console.log("track", subtitleTracksConfig);
  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported() && videoUrl) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(videoUrl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const availableQualities = hls.levels.map((l) => l.height);

        const player = new Plyr(video, {
          controls: [
            "play-large", "restart", "rewind", "play", "fast-forward",
            "progress", "current-time", "duration", "mute", "volume",
            "captions", "settings", "pip", "airplay", "download", "fullscreen"
          ],
          quality: {
            default: availableQualities[0],
            options: availableQualities,
            forced: true,
            onChange: (quality) => {
              hls.levels.forEach((level, index) => {
                if (level.height === quality) {
                  hls.currentLevel = index;
                }
              });
            }
          }
        });
      });

      hls.attachMedia(video);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl]);

  return (
    <div style={{ height: "400px" }}>
      <video
        ref={videoRef}
        id="player"
        controls
        crossOrigin="anonymous"
        playsInline
      >
        {subtitleTracksConfig.map((track, index) => (
          <track
            key={index}
            kind="captions"
            label={track.label}
            srcLang={track.srclang}
            src={track.src}
            default={track.default}
          />
        ))}
      </video>
    </div>
  );
};

export default VideoPlayer_mobile;
