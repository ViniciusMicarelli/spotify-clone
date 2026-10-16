import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login({ signup = false }) {
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (isAuthenticated) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setPending(true); setError('');
    const result = signup ? await signUp(fields.username, fields.email, fields.password) : await signIn(fields.username, fields.password);
    setPending(false);
    if (result.success) navigate('/'); else setError(result.error);
  }
  return <main className="auth-card"><Link to="/">♫ Spotify Clone</Link><h1>{signup ? 'Criar conta' : 'Entrar'}</h1>
    <form onSubmit={submit}>{['username', ...(signup ? ['email'] : []), 'password'].map(field => <label key={field}>{ { username: 'Usuário', email: 'Email', password: 'Senha' }[field]}<input required type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} minLength={field === 'password' && signup ? 8 : undefined} autoComplete={field === 'password' ? signup ? 'new-password' : 'current-password' : field} value={fields[field]} onChange={e => setFields({ ...fields, [field]: e.target.value })} /></label>)}
    {error && <p role="alert">{error}</p>}<button disabled={pending}>{pending ? 'Aguarde…' : signup ? 'Cadastrar' : 'Entrar'}</button></form>
    <p><Link to={signup ? '/auth/login' : '/auth/signup'}>{signup ? 'Já tenho uma conta' : 'Criar uma conta'}</Link></p>
    {!signup && <p className="muted">Demo: demo_user / password123</p>}
  </main>;
}
