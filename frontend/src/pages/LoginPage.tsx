import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { setAuthToken } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, role } = response.data;
      localStorage.setItem('feedback_token', token);
      setAuthToken(token);
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user/me');
      }
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #004B9C 0%, #51AEE2 50%, #004B9C 100%)' }}>
      <Header />

      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '0 clamp(12px, 4vw, 40px)' }}>
        <form onSubmit={handleSubmit} className="form-glass" style={{ maxWidth: '450px' }}>
          <h2>Connexion</h2>

          {error && <p className="message message-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="votre.email@simasurances.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b' }}>
            Contactez votre administrateur pour obtenir un compte.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;
