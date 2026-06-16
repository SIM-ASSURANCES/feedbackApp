import '../styles/global.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-brand">SIM Assurances Feedback</p>
          <p className="footer-copy">Une expérience fluide et sécurisée pour partager des retours constructifs.</p>
        </div>
        <div className="footer-links">
          <a href="/" className="footer-link">Accueil</a>
          <a href="/login" className="footer-link">Connexion</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
