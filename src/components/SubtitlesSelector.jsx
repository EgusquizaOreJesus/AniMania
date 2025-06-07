import React, { useState } from 'react';
// 1. Importa AMBOS reproductores
import VideoPlayerAndroid from './VideoPlayer_mobile'; // El que ya tenías para Android
import VideoPlayerIOS from './VideoPlayer_ios';       // El nuevo para iPhone
import VideoPlayerMobile from './VideoPlayer_mobile';

const SubtitlesSelector = ({ videoUrl, subtitleOptions }) => {
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  // Nuevo estado para saber cuándo mostrar el reproductor
  const [selectionMade, setSelectionMade] = useState(false);

  // 2. Lógica para detectar si es un dispositivo Apple (iPhone, iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Si no hay subtítulos disponibles desde el principio, marcamos la selección como hecha
  // para mostrar el reproductor inmediatamente.
  if ((!subtitleOptions || subtitleOptions.length === 0) && !selectionMade) {
    setSelectionMade(true);
  }

  // Si aún no se ha tomado una decisión (y hay subtítulos), muestra los botones
  if (!selectionMade) {
    return (
      <div className="subtitle-selector">
        <h3>Selecciona subtítulos:</h3>
        <ul>
          {subtitleOptions.map((option) => (
            <li key={option.srclang}>
              <button onClick={() => {
                setSelectedSubtitle(option);
                setSelectionMade(true);
              }}>
                {option.label}
              </button>
            </li>
          ))}
          {/* Botón para continuar sin seleccionar subtítulos */}
          <li key="no-subs">
            <button onClick={() => {
              setSelectedSubtitle(null);
              setSelectionMade(true);
            }}>
              Ver sin subtítulos
            </button>
          </li>
        </ul>
      </div>
    );
  }

  // 3. Una vez hecha la selección, renderiza el reproductor correcto
  const subtitleSrc = selectedSubtitle ? selectedSubtitle.src : null;

  if (isIOS) {
    return (
      <VideoPlayerIOS 
        videoUrl={videoUrl} 
        subtitleUrl={subtitleSrc} 
      />
    );
  } else {
    return (
      <VideoPlayerMobile 
        videoUrl={videoUrl} 
        subtitleUrl={subtitleSrc} 
      />
    );
  }
};

export default SubtitlesSelector;