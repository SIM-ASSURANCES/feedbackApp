import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChangePasswordForm from '../components/ChangePasswordForm';
import api, { setAuthToken } from '../services/api';

type Section = 'overview' | 'feedbacks' | 'employees' | 'questions' | 'security';

const NAV_ITEMS: Array<{ key: Section; label: string; icon: string }> = [
  { key: 'overview', label: "Vue d'ensemble", icon: '📊' },
  { key: 'feedbacks', label: 'Avis Entreprise', icon: '💬' },
  { key: 'employees', label: 'Espace Collaborateurs', icon: '👥' },
  { key: 'questions', label: 'Questions', icon: '🛠️' },
  { key: 'security', label: 'Mot de passe', icon: '🔑' }
];

interface EmployeeSynthesis {
  totalCount: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  criteria: Array<{ key: string; label: string; shortLabel: string; average: number; count: number }>;
  topTags: { positive: string[]; negative: string[] };
  synthesisText: string;
}

interface AdminFeedback {
  id: string;
  content: string;
  recipient_id: string;
  recipient_name?: string;
  submitted_at: string;
  is_moderated: boolean;
  rating?: number;
  participant_id?: string;
  feedback_type?: 'colleague' | 'conditions';
  criteria?: Record<string, { score: number; tags?: string[] }> | null;
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [employeeStats, setEmployeeStats] = useState<Array<{ id: string; name: string; position: string; total_feedbacks: number; positive_feedbacks: number; neutral_feedbacks: number; negative_feedbacks: number }>>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [adminName, setAdminName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Record<string, boolean>>({});
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const employeeDetailRef = useRef<HTMLDivElement | null>(null);
  const [revealedAuthors, setRevealedAuthors] = useState<Record<string, { name: string; email: string; position: string }>>({});
  const [employeeSynthesisCache, setEmployeeSynthesisCache] = useState<Record<string, EmployeeSynthesis>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [formQuestions, setFormQuestions] = useState<Array<{ id: string; form_type: string; question_key: string; label: string; is_active: boolean; is_required: boolean; display_order: number }>>([]);
  const [questionEdits, setQuestionEdits] = useState<Record<string, string>>({});
  const [newCriterionKey, setNewCriterionKey] = useState('');
  const [newCriterionLabel, setNewCriterionLabel] = useState('');
  const [newCriterionMessage, setNewCriterionMessage] = useState('');

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
    setIsSuperAdmin(localStorage.getItem('feedback_role') === 'super_admin');

    function loadData() {
      return Promise.all([
        api.get('/admin/feedbacks').then((response) => setFeedbacks(response.data.feedbacks)),
        api.get('/admin/employee-stats').then((response) => setEmployeeStats(response.data.employeeStats)),
        api.get('/admin/stats').then((response) => setParticipantsCount(response.data.uniqueParticipants)),
        api.get('/user/me').then((response) => setAdminName(response.data.name)).catch(() => setAdminName('Admin'))
      ]).catch(console.error);
    }

    loadData().finally(() => setIsLoading(false));
    const intervalId = setInterval(loadData, 30000);

    api.get('/admin/form-questions').then((response) => setFormQuestions(response.data.questions)).catch(console.error);

    return () => clearInterval(intervalId);
  }, [navigate]);

  async function handleToggleQuestionActive(question: { id: string; is_active: boolean; is_required: boolean }) {
    if (question.is_required) return;
    try {
      const response = await api.put(`/admin/form-questions/${question.id}`, { isActive: !question.is_active });
      setFormQuestions((current) => current.map((item) => (item.id === question.id ? response.data.question : item)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la question:', error);
    }
  }

  async function handleSaveQuestionLabel(questionId: string) {
    const newLabel = questionEdits[questionId];
    if (newLabel === undefined || newLabel.trim().length === 0) return;
    try {
      const response = await api.put(`/admin/form-questions/${questionId}`, { label: newLabel.trim() });
      setFormQuestions((current) => current.map((item) => (item.id === questionId ? response.data.question : item)));
      setQuestionEdits((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });
    } catch (error) {
      console.error('Erreur lors du renommage de la question:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce retour ?')) return;
    try {
      await api.delete(`/admin/feedbacks/${id}`);
      setFeedbacks((current) => current.filter((item) => item.id !== id));
      setEmployeeSynthesisCache({});
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  async function handleDeleteEmployee(id: string, name: string) {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${name} ? Tous les retours qui lui sont adressés seront également supprimés.`)) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployeeStats((current) => current.filter((item) => item.id !== id));
      setFeedbacks((current) => current.filter((item) => item.recipient_id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
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
      setEmployeeSynthesisCache({});
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

  function toggleEmployeeDetail(id: string) {
    setExpandedEmployeeId((current) => (current === id ? null : id));
    setTimeout(() => employeeDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // "Retours" ne montre que les avis sur l'entreprise (pas de synthèse par personne pertinente ici) ;
  // les avis sur les collaborateurs vivent uniquement dans la section "Collaborateurs" (synthèse + détail).
  const filteredFeedbacks = feedbacks.filter((feedback) => feedback.recipient_name?.toLowerCase().includes('entreprise'));

  const globalTotal = feedbacks.length;
  const globalVisible = feedbacks.filter((f) => !f.is_moderated).length;
  const globalHidden = globalTotal - globalVisible;
  const recentFeedbacks = feedbacks.slice(0, 3);

  const filteredEmployeeStats = employeeStats.filter((emp) => !emp.name.toLowerCase().includes('entreprise'));

  useEffect(() => {
    if (!expandedEmployeeId || employeeSynthesisCache[expandedEmployeeId]) return;
    api.get(`/admin/employees/${expandedEmployeeId}/synthesis`)
      .then((response) => setEmployeeSynthesisCache((current) => ({ ...current, [expandedEmployeeId]: response.data })))
      .catch(console.error);
  }, [expandedEmployeeId]);

  async function handleRevealAuthor(feedbackId: string) {
    const reason = window.prompt('Raison de la révélation (obligatoire, tracée dans les logs d\'audit) :');
    if (!reason || reason.trim().length === 0) return;
    try {
      const response = await api.post(`/admin/feedbacks/${feedbackId}/reveal`, { reason: reason.trim() });
      setRevealedAuthors((current) => ({ ...current, [feedbackId]: response.data.author }));
    } catch (error: any) {
      window.alert(error.response?.data?.message || "Impossible de révéler l'auteur.");
    }
  }

  async function handleAddCriterion(event: React.FormEvent) {
    event.preventDefault();
    setNewCriterionMessage('');
    try {
      const response = await api.post('/admin/form-questions', {
        formType: 'colleague',
        questionKey: newCriterionKey.trim(),
        label: newCriterionLabel.trim()
      });
      setFormQuestions((current) => [...current, response.data.question]);
      setNewCriterionKey('');
      setNewCriterionLabel('');
      setNewCriterionMessage('✓ Critère ajouté avec succès.');
    } catch (error: any) {
      setNewCriterionMessage(error.response?.data?.message || "Erreur lors de l'ajout du critère.");
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      <main style={{ padding: 'clamp(20px, 4vw, 40px) clamp(12px, 4vw, 40px)' }}>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
              <div>
                <p className="admin-sidebar-greeting-label">Connecté en tant que</p>
                <p className="admin-sidebar-greeting-name">{adminName || 'Admin'}</p>
              </div>
            </div>

            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`admin-nav-item ${activeSection === item.key ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <div className="admin-content">
        {/* Vue d'ensemble */}
        {activeSection === 'overview' && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Vue d'ensemble</h2>
            {isLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p>Chargement...</p>
              </div>
            ) : (
              <>
                <div className="card-grid" style={{ marginBottom: '40px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Retours</p>
                    <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{globalTotal}</h3>
                  </div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visibles sur l'accueil</p>
                    <h3 style={{ margin: '0', color: '#34C759', fontSize: '2.5rem', fontWeight: 800 }}>{globalVisible}</h3>
                  </div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Masqués de l'accueil</p>
                    <h3 style={{ margin: '0', color: '#64748b', fontSize: '2.5rem', fontWeight: 800 }}>{globalHidden}</h3>
                  </div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Participants</p>
                    <h3 style={{ margin: '0', color: '#51AEE2', fontSize: '2.5rem', fontWeight: 800 }}>{participantsCount}</h3>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Derniers avis</h2>
                  <button onClick={() => setActiveSection('feedbacks')} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    Voir tous les retours →
                  </button>
                </div>

                {recentFeedbacks.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ fontSize: '1rem', color: '#94a3b8' }}>Aucun retour pour le moment.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recentFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="card" style={{ padding: '20px 24px', borderLeft: feedback.is_moderated ? '4px solid #64748b' : '4px solid #34C759' }}>
                        <p style={{ color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                          "{feedback.content.length > 160 ? `${feedback.content.substring(0, 160)}...` : feedback.content}"
                        </p>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                          {feedback.recipient_name && (
                            <span style={{ color: '#51AEE2', fontWeight: 600 }}>📍 {feedback.recipient_name}</span>
                          )}
                          <span style={{ color: '#94a3b8' }}>📅 {new Date(feedback.submitted_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Retours */}
        {activeSection === 'feedbacks' && (
          <section>
            <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Avis sur l'entreprise</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '24px' }}>
              {isLoading ? 'Chargement...' : `${filteredFeedbacks.length} avis sur les conditions de travail / l'entreprise`}
              {' — '}pour les avis sur un collaborateur précis (synthèse + détail), voir <strong>👥 Collaborateurs</strong>.
            </p>

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
        )}

        {/* Collaborateurs */}
        {activeSection === 'employees' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, margin: 0 }}>Espace Collaborateurs</h2>
              <button
                onClick={() => setShowAddForm((current) => !current)}
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.95rem', width: 'auto', minWidth: 'auto' }}
              >
                {showAddForm ? '✕ Annuler' : '＋ Ajouter un collaborateur'}
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '24px' }}>
              Synthèse des retours reçus par chaque collaborateur (ci-dessous). Cliquez sur <strong>🔍 Voir le détail</strong> sur une carte pour afficher les avis individuels de cette personne.
            </p>

            {showAddForm && (
              <form onSubmit={handleRegister} className="form-glass" style={{ margin: '0 0 40px 0', maxWidth: '100%' }}>
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
            )}

            {isLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p>Chargement...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredEmployeeStats.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '24px', gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '1rem', color: '#94a3b8' }}>Aucun collaborateur pour le moment.</p>
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
                          <div style={{ color: '#34C759', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Bon</div>
                        </div>
                        <div style={{ background: 'rgba(255, 149, 0, 0.08)', border: '1.5px solid rgba(255, 149, 0, 0.15)', padding: '8px 4px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF9500' }}>{emp.neutral_feedbacks}</div>
                          <div style={{ color: '#FF9500', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Neutres</div>
                        </div>
                        <div style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1.5px solid rgba(255, 59, 48, 0.15)', padding: '8px 4px', borderRadius: '12px' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF3B30' }}>{emp.negative_feedbacks}</div>
                          <div style={{ color: '#FF3B30', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Moins bon</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => toggleEmployeeDetail(emp.id)}
                          className="btn-secondary"
                          style={{
                            background: 'rgba(0, 75, 156, 0.08)',
                            color: '#004B9C',
                            border: '1.5px solid #004B9C',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            flex: 1
                          }}
                        >
                          {expandedEmployeeId === emp.id ? '✕ Masquer le détail' : '🔍 Voir le détail'}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="btn-danger"
                          style={{
                            background: 'rgba(255, 59, 48, 0.1)',
                            color: '#FF3B30',
                            border: '1.5px solid #FF3B30',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {expandedEmployeeId && (() => {
              const emp = filteredEmployeeStats.find((e) => e.id === expandedEmployeeId);
              if (!emp) return null;
              const synthesis = employeeSynthesisCache[expandedEmployeeId];
              const employeeFeedbacks = feedbacks.filter((f) => f.recipient_id === emp.id && f.feedback_type !== 'conditions');

              if (!synthesis) {
                return (
                  <div ref={employeeDetailRef} className="card" style={{ marginTop: '30px', padding: '28px', textAlign: 'center' }}>
                    <p>Chargement de la synthèse...</p>
                  </div>
                );
              }

              const { criteria, topTags, synthesisText } = synthesis;

              return (
                <div ref={employeeDetailRef} className="card" style={{ marginTop: '30px', padding: '28px', border: '2px solid #004B9C' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: 'var(--color-primary-dark)', fontSize: '1.3rem' }}>🔍 Détail des avis individuels — {emp.name}</h3>

                  {synthesisText && (
                    <div style={{ marginBottom: '24px', background: 'rgba(0, 75, 156, 0.05)', borderRadius: '12px', padding: '18px 20px' }}>
                      <p style={{ margin: '0 0 8px 0', color: '#004B9C', fontWeight: 700, fontSize: '0.85rem' }}>📝 Résumé (identique à ce que {emp.name.split(' ')[0]} voit sur son espace)</p>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.6' }}>{synthesisText}</p>
                    </div>
                  )}

                  {criteria.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontSize: '1rem' }}>Moyenne par critère</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {criteria.map((c) => (
                          <div key={c.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>{c.label}</span>
                              <span style={{ color: '#64748b' }}>{c.average.toFixed(1)}/5 ({c.count})</span>
                            </div>
                            <div style={{ background: '#e2e8f0', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${(c.average / 5) * 100}%`, background: 'linear-gradient(90deg, #004B9C 0%, #51AEE2 100%)', height: '100%' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(topTags.positive.length > 0 || topTags.negative.length > 0) && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontSize: '1rem' }}>Points fréquemment relevés</h4>
                      {topTags.positive.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ color: '#34C759', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>💪 Points forts</p>
                          <div className="tags-container" style={{ borderTop: 'none', padding: 0 }}>
                            {topTags.positive.map((tag) => <span key={tag} className="tag-btn active">{tag}</span>)}
                          </div>
                        </div>
                      )}
                      {topTags.negative.length > 0 && (
                        <div>
                          <p style={{ color: '#FF3B30', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>🎯 Points d'amélioration</p>
                          <div className="tags-container" style={{ borderTop: 'none', padding: 0 }}>
                            {topTags.negative.map((tag) => <span key={tag} className="tag-btn">{tag}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontSize: '1rem' }}>Avis individuels ({employeeFeedbacks.length})</h4>
                  {employeeFeedbacks.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>Aucun avis pour ce collaborateur.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {employeeFeedbacks.map((feedback) => (
                        <div key={feedback.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px' }}>
                          <p style={{ color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>"{feedback.content}"</p>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '10px' }}>
                            <span>📅 {new Date(feedback.submitted_at).toLocaleDateString('fr-FR')}</span>
                            {feedback.rating ? <span>⭐ {feedback.rating}/10</span> : null}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleModerate(feedback.id, !feedback.is_moderated)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: feedback.is_moderated ? 'rgba(52, 199, 89, 0.12)' : 'rgba(148, 163, 184, 0.15)', color: feedback.is_moderated ? '#34C759' : '#64748b', border: 'none' }}
                            >
                              {feedback.is_moderated ? '👁 Afficher' : '👁 Masquer'}
                            </button>
                            <button
                              onClick={() => handleDelete(feedback.id)}
                              className="btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30', border: 'none' }}
                            >
                              🗑 Supprimer
                            </button>
                            {isSuperAdmin && !revealedAuthors[feedback.id] && (
                              <button
                                onClick={() => handleRevealAuthor(feedback.id)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', background: 'rgba(255, 149, 0, 0.15)', color: '#FF9500', border: 'none', fontWeight: 600 }}
                              >
                                🔎 Révéler l'auteur
                              </button>
                            )}
                          </div>
                          {revealedAuthors[feedback.id] && (
                            <div style={{ marginTop: '10px', background: 'rgba(255, 149, 0, 0.1)', border: '1.5px solid #FF9500', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#7a4a00' }}>
                              ⚠️ Auteur : <strong>{revealedAuthors[feedback.id].name}</strong> ({revealedAuthors[feedback.id].email}, {revealedAuthors[feedback.id].position})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* Questions */}
        {activeSection === 'questions' && (
          <section>
            <h2 style={{ color: 'var(--color-primary-dark)', fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Gérer les questions des formulaires</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '30px' }}>
              Renommez ou désactivez les questions posées aux participants. Les questions marquées "Obligatoire" ne peuvent pas être désactivées.
            </p>

            {(['colleague', 'conditions'] as const).map((formType) => (
              <div key={formType} style={{ marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                  {formType === 'colleague' ? '👤 Formulaire collègue' : '🏢 Formulaire conditions de travail'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formQuestions
                    .filter((q) => q.form_type === formType)
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((q) => (
                      <div key={q.id} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
                        <input
                          type="text"
                          value={questionEdits[q.id] ?? q.label}
                          onChange={(e) => setQuestionEdits((current) => ({ ...current, [q.id]: e.target.value }))}
                          style={{ flex: '1 1 280px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                        />
                        <button
                          onClick={() => handleSaveQuestionLabel(q.id)}
                          disabled={questionEdits[q.id] === undefined || questionEdits[q.id].trim() === q.label}
                          className="btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Enregistrer
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={q.is_active}
                            disabled={q.is_required}
                            onChange={() => handleToggleQuestionActive(q)}
                          />
                          {q.is_required ? 'Obligatoire' : (q.is_active ? 'Active' : 'Désactivée')}
                        </label>
                      </div>
                    ))}
                </div>

                {formType === 'colleague' && (
                  <form onSubmit={handleAddCriterion} className="card" style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px', padding: '16px 20px' }}>
                    {newCriterionMessage && (
                      <p style={{ width: '100%', margin: 0, color: newCriterionMessage.startsWith('✓') ? '#34C759' : '#FF3B30', fontSize: '0.85rem', fontWeight: 600 }}>
                        {newCriterionMessage}
                      </p>
                    )}
                    <div style={{ flex: '1 1 160px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Clé technique</label>
                      <input
                        type="text"
                        value={newCriterionKey}
                        onChange={(e) => setNewCriterionKey(e.target.value)}
                        placeholder="ex: proactivite"
                        pattern="[a-zA-Z0-9_]+"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                      />
                    </div>
                    <div style={{ flex: '2 1 280px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Libellé de la question (notée par étoiles)</label>
                      <input
                        type="text"
                        value={newCriterionLabel}
                        onChange={(e) => setNewCriterionLabel(e.target.value)}
                        placeholder="ex: 🚀 Cette personne fait-elle preuve de proactivité ?"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', width: 'auto' }}>
                      ＋ Ajouter le critère
                    </button>
                  </form>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Mon compte */}
        {activeSection === 'security' && (
          <section style={{ display: 'flex', justifyContent: 'center' }}>
            <ChangePasswordForm />
          </section>
        )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdminDashboard;
