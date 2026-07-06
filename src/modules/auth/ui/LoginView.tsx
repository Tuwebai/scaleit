import { useState } from 'react';
import { signInWithLogin } from '../infrastructure/authService';
import { humanizeError } from '../../../shared/errors/humanizeError';
import { logoUrl } from '../../../shared/config/brand';

export function LoginView() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithLogin(identifier, password);
    } catch (unknownError) {
      setError(humanizeError(unknownError, 'No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app auth-app">
      <main className="main auth-main">
        <img className="auth-logo" src={logoUrl} alt="Scaleit" />
        <section className="card auth-card">
          <div className="card-title">
            <div>
              <h2>Iniciar sesión</h2>
            </div>
          </div>
          <div className="form-grid auth-form">
            <input placeholder="Email o usuario" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-btn full" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </section>
      </main>
    </div>
  );
}
