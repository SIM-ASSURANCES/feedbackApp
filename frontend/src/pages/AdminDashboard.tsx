import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { setAuthToken } from '../services/api';

function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; content: string; recipient_id: string; recipient_name?: string; submitted_at: string; is_moderated: boolean; rating?: number; participant_id?: string }>>([]);
  const [stats, setStats] = useState<{ total: number; moderated: number; uniqueParticipants: number } | null>(null);
  const [employeeStats, setEmployeeStats] = useState<Array<{ id: string; name: string; position: string; total_feedbacks: number; positive_feedbacks: number; neutral_feedbacks: number; negative_feedbacks: number }>>([]);
  const [adminName, setAdminName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Record<string, boolean>>({});
  const [adminTab, setAdminTab] = useState<'employees' | 'company'>('employees');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedFeedbacks((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
      api.get('/admin/stats').then((response) => setStats(response.data)),
      api.get('/admin/employee-stats').then((response) => setEmployeeStats(response.data.employeeStats)),
      api.get('/user/me').then((response) => setAdminName(response.data.name)).catch(() => setAdminName('Admin'))
    ]).catch(console.error)
      .finally(() => setIsLoading(false));
  }, [navigate]);

  async function handleDelete(id: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce retour ?')) return;
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
    localStorage.removeItem('feedback_role');
    setAuthToken('');
    navigate('/');
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const isCompany = feedback.recipient_name?.toLowerCase().includes('entreprise');
    return adminTab === 'company' ? isCompany : !isCompany;
  });

  const total = filteredFeedbacks.length;
  const visible = filteredFeedbacks.filter((f) => !f.is_moderated).length;
  const hidden = filteredFeedbacks.filter((f) => f.is_moderated).length;
  const uniqueParticipants = new Set(filteredFeedbacks.map((f) => f.participant_id).filter(Boolean)).size;

  const filteredEmployeeStats = employeeStats.filter((emp) => !emp.name.toLowerCase().includes('entreprise'));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004B9C 0%, #003d80 35%, #51AEE2 65%, #004B9C 100%)' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      <main style={{ padding: '0 clamp(12px, 4vw, 40px)' }}>
        {/* Hero Section */}
        <section className="hero" style={{ marginBottom: '50px' }}>
          <div className="hero-content">
            <h1>Bienvenue, <span className="highlight-purple">{adminName || 'Admin'}</span> 👋</h1>
            <p>Tableau de bord Admin — Gérez et modérez tous les retours de la plateforme</p>
            <button
              onClick={() => document.getElementById('add-employee-form')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                marginTop: '24px',
                padding: '16px 40px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #004B9C 0%, #51AEE2 100%)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                boxShadow: '0 8px 25px rgba(0, 75, 156, 0.35)',
                letterSpacing: '0.5px'
              }}
            >
              ＋ Ajouter un collaborateur
            </button>
          </div>
        </section>

        {/* Stats Cards */}
        {!isLoading && (
          <div className="card-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Retours</p>
              <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{total}</h3>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visibles sur l'accueil</p>
              <h3 style={{ margin: '0', color: '#34C759', fontSize: '2.5rem', fontWeight: 800 }}>{visible}</h3>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Masqués de l'accueil</p>
              <h3 style={{ margin: '0', color: '#64748b', fontSize: '2.5rem', fontWeight: 800 }}>{hidden}</h3>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Participants</p>
              <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{uniqueParticipants}</h3>
            </div>
          </div>
        )}

        {/* Statistiques par employé Section — uniquement visible sur l'onglet Collaborateurs */}
        {!isLoading && adminTab === 'employees' && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Statistiques par collaborateur</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
              Aperçu des retours reçus par chaque membre de l'équipe
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredEmployeeStats.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '24px', gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '1rem', color: '#94a3b8' }}>Aucune statistique disponible.</p>
                </div>
              ) : (
                filteredEmployeeStats.map((emp) => (
                  <div key={emp.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ margin: '0', fontSize: '1.2rem', color: '#004B9C', fontWeight: 700 }}>{emp.name}</h3>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#004B9C', background: 'rgba(0, 75, 156, 0.08)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                          {emp.total_feedbacks} retour{emp.total_feedbacks > 1 ? 's' : ''}
                        </span>
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.85rem', display: 'block' }}>{emp.position || 'Poste non défini'}</small>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(52, 199, 89, 0.08)', border: '1.5px solid rgba(52, 199, 89, 0.15)', padding: '8px 4px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34C759' }}>{emp.positive_feedbacks}</div>
                        <div style={{ color: '#34C759', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Positifs</div>
                      </div>
                      <div style={{ background: 'rgba(255, 149, 0, 0.08)', border: '1.5px solid rgba(255, 149, 0, 0.15)', padding: '8px 4px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF9500' }}>{emp.neutral_feedbacks}</div>
                        <div style={{ color: '#FF9500', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Neutres</div>
                      </div>
                      <div style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1.5px solid rgba(255, 59, 48, 0.15)', padding: '8px 4px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF3B30' }}>{emp.negative_feedbacks}</div>
                        <div style={{ color: '#FF3B30', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Négatifs</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Ajouter un collaborateur Section */}
        <section id="add-employee-form" style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Ajouter un collaborateur</h2>
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
              {isRegistering ? 'Ajout...' : 'Ajouter le collaborateur'}
            </button>
          </form>
        </section>

        {/* Feedbacks List */}
        <section>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Tous les retours</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '30px', textAlign: 'center' }}>
            {isLoading ? 'Chargement...' : `${filteredFeedbacks.length} retour(s) dans cette catégorie`}
          </p>

          {!isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' }}>
              <button
                onClick={() => setAdminTab('employees')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '30px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: adminTab === 'employees' ? '#004B9C' : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  boxShadow: adminTab === 'employees' ? '0 4px 15px rgba(0, 75, 156, 0.4)' : 'none',
                  border: adminTab === 'employees' ? '2px solid transparent' : '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                Avis sur les Collaborateurs
              </button>
              <button
                onClick={() => setAdminTab('company')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '30px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: adminTab === 'company' ? '#004B9C' : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  boxShadow: adminTab === 'company' ? '0 4px 15px rgba(0, 75, 156, 0.4)' : 'none',
                  border: adminTab === 'company' ? '2px solid transparent' : '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                Conditions de Travail
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p>Chargement des retours...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Aucun retour dans cette catégorie pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFeedbacks.map((feedback) => {
                const isExpanded = !!expandedFeedbacks[feedback.id];
                const maxLength = 220;
                const isLong = feedback.content.length > maxLength;
                const displayContent = isExpanded 
                  ? feedback.content 
                  : (isLong ? `${feedback.content.substring(0, maxLength)}...` : feedback.content);

                return (
                  <div key={feedback.id} className="card" style={{ borderLeft: feedback.is_moderated ? '4px solid #64748b' : '4px solid #34C759' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#0f172a', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
                          "{displayContent}"
                          {isLong && (
                            <button 
                              onClick={() => toggleExpand(feedback.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#004B9C',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '0 0 0 6px',
                                fontSize: '0.9rem',
                                textDecoration: 'underline',
                                display: 'inline-block'
                              }}
                            >
                              {isExpanded ? 'Voir moins' : 'Lire la suite'}
                            </button>
                          )}
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
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                        {feedback.recipient_name && (
                          <span style={{ color: '#51AEE2', fontWeight: 600 }}>
                            📍 {feedback.recipient_name}
                          </span>
                        )}
                        <span style={{ color: '#94a3b8' }}>
                          📅 {new Date(feedback.submitted_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: feedback.is_moderated ? 'rgba(148, 163, 184, 0.12)' : 'rgba(52, 199, 89, 0.12)',
                          color: feedback.is_moderated ? '#64748b' : '#34C759',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}>
                          {feedback.is_moderated ? '👁 Masqué de l\'accueil' : '✓ Visible sur l\'accueil'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleModerate(feedback.id, !feedback.is_moderated)}
                      className="btn-secondary"
                      style={{
                        background: feedback.is_moderated ? 'rgba(52, 199, 89, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                        color: feedback.is_moderated ? '#34C759' : '#64748b',
                        border: feedback.is_moderated ? '1.5px solid #34C759' : '1.5px solid #64748b',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {feedback.is_moderated ? '👁 Afficher sur l\'accueil' : '👁 Masquer de l\'accueil'}
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
              );
            })}
          </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default AdminDashboard;

