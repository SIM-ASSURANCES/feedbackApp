import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChangePasswordForm from '../components/ChangePasswordForm';
import api, { setAuthToken } from '../services/api';

interface Synthesis {
  totalCount: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criteria: Array<{ key: string; label: string; shortLabel: string; average: number; count: number }>;
  topTags: { positive: string[]; negative: string[] };
  synthesisText: string;
}

const EMPTY_SYNTHESIS: Synthesis = {
  totalCount: 0,
  averageRating: 0,
  positiveCount: 0,
  neutralCount: 0,
  negativeCount: 0,
  criteria: [],
  topTags: { positive: [], negative: [] },
  synthesisText: ''
};

function UserDashboard() {
  const [synthesis, setSynthesis] = useState<Synthesis>(EMPTY_SYNTHESIS);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
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
        api.get('/user/me/feedbacks/synthesis').then((response) => setSynthesis(response.data as Synthesis)),
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

  const breakdown = [
    { label: 'Bon', value: synthesis.positiveCount, color: '#34C759' },
    { label: 'Neutres', value: synthesis.neutralCount, color: '#FF9500' },
    { label: 'Moins bon', value: synthesis.negativeCount, color: '#FF3B30' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero" style={{ marginBottom: '50px', position: 'relative' }}>
          <button
            onClick={() => setShowPasswordForm((current) => !current)}
            aria-label="Mon compte"
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
            🔑
          </button>
          <div className="hero-content">
            <h1>Bienvenue, <span className="highlight-purple">{userName}</span> 👋</h1>
            <p>Découvrez la synthèse des retours constructifs que vos collègues vous ont partagés</p>
          </div>
        </section>

        {showPasswordForm && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <ChangePasswordForm />
          </div>
        )}

        {/* Stats Card */}
        <div className="card" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#51AEE2' }}>Retours reçus</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0A1628', margin: '0' }}>
            {isLoading ? '...' : synthesis.totalCount}
          </p>
          <small style={{ color: '#94a3b8' }}>
            {synthesis.totalCount === 0 ? 'Aucun retour pour le moment' : `Note moyenne : ${synthesis.averageRating.toFixed(1)}/10`}
          </small>
        </div>

        {/* Synthesis */}
        <section id="user-synthesis" style={{ marginBottom: '60px' }}>
          <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Synthèse de mes retours</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
            Vue d'ensemble anonymisée : aucun commentaire individuel ni auteur n'est jamais affiché ici
          </p>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p>Chargement...</p>
            </div>
          ) : synthesis.totalCount === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
                Vous n'avez pas encore de retours. Invitez vos collègues à partager leurs avis !
              </p>
            </div>
          ) : (
            <>
              {synthesis.synthesisText && (
                <div className="card" style={{ maxWidth: '700px', margin: '0 auto 30px', padding: '28px', background: 'linear-gradient(135deg, rgba(0,75,156,0.06), rgba(81,174,226,0.06))' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary-dark)', fontSize: '1.15rem' }}>📝 Résumé</h3>
                  <p style={{ color: '#0f172a', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>{synthesis.synthesisText}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
                {breakdown.map((b) => (
                  <div key={b.label} style={{ background: `${b.color}14`, border: `1.5px solid ${b.color}26`, padding: '16px 8px', borderRadius: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: b.color }}>{b.value}</div>
                    <div style={{ color: b.color, fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>{b.label}</div>
                  </div>
                ))}
              </div>

              {synthesis.criteria.length > 0 && (
                <div className="card" style={{ maxWidth: '700px', margin: '0 auto 24px', padding: '28px' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: 'var(--color-primary-dark)', fontSize: '1.15rem' }}>Moyenne par critère</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {synthesis.criteria.map((c) => (
                      <div key={c.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{c.label}</span>
                          <span style={{ color: '#64748b' }}>{c.average.toFixed(1)}/5 ({c.count})</span>
                        </div>
                        <div style={{ background: '#e2e8f0', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${(c.average / 5) * 100}%`, background: 'linear-gradient(90deg, #004B9C 0%, #51AEE2 100%)', height: '100%', borderRadius: '8px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {(synthesis.topTags.positive.length > 0 || synthesis.topTags.negative.length > 0) && (
                <div className="card" style={{ maxWidth: '700px', margin: '0 auto', padding: '28px' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-dark)', fontSize: '1.15rem' }}>Points fréquemment relevés</h3>
                  {synthesis.topTags.positive.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#34C759', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px' }}>💪 Points forts</p>
                      <div className="tags-container" style={{ borderTop: 'none', padding: 0 }}>
                        {synthesis.topTags.positive.map((tag) => (
                          <span key={tag} className="tag-btn active">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {synthesis.topTags.negative.length > 0 && (
                    <div>
                      <p style={{ color: '#FF3B30', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px' }}>🎯 Points d'amélioration</p>
                      <div className="tags-container" style={{ borderTop: 'none', padding: 0 }}>
                        {synthesis.topTags.negative.map((tag) => (
                          <span key={tag} className="tag-btn">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default UserDashboard;
