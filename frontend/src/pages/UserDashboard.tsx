import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { setAuthToken } from '../services/api';

function UserDashboard() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; submitted_at: string; rating?: number }>>([]);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenFeedbackIdsRef = useRef<Set<string> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('feedback_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);

    function loadData() {
      return Promise.all([
        api.get('/user/me/feedbacks').then((response) => {
          const newFeedbacks = response.data.feedbacks;
          setFeedbacks(newFeedbacks);
          const currentIds = new Set<string>(newFeedbacks.map((f: { id: string }) => f.id));
          if (seenFeedbackIdsRef.current === null) {
            seenFeedbackIdsRef.current = currentIds;
          } else {
            const newOnes = newFeedbacks.filter((f: { id: string }) => !seenFeedbackIdsRef.current!.has(f.id));
            if (newOnes.length > 0) {
              setUnreadCount((count) => count + newOnes.length);
            }
            seenFeedbackIdsRef.current = currentIds;
          }
        }),
        api.get('/user/me').then((response) => setUserName(response.data.name)).catch(() => setUserName('Utilisateur'))
      ]);
    }

    loadData().finally(() => setIsLoading(false));
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('feedback_token');
    localStorage.removeItem('feedback_role');
    setAuthToken('');
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero" style={{ marginBottom: '50px', position: 'relative' }}>
          <button
            onClick={() => {
              setUnreadCount(0);
              document.getElementById('user-feedbacks-list')?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Notifications"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 3,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#FF3B30',
                color: 'white',
                borderRadius: '50%',
                minWidth: '22px',
                height: '22px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--color-bg)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="hero-content">
            <h1>Bienvenue, <span className="highlight-purple">{userName}</span> 👋</h1>
            <p>Découvrez les retours constructifs que vos collègues vous ont partagées</p>
          </div>
        </section>

        {/* Stats Card */}
        <div className="card" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#51AEE2' }}>Retours reçus</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0A1628', margin: '0' }}>
            {isLoading ? '...' : feedbacks.length}
          </p>
          <small style={{ color: '#94a3b8' }}>
            {feedbacks.length === 0 ? 'Aucun retour pour le moment' : 'Continuez à vous améliorer !'}
          </small>
        </div>

        {/* Feedbacks List */}
        <section id="user-feedbacks-list">
          <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Mes retours</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
            Seuls les retours qui vous sont destinés s'affichent, sans information sur l'auteur
          </p>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p>Chargement...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
                Vous n'avez pas encore de retours. Invitez vos collègues à partager leurs avis !
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
                      <div style={{ color: '#FF9500', fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>
                          {'★'.repeat(Math.min(feedback.rating, feedback.rating > 5 ? 10 : 5))}
                          {'☆'.repeat(Math.max(0, (feedback.rating > 5 ? 10 : 5) - feedback.rating))}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                          ({feedback.rating}/{feedback.rating > 5 ? 10 : 5})
                        </span>
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

