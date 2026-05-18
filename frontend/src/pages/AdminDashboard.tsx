import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { setAuthToken } from '../services/api';

function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; recipient_id: string; recipient_name?: string; submitted_at: string; is_moderated: boolean; rating?: number }>>([]);
  const [stats, setStats] = useState<{ total: number; moderated: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Formulaire d'ajout
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerMessageType, setRegisterMessageType] = useState<'success' | 'error'>('success');
  const [isRegistering, setIsRegistering] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('feedback_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);

    Promise.all([
      api.get('/admin/feedbacks').then((response) => setFeedbacks(response.data.feedbacks)),
      api.get('/admin/stats').then((response) => setStats(response.data))
    ]).catch(console.error)
      .finally(() => setIsLoading(false));
  }, [navigate]);

  async function handleDelete(id: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette critique ?')) return;
    try {
      await api.delete(`/admin/feedbacks/${id}`);
      setFeedbacks((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  async function handleModerate(id: string, isModerated: boolean) {
    try {
      await api.put(`/admin/feedbacks/${id}/moderate`, { isModerated });
      setFeedbacks((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_moderated: isModerated } : item
        )
      );
    } catch (error) {
      console.error('Erreur lors de la modération:', error);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setIsRegistering(true);
    setRegisterMessage('');

    try {
      await api.post('/auth/register', { name, email, password, position });
      setRegisterMessage('✓ Employé ajouté avec succès !');
      setRegisterMessageType('success');
      setName('');
      setEmail('');
      setPassword('');
      setPosition('');
    } catch (err) {
      setRegisterMessage('Impossible de créer le compte. Vérifiez que l\'email n\'est pas déjà utilisé.');
      setRegisterMessageType('error');
    } finally {
      setIsRegistering(false);
    }
  }

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
            <h1>Tableau de bord <span className="highlight-purple">Admin</span></h1>
            <p>Gérez et modérez toutes les critiques de la plateforme</p>
          </div>
        </section>

        {/* Stats Cards */}
        {stats && (
          <div className="card-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Critiques</p>
              <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{stats.total}</h3>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modérés</p>
              <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{stats.moderated}</h3>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Non Modérés</p>
              <h3 style={{ margin: '0', color: '#FF9500', fontSize: '2.5rem', fontWeight: 800 }}>{stats.total - stats.moderated}</h3>
            </div>
          </div>
        )}

        {/* Ajouter un employé Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Ajouter un employé</h2>
          <form onSubmit={handleRegister} className="form-glass" style={{ margin: '0', maxWidth: '100%' }}>
            {registerMessage && <p className={`message message-${registerMessageType}`}>{registerMessage}</p>}
            <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="name">Nom complet</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="password">Mot de passe</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="position">Poste (ex: RH)</label>
                <input id="position" type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Optionnel" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isRegistering} style={{ marginTop: '20px', width: 'auto', display: 'block', margin: '20px auto 0' }}>
              {isRegistering ? 'Ajout...' : 'Ajouter l\'employé'}
            </button>
          </form>
        </section>

        {/* Feedbacks List */}
        <section>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Toutes les critiques</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
            {isLoading ? 'Chargement...' : `${feedbacks.length} critique(s) à modérer`}
          </p>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p>Chargement des critiques...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Aucune critique pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="card" style={{ borderLeft: feedback.is_moderated ? '4px solid #004B9C' : '4px solid #FF9500' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#0f172a', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                        "{feedback.content}"
                      </p>
                      {feedback.rating && feedback.rating > 0 ? (
                        <div style={{ color: '#FF9500', fontSize: '1.2rem', marginBottom: '10px' }}>
                          {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                        <span style={{ color: '#51AEE2', fontWeight: 600 }}>
                          📍 {feedback.recipient_name || 'Employé inconnu'}
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          📅 {new Date(feedback.submitted_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: feedback.is_moderated ? 'rgba(0, 75, 156, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                          color: feedback.is_moderated ? '#004B9C' : '#FF9500',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}>
                          {feedback.is_moderated ? '✓ Modéré' : '⚠ Non modéré'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleModerate(feedback.id, !feedback.is_moderated)}
                      className="btn-secondary"
                      style={{
                        background: 'rgba(0, 75, 156, 0.12)',
                        color: '#004B9C',
                        border: '1.5px solid #004B9C',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {feedback.is_moderated ? '↩ Démodérer' : '✓ Modérer'}
                    </button>
                    <button
                      onClick={() => handleDelete(feedback.id)}
                      className="btn-danger"
                      style={{
                        background: 'rgba(255, 59, 48, 0.15)',
                        color: '#FF3B30',
                        border: '1.5px solid #FF3B30',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🗑 Supprimer
                    </button>
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

export default AdminDashboard;

