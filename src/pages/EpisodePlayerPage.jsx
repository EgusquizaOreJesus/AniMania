// src/pages/EpisodePlayerPage.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile'; // Lo estás usando para decidir
import { useState, useEffect } from 'react';

// --- IMPORTANTE: Renombra tus componentes para mayor claridad ---
// Tu reproductor original, ahora para escritorio
import VideoPlayerOriginal from '../components/VideoPlayer_original.jsx'; 
// El nuevo reproductor con ReactPlayer para móviles
import VideoPlayerMobile from '../components/VideoPlayer_mobile.jsx';
import SubtitlesSelector from '../components/SubtitlesSelector.jsx';


const EpisodePlayerPage = () => {
  const { slug, episodeNumber } = useParams();
  const [subtitleTracksConfig, setSubtitleTracksConfig] = useState([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(true);

  // PONER LA PRIMERA LETRA EN MAYÚSCULA
  const formattedSlug = slug.charAt(0).toUpperCase() + slug.slice(1);
  
  // Construir URLs basadas en el anime y episodio
  const videoUrl = `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/master.m3u8`;

  // useEffect para cargar subtítulos (tu código está perfecto, no necesita cambios)
  useEffect(() => {
    const checkSubtitle = async (label, srclang, filename, isDefault = false) => {
      const url = `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/${filename}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return { label, srclang, src: url, default: isDefault };
        }
      } catch (error) {
        console.error(`Error verificando subtítulo ${label}:`, error);
      }
      return null;
    };

    const loadSubtitles = async () => {
      setLoadingSubtitles(true);
      const checks = await Promise.all([
        checkSubtitle("Español (Latino)", "es-LT", "sub_spa_lat.vtt", true),
        checkSubtitle("Español (España)", "es-ES", "sub_spa_es.vtt"),
        checkSubtitle("English", "en", "sub_eng.vtt"),
      ]);

      const validTracks = checks.filter(Boolean);
      setSubtitleTracksConfig(validTracks);
      setLoadingSubtitles(false);
    };

    loadSubtitles();
  }, [formattedSlug, episodeNumber]);

  // --- ¡Aquí está la magia! ---
  const isMobile = useIsMobile();
  console.log("Is mobile:", isMobile); // Para depuración, puedes eliminarlo después
  return (
    <div className="episode-player">
      {/* Muestra un loader mientras se verifican los subtítulos */}
      {loadingSubtitles ? (
        <div className="loading-placeholder">Cargando reproductor...</div>
      ) : (
        // --- LÓGICA CONDICIONAL PARA CAMBIAR DE REPRODUCTOR ---
        isMobile ? (
          // Si es móvil, usa el reproductor simple y robusto
          <SubtitlesSelector
            videoUrl={videoUrl}
            subtitleOptions={subtitleTracksConfig}
          />
        ) : (
          // Si es escritorio, usa tu reproductor original con todas sus funciones
          <VideoPlayerOriginal
            videoUrl={videoUrl} 
            subtitleTracksConfig={subtitleTracksConfig} 
          />
        )
      )}
      
      <div className="episode-info">
        {/* El título se muestra debajo del reproductor */}
        <h2>{formattedSlug} - Episodio {episodeNumber}</h2>
      </div>
    </div>
  );
};

export default EpisodePlayerPage;
