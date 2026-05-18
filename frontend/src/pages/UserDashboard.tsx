import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { setAuthToken } from '../services/api';

function UserDashboard() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; submitted_at: string; rating?: number }>>([]);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('feedback_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);

    Promise.all([
      api.get('/user/me/feedbacks').then((response) => setFeedbacks(response.data.feedbacks)),
      api.get('/user/me').then((response) => setUserName(response.data.name)).catch(() => setUserName('Utilisateur'))
    ]).finally(() => setIsLoading(false));
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('feedback_token');
    setAuthToken('');
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004B9C 0%, #51AEE2 50%, #004B9C 100%)' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero" style={{ marginBottom: '50px' }}>
          <div className="hero-content">
            <h1>Bienvenue, <span className="highlight-purple">{userName}</span> 👋</h1>
            <p>Découvrez les critiques constructives que vos collègues vous ont partagées</p>
          </div>
        </section>

        {/* Stats Card */}
        <div className="card" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#51AEE2' }}>Critiques reçues</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0A1628', margin: '0' }}>
            {isLoading ? '...' : feedbacks.length}
          </p>
          <small style={{ color: '#94a3b8' }}>
            {feedbacks.length === 0 ? 'Aucune critique pour le moment' : 'Continuez à vous améliorer !'}
          </small>
        </div>

        {/* Feedbacks List */}
        <section>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Mes critiques</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
            Seuls les retours qui vous sont destinés s'affichent, sans information sur l'auteur
          </p>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p>Chargement...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
                Vous n'avez pas encore de critiques. Invitez vos collègues à partager leurs avis !
              </p>
            </div>
          ) : (
            <div className="card-grid">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#0f172a', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                      "{feedback.content}"
                    </p>
                    {feedback.rating && feedback.rating > 0 ? (
                      <div style={{ color: '#FF9500', fontSize: '1.2rem', marginBottom: '10px' }}>
                        {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: 'auto' }}>
                    <small style={{ color: '#94a3b8' }}>
                      {new Date(feedback.submitted_at).toLocaleDateString('fr-FR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default UserDashboard;

