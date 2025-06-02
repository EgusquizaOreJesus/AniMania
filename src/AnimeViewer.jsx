// En el componente que usa VideoPlayer
import VideoPlayer from './components/VideoPlayer';

const AnimeViewer = ({ anime }) => {
  // Generamos las URLs basadas en el anime seleccionado
  const videoUrl = `https://mianimecdn.b-cdn.net/${anime.slug}/episodio-${anime.episode}/master.m3u8`;
  
  const subtitleTracksConfig = [
    { 
      label: "Español", 
      srclang: "es", 
      src: `https://mianimecdn.b-cdn.net/${anime.slug}/episodio-${anime.episode}/sub_spa_es.vtt`,
      default: true 
    },
    { 
      label: "English", 
      srclang: "en", 
      src: `https://mianimecdn.b-cdn.net/${anime.slug}/episodio-${anime.episode}/sub_eng.vtt`
    }
  ];

  return (
    <VideoPlayer 
      videoUrl={videoUrl} 
      subtitleTracksConfig={subtitleTracksConfig} 
    />
  );
};