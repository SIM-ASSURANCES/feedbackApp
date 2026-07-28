import { useState, FormEvent } from 'react';
import api from '../services/api';

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    if (newPassword.length < 6) {
      setMessage('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('La confirmation ne correspond pas au nouveau mot de passe.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put('/user/me/password', { currentPassword, newPassword });
      setMessage('✓ Mot de passe mis à jour avec succès.');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-glass" style={{ maxWidth: '450px' }}>
      <h2>🔑 Changer mon mot de passe</h2>

      {message && <p className={`message message-${messageType}`}>{message}</p>}

      <div className="form-group">
        <label htmlFor="currentPassword">Mot de passe actuel</label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="newPassword">Nouveau mot de passe</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
      </button>
    </form>
  );
}

export default ChangePasswordForm;
