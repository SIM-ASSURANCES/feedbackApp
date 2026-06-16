import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackForm from '../components/FeedbackForm';
import WorkConditionsForm from '../components/WorkConditionsForm';
import FeedbackList from '../components/FeedbackList';
import api from '../services/api';

function PublicPage() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; submitted_at: string; recipient_name: string; rating?: number }>>([]);
  const [activeTab, setActiveTab] = useState<'colleague' | 'conditions'>('colleague');
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('feedback_token');

  const loadFeedbacks = () => {
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
  };

  useEffect(() => {
    loadFeedbacks();
    const intervalId = setInterval(loadFeedbacks, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004B9C 0%, #003d80 35%, #51AEE2 65%, #004B9C 100%)' }}>
      <Header isAuthenticated={isAuthenticated} onLogout={() => {
        localStorage.removeItem('feedback_token');
        localStorage.removeItem('feedback_role');
        window.location.reload();
      }} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Partagez vos <span className="highlight-purple">avis</span> en toute confiance</h1>
            <p>Donnez votre avis de manière anonyme et constructive pour aider vos collègues à s'améliorer</p>
            <button onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary">
              Laisser un avis
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="card-grid">
          <div className="card">
            <h3>🔒 Anonyme</h3>
            <p>Vos avis sont complètement anonymes. Aucune information personnelle n'est collectée.</p>
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
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Soumettre un feedback</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.1rem', margin: '0 0 24px 0' }}>
              {activeTab === 'colleague' 
                ? 'Partagez votre avis de façon constructive sur la collaboration avec vos collègues' 
                : 'Évaluez anonymement les conditions de travail au sein de SIM Assurances'}
            </p>
          </div>

          {/* Form Selector (Tabs) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => setActiveTab('colleague')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === 'colleague' ? 'white' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'colleague' ? '#004B9C' : 'white',
                border: activeTab === 'colleague' ? 'none' : '1.5px solid rgba(255, 255, 255, 0.4)',
                boxShadow: activeTab === 'colleague' ? '0 4px 15px rgba(0, 0, 0, 0.15)' : 'none'
              }}
            >
              👤 Collaboration entre collègues
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('conditions')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === 'conditions' ? 'white' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'conditions' ? '#004B9C' : 'white',
                border: activeTab === 'conditions' ? 'none' : '1.5px solid rgba(255, 255, 255, 0.4)',
                boxShadow: activeTab === 'conditions' ? '0 4px 15px rgba(0, 0, 0, 0.15)' : 'none'
              }}
            >
              🏢 Conditions de travail
            </button>
          </div>

          {activeTab === 'colleague' ? (
            <FeedbackForm onSubmit={loadFeedbacks} />
          ) : (
            <WorkConditionsForm onSubmit={loadFeedbacks} />
          )}
        </section>

        {/* Comments Section */}
        <section>
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Avis sur l'entreprise</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', margin: 0 }}>Découvrez ce que nos collaborateurs pensent de SIM Assurances</p>
          </div>
          {feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Aucun avis pour le moment. Soyez le premier à partager votre avis !</p>
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

