import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo2 from '../assets/logo2.png'; // Asegúrate de tener la ruta correcta
import './Header.css';
const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src={logo2} alt="AnimeFlix Logo" className="logo" />
        </Link>
        
        {!isHome && (
          <Link to="/" className="home-link">
            <i className="fas fa-arrow-left"></i> Volver al inicio
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;