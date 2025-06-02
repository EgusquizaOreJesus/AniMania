// src/App.jsx
import './styles/VideoPlayer.css'; // Import player specific styles
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import EpisodePlayerPage from './pages/EpisodePlayerPage';
import VideoPlayer2 from './components/VideoPlayer2';
import './App.css';
import Header from './components/Header';
function App() {
  return (
    <>
    <Router>
      <Header />

      <div className='container'>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/anime/:slug" element={<AnimeDetailPage />} />
        <Route path="/watch/:slug/:episodeNumber" element={<EpisodePlayerPage />} />
        <Route path="/prueba" element={<VideoPlayer2 />} />
        {/* Ruta para el reproductor de video, si es necesario */}
      </Routes>
    </div>

    </Router>
    </>


  );
}

export default App;