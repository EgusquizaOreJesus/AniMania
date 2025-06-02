import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const AnimeDetailPage = () => {
  const { slug } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimeData = async () => {
      try {
        // Obtener información básica del anime
        const animeResponse = await axios.get('/animes.json');
        const foundAnime = animeResponse.data.find(a => a.slug === slug);
        
        if (!foundAnime) {
          throw new Error('Anime no encontrado');
        }
        
        setAnime(foundAnime);
        
        // Obtener lista de episodios
        const episodesResponse = await axios.get(`/animes/${slug}.json`);
        setEpisodes(episodesResponse.data.episodes);
      } catch (error) {
        console.error('Error cargando detalles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeData();
  }, [slug]);

  if (loading) return <div className="loading">Cargando detalles...</div>;
  if (!anime) return <div className="error">Anime no encontrado</div>;

 return (
  <div className="anime-detail">
    <div className="anime-header">
      <img src={anime.image} alt={anime.title} />
      <div className="anime-info">
        <h1>{anime.title}</h1>
        <p>{anime.description}</p>
        <p>Episodios: {anime.episodes}</p>
      </div>
    </div>

    <h2>Episodios</h2>
    <div className="episodes-container"> {/* Nuevo contenedor con scroll */}
      <div className="episodes-list">
        {episodes.map(episode => (
          <Link 
            to={`/watch/${slug}/${episode.number}`} 
            key={episode.number}
            className="episode-card"
          >
            <div className="episode-number">Episodio {episode.number}</div>
            <img src={episode.image} alt={episode.title} />
            <div className="episode-info">
              <h3>{episode.title}</h3>
              <p>{episode.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
};

export default AnimeDetailPage;