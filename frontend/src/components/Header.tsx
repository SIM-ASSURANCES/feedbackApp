import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/header.css';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

function Header({ isAuthenticated = false, onLogout }: HeaderProps) {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src="/logo.webp" alt="SIM Assurances Logo" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
          <div className="logo-text" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(255, 255, 255, 0.2)' }}>
            <span className="logo-title" style={{ fontSize: '1.2rem' }}>Feedback</span>
          </div>
        </Link>

        {/* Bouton hamburger mobile */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Accueil
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Connexion
            </Link>
          )}

          {isAuthenticated && (
            <>
              <Link
                to={isAdmin ? '/admin' : '/user/me'}
                className={`nav-link ${location.pathname === (isAdmin ? '/admin' : '/user/me') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                {isAdmin ? 'Dashboard Admin' : 'Mon Dashboard'}
              </Link>
              <button onClick={handleLogout} className="btn btn-logout">
                Déconnexion
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
