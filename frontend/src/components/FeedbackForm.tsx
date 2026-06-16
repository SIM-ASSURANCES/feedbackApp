import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

interface EmployeeOption {
  id: string;
  name: string;
  position: string;
  email?: string;
}

interface Props {
  onSubmit: () => void;
}

function FeedbackForm({ onSubmit }: Props) {
  const [recipientId, setRecipientId] = useState('');
  
  // Critères
  const [scores, setScores] = useState({
    workQuality: 0,
    communication: 0,
    teamwork: 0,
    atmosphere: 0,
    cooperation: 0,
    deadlines: 0
  });
  const [globalRating, setGlobalRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({
    workQuality: [],
    communication: [],
    teamwork: [],
    atmosphere: [],
    cooperation: [],
    deadlines: []
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [participantId, setParticipantId] = useState('');

  useEffect(() => {
    // Gérer l'identifiant de participant anonyme
    let pid = localStorage.getItem('feedback_participant_id');
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem('feedback_participant_id', pid);
    }
    setParticipantId(pid);

    api
      .get('/employees')
      .then((response) => {
        const data = response.data.employees as EmployeeOption[];
        const entreprise = data.find(e => e.email === 'entreprise@sim-assurances.ci' || e.name.toLowerCase().includes('entreprise'));
        if (entreprise) {
          const others = data.filter(e => e.id !== entreprise.id);
          setEmployees([entreprise, ...others]);
        } else {
          setEmployees(data);
        }
      })
      .catch(() => setEmployees([]));
  }, []);

  function generateComment(s: typeof scores, t: typeof selectedTags, global: number) {
    const getPhrase = (score: number, key: string, pos: string, neu: string, neg: string) => {
      if (score === 0) return '';
      let basePhrase = '';
      if (score >= 4) basePhrase = pos;
      else if (score === 3) basePhrase = neu;
      else basePhrase = neg;

      const tags = t[key as keyof typeof t];
      if (tags && tags.length > 0) {
        basePhrase += ` Points notés : ${tags.join(', ')}.`;
      }
      return basePhrase;
    };

    const pQuality = getPhrase(s.workQuality, 'workQuality', "Le travail collaboratif avec ce membre de l'équipe est d'une excellente qualité, productif et fluide.", "La qualité du travail en collaboration avec ce collègue est globalement satisfaisante.", "La collaboration professionnelle rencontre des difficultés et manque d'efficacité au quotidien.");
    const pComm = getPhrase(s.communication, 'communication', "La communication est particulièrement claire, transparente et réactive.", "Les échanges sont corrects et fonctionnels dans l'ensemble.", "Un manque de clarté et de réactivité dans la communication complique parfois la coordination.");
    const pTeamwork = getPhrase(s.teamwork, 'teamwork', "L'esprit d'équipe est remarquable, favorisant une excellente synergie collective.", "La participation au travail d'équipe est adéquate.", "L'implication dans la dynamique d'équipe gagnerait à être renforcée.");
    const pAtmosphere = getPhrase(s.atmosphere, 'atmosphere', "Cette personne contribue activement à instaurer une atmosphère de travail positive et bienveillante.", "Son attitude s'intègre normalement à l'ambiance de l'équipe.", "Des tensions ou une réserve excessive peuvent nuire à la convivialité au travail.");
    const pCoop = getPhrase(s.cooperation, 'cooperation', "La disponibilité et l'esprit de coopération de ce collaborateur sont exemplaires.", "La disponibilité reste correcte selon les besoins du service.", "Une plus grande disponibilité et volonté d'entraide seraient appréciables.");
    const pDeadlines = getPhrase(s.deadlines, 'deadlines', "Les engagements et délais fixés sont rigoureusement respectés par ce collaborateur.", "Les échéances sont généralement tenues.", "Le non-respect régulier des délais d'engagement pose des difficultés d'organisation.");

    let globalPhrase = "";
    if (global >= 9) {
      globalPhrase = "L'évaluation globale de ce collaborateur est extrêmement positive, témoignant d'une collaboration de très haut niveau.";
    } else if (global >= 7) {
      globalPhrase = "L'évaluation globale indique un niveau de collaboration très satisfaisant.";
    } else if (global >= 5) {
      globalPhrase = "L'évaluation globale de la collaboration est moyenne.";
    } else {
      globalPhrase = "L'évaluation globale reflète d'importantes marges de progression dans la relation professionnelle.";
    }

    return `${pQuality} ${pComm} ${pTeamwork} ${pAtmosphere} ${pCoop} ${pDeadlines} ${globalPhrase}`.trim();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validation
    if (Object.values(scores).some(score => score === 0)) {
      setMessage('Veuillez noter tous les critères avant de valider.');
      setMessageType('error');
      return;
    }
    if (globalRating === 0) {
      setMessage('Veuillez attribuer une note globale avant de valider.');
      setMessageType('error');
      return;
    }

    const generatedContent = generateComment(scores, selectedTags, globalRating);

    try {
      await api.post('/feedbacks/submit', { recipientId, content: generatedContent, rating: globalRating, participantId });
      setMessage('✓ Feedback envoyé avec succès ! Merci pour votre retour totalement anonyme.');
      setMessageType('success');
      setScores({ workQuality: 0, communication: 0, teamwork: 0, atmosphere: 0, cooperation: 0, deadlines: 0 });
      setGlobalRating(0);
      setSelectedTags({ workQuality: [], communication: [], teamwork: [], atmosphere: [], cooperation: [], deadlines: [] });
      setRecipientId('');
      setTimeout(onSubmit, 1500);
    } catch (error) {
      setMessage('Erreur lors de la soumission. Veuillez réessayer.');
      setMessageType('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-glass">
      {message && <p className={`message message-${messageType}`}>{message}</p>}

      <div className="form-group">
        <label htmlFor="recipient">Parlez-nous de ce collaborateur :</label>
        <select 
          id="recipient"
          value={recipientId} 
          onChange={(event) => setRecipientId(event.target.value)} 
          required
        >
          <option value="">Sélectionnez un employé</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} - {employee.position || 'Employé'}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '32px' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
          Le système rédigera automatiquement le commentaire final en fonction de vos notes pour garantir un <b>anonymat absolu</b>.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { key: 'workQuality', label: '💼 Comment évaluez-vous la qualité de votre travail avec ce collaborateur ?' },
            { key: 'communication', label: '🗣️ Cette personne communique-t-elle efficacement ?' },
            { key: 'teamwork', label: '🤝 Cette personne favorise-t-elle un bon esprit d\'équipe ?' },
            { key: 'atmosphere', label: '✨ Cette personne contribue-t-elle à une bonne ambiance au travail ?' },
            { key: 'cooperation', label: '🙋 Cette personne est-elle disponible et coopérative ?' },
            { key: 'deadlines', label: '⏳ Cette personne respecte-t-elle les délais d\'engagements ?' }
          ].map(criterion => (
            <div key={criterion.key} className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, display: 'block', width: '100%', textAlign: 'center' }}>
                {criterion.label}
              </span>
              <div style={{ display: 'flex', gap: '10px', fontSize: '2rem', cursor: 'pointer', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star}
                    className="star-icon"
                    onClick={() => {
                      if (scores[criterion.key as keyof typeof scores] !== star) {
                        setScores(prev => ({ ...prev, [criterion.key]: star }));
                        setSelectedTags(prev => ({ ...prev, [criterion.key]: [] }));
                      }
                    }}
                    style={{ 
                      color: star <= scores[criterion.key as keyof typeof scores] ? '#FF9500' : '#cbd5e1',
                      filter: star <= scores[criterion.key as keyof typeof scores] ? 'drop-shadow(0 2px 4px rgba(255, 149, 0, 0.3))' : 'none'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              
              {scores[criterion.key as keyof typeof scores] > 0 && (
                <div className="tags-container" style={{ justifyContent: 'center' }}>
                  {(() => {
                    const TAGS_DEFINITIONS: Record<string, { pos: string[], neu: string[], neg: string[] }> = {
                      workQuality: { 
                        pos: ['Très efficace', 'Fluide', 'Productif', 'Complémentaire'], 
                        neu: ['Correct', 'Standard', 'À améliorer', 'Parfois lent'], 
                        neg: ['Difficile', 'Inefficace', 'Désorganisé', 'Pas de suivi'] 
                      },
                      communication: { 
                        pos: ['Clair', 'Réactif', 'À l\'écoute', 'Transparent'], 
                        neu: ['Standard', 'Assez discret', 'Communication minimale'], 
                        neg: ['Trop direct', 'Fermé', 'Réponses lentes', 'Peu clair'] 
                      },
                      teamwork: { 
                        pos: ['Solidaire', 'Fédérateur', 'Bon soutien', 'Encourageant'], 
                        neu: ['Indifférent', 'Fait sa part', 'Peu participatif'], 
                        neg: ['Individualiste', 'Divise l\'équipe', 'Pas d\'entraide'] 
                      },
                      atmosphere: { 
                        pos: ['Souriant', 'Bienveillant', 'Positif', 'Humoristique'], 
                        neu: ['Neutre', 'Calme', 'Très réservé'], 
                        neg: ['Humeur changeante', 'Créateur de tensions', 'Froid/Distant'] 
                      },
                      cooperation: { 
                        pos: ['Toujours disponible', 'Très coopératif', 'Serviable', 'Flexible'], 
                        neu: ['Disponible parfois', 'Coopère au besoin'], 
                        neg: ['Indisponible', 'Peu coopératif', 'Refuse d\'aider'] 
                      },
                      deadlines: { 
                        pos: ['Toujours à l\'heure', 'Respecte les échéances', 'Très fiable', 'Organisé'], 
                        neu: ['Délais parfois dépassés', 'Respecte l\'essentiel'], 
                        neg: ['Souvent en retard', 'Ne respecte pas ses engagements', 'Ralentit le travail'] 
                      }
                    };
                    const score = scores[criterion.key as keyof typeof scores];
                    const tagCategory = score >= 4 ? 'pos' : (score === 3 ? 'neu' : 'neg');
                    const availableTags = TAGS_DEFINITIONS[criterion.key][tagCategory];
                    
                    return availableTags.map(tag => {
                      const isSelected = selectedTags[criterion.key as keyof typeof selectedTags].includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          className={`tag-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedTags(prev => {
                              const current = prev[criterion.key as keyof typeof prev];
                              const updated = isSelected ? current.filter(t => t !== tag) : [...current, tag];
                              return { ...prev, [criterion.key]: updated };
                            });
                          }}
                        >
                          {tag}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Global Rating */}
        <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', marginTop: '24px', padding: '20px' }}>
          <span className="criterion-label" style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, display: 'block', width: '100%', textAlign: 'center' }}>
            🎯 Globalement, comment évaluez-vous ce collaborateur ?
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setGlobalRating(num)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: globalRating === num ? '#004B9C' : '#cbd5e1',
                  background: globalRating === num ? '#004B9C' : 'white',
                  color: globalRating === num ? 'white' : '#64748b',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  boxShadow: globalRating === num ? '0 4px 12px rgba(0, 75, 156, 0.25)' : 'none'
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" style={{ display: 'block', margin: '0 auto', width: 'auto' }}>
        Envoyer mon avis
      </button>
    </form>
  );
}

export default FeedbackForm;
