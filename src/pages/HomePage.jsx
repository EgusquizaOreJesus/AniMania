import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

const HomePage = () => {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const response = await axios.get('/animes.json');
        setAnimes(response.data);
      } catch (error) {
        console.error('Error cargando animes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimes();
  }, []);

  if (loading) return <div className="loading">Cargando catálogo...</div>;

  return (
    <div className="home-page">
      <h1 className='catalogo'>Catálogo de Animes</h1>
      <div className="anime-grid">
        {console.log(animes)}
        {animes.map(anime => (
          <Link to={`/anime/${anime.slug}`} key={anime.id} className="anime-card">
            <img src={anime.image} alt={anime.title} />
            <h3>{anime.title}</h3>
            <p>{anime.description}</p>
            <span>{anime.episodes} episodios</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage;