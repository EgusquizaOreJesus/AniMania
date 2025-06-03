import React from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { useState, useEffect } from 'react';
const EpisodePlayerPage = () => {
  const { slug, episodeNumber } = useParams();
  const [subtitleTracksConfig, setSubtitleTracksConfig] = useState([]);
  const [loadingSubtitles, setLoadingSubtitles] = useState(true);

  // PONER LA PRIMERA LETRA EN MAYÚSCULA
  const formattedSlug = slug.charAt(0).toUpperCase() + slug.slice(1);
  
  // Construir URLs basadas en el anime y episodio
  const videoUrl = `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/master.m3u8`;

  // verificar cuantos subtítulos hay y crear la configuración 

  
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
        checkSubtitle("Español (Latino)", "es-LT", "sub_spa_lat.vtt",true),
        checkSubtitle("Español (España)", "es-ES", "sub_spa_es.vtt"),
        checkSubtitle("English", "en", "sub_eng.vtt"),
        // Puedes agregar más subtítulos aquí si lo deseas
      ]);

      const validTracks = checks.filter(Boolean); // eliminar los null
      setSubtitleTracksConfig(validTracks);
      setLoadingSubtitles(false);
    };

    loadSubtitles();
  }, [formattedSlug, episodeNumber]);


  return (
    <div className="episode-player">
      {!loadingSubtitles && (
        <VideoPlayer 
          videoUrl={videoUrl} 
          subtitleTracksConfig={subtitleTracksConfig} 
        />
      )}
      <div className="episode-info">
        <h2>{slug} - Episodio {episodeNumber}</h2>
        {/* Aquí podrías agregar más información del episodio si la tienes */}
      </div>
    </div>
  );
};

export default EpisodePlayerPage;