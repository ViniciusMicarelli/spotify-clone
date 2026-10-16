import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [fields, setFields] = useState({ name: '', avatar: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { setFields({ name: user?.name || '', avatar: user?.avatar || '' }); }, [user?.id, user?.name, user?.avatar]);
  if (!user) return <section><h1>Meu perfil</h1><p><Link to="/auth/login">Entre para editar seu perfil.</Link></p></section>;
  async function submit(event) {
    event.preventDefault(); setPending(true); setError(''); setSaved(false);
    const result = await updateProfile(fields);
    setPending(false);
    if (result.success) setSaved(true); else setError(result.error);
  }
  return <section className="profile-page"><p className="eyebrow">SUA CONTA</p><h1>Meu perfil</h1><form onSubmit={submit}>
    <label>Usuário<input value={user.username} readOnly /></label><label>Email<input value={user.email} readOnly /></label>
    <label>Nome de exibição<input required maxLength={100} value={fields.name} onChange={event => { setFields({ ...fields, name: event.target.value }); setSaved(false); }} /></label>
    <label>URL da foto<input type="url" maxLength={2048} placeholder="https://exemplo.com/foto.jpg" value={fields.avatar} onChange={event => { setFields({ ...fields, avatar: event.target.value }); setSaved(false); }} /></label>
    <p className="muted">Deixe a URL vazia para remover a foto.</p>{error && <p role="alert">{error}</p>}{saved && <p role="status">Perfil atualizado.</p>}
    <button disabled={pending}>{pending ? 'Salvando…' : 'Salvar perfil'}</button>
  </form></section>;
}
