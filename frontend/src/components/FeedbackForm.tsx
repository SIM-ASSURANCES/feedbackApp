import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

interface EmployeeOption {
  id: string;
  name: string;
  position: string;
}

interface Props {
  onSubmit: () => void;
}

function FeedbackForm({ onSubmit }: Props) {
  const [recipientId, setRecipientId] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validation côté client
    if (content.length < 20 || content.length > 500) {
      setMessage('La critique doit contenir entre 20 et 500 caractères.');
      setMessageType('error');
      return;
    }

    const spamWords = ['spam', 'test', 'fake', 'dummy'];
    const lowerContent = content.toLowerCase();
    if (spamWords.some(word => lowerContent.includes(word))) {
      setMessage('Le contenu contient des mots inappropriés.');
      setMessageType('error');
      return;
    }

    try {
      await api.post('/feedbacks/submit', { recipientId, content, rating });
      setMessage('✓ Feedback envoyé avec succès ! Merci pour votre retour.');
      setMessageType('success');
      setContent('');
      setRecipientId('');
      setRating(0);
      setTimeout(onSubmit, 1000);
    } catch (error) {
      setMessage('Erreur lors de la soumission. Veuillez réessayer.');
      setMessageType('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-glass">
      {message && <p className={`message message-${messageType}`}>{message}</p>}

      <div className="form-group">
        <label htmlFor="recipient">À qui adresser cette critique ?</label>
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

      <div className="form-group">
        <label htmlFor="content">Votre critique constructive</label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          required
          placeholder="Partagez vos pensées honnêtes et bienveillantes..."
          style={{ fontFamily: 'inherit' }}
        />
        <small style={{ display: 'block', marginTop: '8px', color: content.length < 20 || content.length > 500 ? '#FF3B30' : '#64748b' }}>
          {content.length}/500 caractères (minimum 20)
        </small>
      </div>

      <div className="form-group">
        <label>Note de satisfaction</label>
        <div style={{ display: 'flex', gap: '8px', fontSize: '2rem', cursor: 'pointer' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span 
              key={star} 
              onClick={() => setRating(star)}
              style={{ color: star <= rating ? '#FF9500' : '#cbd5e1' }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Envoyer mon avis
      </button>
    </form>
  );
}

export default FeedbackForm;
