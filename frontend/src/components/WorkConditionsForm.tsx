import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

interface WorkConditionsFormProps {
  onSubmit?: () => void;
  isCompleted?: boolean;
}

function WorkConditionsForm({ onSubmit, isCompleted }: WorkConditionsFormProps) {
  const [recipientId, setRecipientId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State Answers
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [q6, setQ6] = useState<number | null>(null);
  const [q7, setQ7] = useState<number | null>(null);
  const [q8, setQ8] = useState('');
  const [q9, setQ9] = useState('');
  const [q10, setQ10] = useState<number | null>(null);
  const [q11, setQ11] = useState('');

  useEffect(() => {
    // Participant ID
    let pid = localStorage.getItem('feedback_participant_id');
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem('feedback_participant_id', pid);
    }
    setParticipantId(pid);

    // Get "Entreprise" employee ID
    api.get('/employees')
      .then((response) => {
        const data = response.data.employees as EmployeeOption[];
        const entreprise = data.find(e => e.email === 'entreprise@sim-assurances.ci' || e.name.toLowerCase().includes('entreprise'));
        if (entreprise) {
          setRecipientId(entreprise.id);
        } else if (data.length > 0) {
          setRecipientId(data[0].id);
        }
      })
      .catch((err) => {
        console.error('Erreur lors du chargement de l\'entreprise', err);
      });
  }, []);

  // Validation checks for each step
  const isStep1Valid = q1 !== '' && q2 !== '' && q3 !== null;
  const isStep2Valid = q4 !== '' && q5 !== '' && q6 !== null;
  const isStep3Valid = q7 !== null && q8 !== '' && q9 !== '';
  const isStep4Valid = q10 !== null && q11 !== '';

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
    else if (step === 3 && isStep3Valid) setStep(4);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isStep4Valid || !recipientId) return;

    setIsSubmitting(true);
    setMessage('');

    const generateProse = () => {
      // 1. Outils
      let txtOutils = "";
      if (q1 === "Oui totalement") {
        txtOutils = "Je dispose de tous les outils nécessaires pour mener à bien mes missions au quotidien.";
      } else if (q1 === "Partiellement") {
        txtOutils = "Les outils de travail mis à disposition répondent en partie à mes besoins.";
      } else {
        txtOutils = "Il y a un manque important d'outils adaptés pour travailler efficacement.";
      }

      // 2. Charge
      let txtCharge = "";
      if (q2 === "Oui") {
        txtCharge = "Ma charge de travail reste raisonnable et tout à fait gérable.";
      } else if (q2 === "Parfois") {
        txtCharge = "La charge de travail est parfois intense mais reste globalement surmontable.";
      } else {
        txtCharge = "La charge de travail est malheureusement excessive au quotidien.";
      }

      // 3. Environnement
      let txtEnv = "";
      if (q3 === 5) txtEnv = "Les locaux et le cadre physique de travail sont exceptionnels.";
      else if (q3 === 4) txtEnv = "L'environnement physique de travail est très agréable.";
      else if (q3 === 3) txtEnv = "Le cadre physique de travail est correct mais mériterait d'être modernisé.";
      else txtEnv = "L'environnement physique de travail laisse à désirer.";

      // 4. Consignes
      let txtConsignes = "";
      if (q4 === "Toujours") {
        txtConsignes = "Les objectifs et consignes sont toujours communiqués avec une clarté exemplaire.";
      } else if (q4 === "Souvent") {
        txtConsignes = "La communication des objectifs et des consignes est généralement bien structurée.";
      } else if (q4 === "Rarement") {
        txtConsignes = "La transmission des consignes manque parfois de clarté.";
      } else {
        txtConsignes = "Les consignes et les objectifs sont très confus.";
      }

      // 5. Écoute
      let txtEcoute = "";
      if (q5 === "Oui") {
        txtEcoute = "Je me sens pleinement écouté(e) et soutenu(e) par la hiérarchie.";
      } else if (q5 === "Parfois") {
        txtEcoute = "L'écoute de la part du management est fluctuante selon les situations.";
      } else {
        txtEcoute = "Je ne me sens pas écouté(e) face à mes préoccupations.";
      }

      // 6. Comm interne
      let txtComm = "";
      if (q6 && q6 >= 4) txtComm = "La communication interne est fluide et efficace.";
      else if (q6 === 3) txtComm = "La communication interne est convenable mais reste perfectible.";
      else txtComm = "La communication interne est insuffisante.";

      // 7. Reconnaissance
      let txtRec = "";
      if (q7 && q7 >= 4) txtRec = "Je me sens motivé(e) et mon investissement est régulièrement valorisé.";
      else if (q7 === 3) txtRec = "Ma motivation est stable, bien que la reconnaissance pourrait être plus fréquente.";
      else txtRec = "Je ressens une baisse de motivation due à un manque de reconnaissance.";

      // 8. Ambiance
      let txtAmb = "";
      if (q8 === "Excellente") {
        txtAmb = "L'ambiance au sein de l'équipe est excellente, marquée par une grande cohésion.";
      } else if (q8 === "Bonne") {
        txtAmb = "Il règne une bonne ambiance de travail et une bonne entente générale.";
      } else if (q8 === "Moyenne") {
        txtAmb = "L'ambiance au sein de l'équipe est neutre, avec parfois quelques tensions.";
      } else {
        txtAmb = "Les relations au sein de l'équipe sont compliquées.";
      }

      // 9. Évolution
      let txtEvol = "";
      if (q9 === "Oui") {
        txtEvol = "Je perçois de réelles perspectives d'évolution au sein de la structure.";
      } else if (q9 === "Peut-être") {
        txtEvol = "Les perspectives d'évolution sont incertaines mais envisageables à l'avenir.";
      } else {
        txtEvol = "Je ne vois pas de réelles perspectives d'évolution professionnelle.";
      }

      // 10. Satisfaction
      let txtSat = "";
      if (q10 && q10 >= 4) txtSat = "Travailler ici est une expérience très positive.";
      else if (q10 === 3) txtSat = "Mon expérience globale de travail est convenable sans être exceptionnelle.";
      else txtSat = "Je ressens une insatisfaction globale concernant mon travail dans l'entreprise.";

      // 11. Recommandation
      let txtRecommand = "";
      if (q11 === "Oui") {
        txtRecommand = "Je recommande SIM Assurances comme un excellent employeur.";
      } else if (q11 === "Peut-être") {
        txtRecommand = "Je recommanderais l'entreprise avec quelques réserves.";
      } else {
        txtRecommand = "Je ne recommanderais pas l'entreprise actuellement.";
      }

      return `${txtOutils} ${txtCharge} ${txtEnv} ${txtConsignes} ${txtEcoute} ${txtComm} ${txtRec} ${txtAmb} ${txtEvol} ${txtSat} ${txtRecommand}`;
    };

    const finalContent = generateProse();

    try {
      await api.post('/feedbacks/submit', {
        recipientId,
        content: finalContent,
        rating: q10, // Utilise la satisfaction globale Q10 comme note
        participantId
      });

      setMessage('Merci pour votre retour précieux ! Vos réponses ont été enregistrées.');
      setMessageType('success');
      
      // Reset form
      setQ1('');
      setQ2('');
      setQ3(null);
      setQ4('');
      setQ5('');
      setQ6(null);
      setQ7(null);
      setQ8('');
      setQ9('');
      setQ10(null);
      setQ11('');
      setStep(1);

      if (onSubmit) {
        setTimeout(() => onSubmit(), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper component for Slider
  const renderSlider = (value: number | null, onChange: (val: number) => void) => {
    const displayVal = value === null ? 3 : value;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', margin: '8px 0' }}>
        <input
          type="range"
          min="1"
          max="5"
          value={displayVal}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#004B9C',
            height: '8px',
            borderRadius: '4px',
            background: '#e2e8f0',
            outline: 'none',
            margin: '12px 0'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              type="button"
              key={val}
              onClick={() => onChange(val)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                fontSize: '0.9rem',
                fontWeight: value === val ? 700 : 500,
                color: value === val ? '#004B9C' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: value === val ? 'scale(1.2)' : 'scale(1)'
              }}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="form-glass">
      {isCompleted && (
        <p className="message message-info">
          Merci ! Vous avez déjà soumis ce formulaire. Pour un retour complet, pensez à remplir le formulaire collaborateur à côté.
        </p>
      )}
      {message && <p className={`message message-${messageType}`}>{message}</p>}

      {/* Progress Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
        {/* Connection Line */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          right: '20px',
          height: '4px',
          background: '#cbd5e1',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          width: `${((step - 1) / 3) * 100}%`,
          height: '4px',
          background: 'linear-gradient(90deg, #004B9C 0%, #51AEE2 100%)',
          zIndex: 0,
          transition: 'width 0.3s ease'
        }} />

        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s} 
            onClick={() => {
              // Aller à une étape déjà validée ou directement accessible
              if (s === 1) setStep(1);
              else if (s === 2 && isStep1Valid) setStep(2);
              else if (s === 3 && isStep1Valid && isStep2Valid) setStep(3);
              else if (s === 4 && isStep1Valid && isStep2Valid && isStep3Valid) setStep(4);
            }}
            style={{ 
              zIndex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              cursor: (s === 1 || (s === 2 && isStep1Valid) || (s === 3 && isStep1Valid && isStep2Valid) || (s === 4 && isStep1Valid && isStep2Valid && isStep3Valid)) ? 'pointer' : 'not-allowed'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step === s 
                ? '#004B9C' 
                : (step > s ? '#34C759' : 'white'),
              border: '2px solid',
              borderColor: step >= s ? '#004B9C' : '#cbd5e1',
              color: step === s ? 'white' : (step > s ? 'white' : '#64748b'),
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: step === s ? '0 4px 10px rgba(0, 75, 156, 0.3)' : 'none'
            }}>
              {step > s ? '✓' : s}
            </div>
            <span style={{ 
              fontSize: '0.7rem', 
              marginTop: '6px', 
              fontWeight: step === s ? 700 : 500,
              color: step === s ? '#004B9C' : '#64748b'
            }}>
              Étape {s}
            </span>
          </div>
        ))}
      </div>

      {/* Stepper Sections */}
      <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#004B9C', fontSize: '1.25rem', textAlign: 'center' }}>
              🍀 Section 1 : Environnement de travail
            </h3>

            {/* Q1 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                🛠️ Tu disposes des outils nécessaires pour bien travailler ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Oui totalement', 'Partiellement', 'Non'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q1 === option ? 'active' : ''}`}
                    onClick={() => setQ1(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                ⚖️ Ta charge de travail est raisonnable ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Oui', 'Parfois', 'Non'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q2 === option ? 'active' : ''}`}
                    onClick={() => setQ2(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                🏢 Ton environnement de travail est satisfaisant ?
              </span>
              {renderSlider(q3, setQ3)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#004B9C', fontSize: '1.25rem', textAlign: 'center' }}>
              🤝 Section 2 : Management
            </h3>

            {/* Q4 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                📢 Les objectifs et consignes sont clairement communiqués ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Toujours', 'Souvent', 'Rarement', 'Jamais'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q4 === option ? 'active' : ''}`}
                    onClick={() => setQ4(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                👂 Tu te sens écouté(e) lorsque tu exprimes une préoccupation ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Oui', 'Parfois', 'Non'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q5 === option ? 'active' : ''}`}
                    onClick={() => setQ5(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Q6 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                🗣️ La communication interne est efficace ?
              </span>
              {renderSlider(q6, setQ6)}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#004B9C', fontSize: '1.25rem', textAlign: 'center' }}>
              ✨ Section 3 : Motivation & ambiance
            </h3>

            {/* Q7 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                🚀 Tu te sens motivé(e) et reconnu(e) dans ton travail ?
              </span>
              {renderSlider(q7, setQ7)}
            </div>

            {/* Q8 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                🎭 L'ambiance au sein de l'équipe est ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Excellente', 'Bonne', 'Moyenne', 'Mauvaise'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q8 === option ? 'active' : ''}`}
                    onClick={() => setQ8(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Q9 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                📈 Tu vois des perspectives d'évolution pour toi ici ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Oui', 'Peut-être', 'Non'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q9 === option ? 'active' : ''}`}
                    onClick={() => setQ9(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#004B9C', fontSize: '1.25rem', textAlign: 'center' }}>
              🎯 Section 4 : Satisfaction globale
            </h3>

            {/* Q10 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                💖 Globalement tu es satisfait(e) de travailler ici ?
              </span>
              {renderSlider(q10, setQ10)}
            </div>

            {/* Q11 */}
            <div className="criterion-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '20px' }}>
              <span className="criterion-label" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                💌 Tu recommanderais SIM Assurances comme lieu de travail ?
              </span>
              <div className="tags-container" style={{ justifyContent: 'center', borderTop: 'none', padding: 0 }}>
                {['Oui', 'Peut-être', 'Non'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`tag-btn ${q11 === option ? 'active' : ''}`}
                    onClick={() => setQ11(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="form-buttons">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting}
          className="btn-secondary"
          style={{
            background: 'none',
            border: '2px solid #004B9C',
            color: '#004B9C',
            borderRadius: '50px',
            fontWeight: 700,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            opacity: step === 1 ? 0.4 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Précédent
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (step === 1 && !isStep1Valid) ||
              (step === 2 && !isStep2Valid) ||
              (step === 3 && !isStep3Valid)
            }
            className="btn-primary"
            style={{
              border: '2px solid transparent',
              borderRadius: '50px',
              fontWeight: 700,
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Suivant
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isStep4Valid || isSubmitting || !recipientId}
            className="btn-primary"
            style={{
              border: '2px solid transparent',
              borderRadius: '50px',
              fontWeight: 700,
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </button>
        )}
      </div>
    </form>
  );
}

export default WorkConditionsForm;
