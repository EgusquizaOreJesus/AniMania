// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const checkIsMobile = () => {
      // Usamos una expresión regular para una detección más robusta del User Agent
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|bb\d+|meego.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent);
      setIsMobile(isMobileDevice || window.innerWidth < breakpoint);
    };

    checkIsMobile(); // Comprobar al montar

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;