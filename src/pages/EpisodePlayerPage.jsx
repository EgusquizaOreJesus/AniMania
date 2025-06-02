import React from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';

const EpisodePlayerPage = () => {
  const { slug, episodeNumber } = useParams();
  console.log(`Cargando episodio ${episodeNumber} del anime ${slug}`);
  // PONER LA PRIMERA LETRA EN MAYÚSCULA
    const formattedSlug = slug.charAt(0).toUpperCase() + slug.slice(1);
    console.log(`Slug formateado: ${formattedSlug}`);
  
  // Construir URLs basadas en el anime y episodio
  const videoUrl = `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/master.m3u8`;
  
  const subtitleTracksConfig = [
    { 
      label: "Español", 
      srclang: "es", 
      src: `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/sub_spa_es.vtt`, 
      default: true 
    },
    { 
      label: "English", 
      srclang: "en", 
      src: `https://mianimecdn.b-cdn.net/${formattedSlug}/episodio-${episodeNumber}/sub_eng.vtt` 
    }
  ];

  return (
    <div className="episode-player">
      <VideoPlayer 
        videoUrl={videoUrl} 
        subtitleTracksConfig={subtitleTracksConfig} 
      />
      <div className="episode-info">
        <h2>{slug} - Episodio {episodeNumber}</h2>
        {/* Aquí podrías agregar más información del episodio si la tienes */}
      </div>
    </div>
  );
};

export default EpisodePlayerPage;