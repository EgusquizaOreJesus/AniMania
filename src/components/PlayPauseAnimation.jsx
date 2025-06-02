// src/components/PlayPauseAnimation.jsx
import React, { useState, useEffect } from 'react';
const PlayPauseAnimation = ({ icon, trigger }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger > 0) { // trigger is a counter that increments to re-trigger
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 800); // Duration of the animation
      return () => clearTimeout(timer);
    }
  }, [trigger, icon]); // Re-run if trigger or icon changes

  if (!visible) return null;

  return (
    <div className="play-pause-animation">
      <i className={`fas fa-${icon}`}></i>
    </div>
  );
};

export default PlayPauseAnimation;