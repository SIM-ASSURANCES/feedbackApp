import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import api from '../services/api';

function PublicPage() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; submitted_at: string; recipient_name: string; rating?: number }>>([]);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('feedback_token');

  useEffect(() => {
    api.get('/feedbacks/public')
      .then((response) => {
        // Afficher uniquement les feedbacks adressés à l'entreprise
        const all = response.data.feedbacks as Array<{ id: string; content: string; submitted_at: string; recipient_name: string; rating?: number }>;
        const entrepriseFeedbacks = all.filter((f) =>
          f.recipient_name?.toLowerCase().includes('entreprise')
        );
        setFeedbacks(entrepriseFeedbacks);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004B9C 0%, #51AEE2 50%, #004B9C 100%)' }}>
      <Header isAuthenticated={isAuthenticated} onLogout={() => {
        localStorage.removeItem('feedback_token');
        window.location.reload();
      }} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Partagez vos <span className="highlight-purple">critiques</span> en toute confiance</h1>
            <p>Donnez votre avis de manière anonyme et constructive pour aider vos collègues à s'améliorer</p>
            <button onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary">
              Laisser une critique
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="card-grid">
          <div className="card">
            <h3>🔒 Anonyme</h3>
            <p>Vos critiques sont complètement anonymes. Aucune information personnelle n'est collectée.</p>
          </div>
          <div className="card">
            <h3>✨ Constructif</h3>
            <p>Partagez un retour honnête et bienveillant pour favoriser le développement personnel et celui de l'entreprise.</p>
          </div>
          <div className="card">
            <h3>🛡️ Sécurisé</h3>
            <p>Vos données sont protégées et traitées de manière confidentielle par le système.</p>
          </div>
        </section>

        {/* Feedback Form */}
        <section>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>Soumettre un feedback</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>Remplissez le formulaire ci-dessous pour partager votre avis</p>
          </div>
          <FeedbackForm onSubmit={() => window.location.reload()} />
        </section>

        {/* Comments Section */}
        <section>
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Critiques sur l'entreprise</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', margin: 0 }}>Découvrez ce que nos collaborateurs pensent de SIM Assurances</p>
          </div>
          {feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Aucune critique pour le moment. Soyez le premier à partager votre avis !</p>
            </div>
          ) : (
            <FeedbackList feedbacks={feedbacks} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default PublicPage;

