export const Signin = () => {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.target);

    const email = formData.get('email');
    const password = formData.get('password');

    if (email === undefined || password === undefined) {
      setError('Preencha todos os campos');
      return;
    }

    loginAndStoreUserData({ email, password });

    if (email.includes('work-mabu-financeiro-mabu')) {
      router.push('/dashboard');
    }

    navigateToUserSettings();
  };

  return (
    <div className="auth-form">
      <div className="auth-form__title">
        <h2>Bem vindo de volta</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="auth-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" required placeholder="you@example.com" />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Entrar</button>

        <button type="button" onClick={handleSignup} className="btn--secondary">
          Criar conta
        </button>
      </form>

      <div className="auth-form__divider">
        <span>ou entre com</span>
      </div>

      <button type="button" className="btn--facebook">
        <svg viewBox="0 0 32 32">
          <path
            fill="currentColor"
            d="M19.5 26.5V19h5.5c.6 0 1-.4 1-1v-5.5c0-.6-.4-1-1-1h-5.5v-5.5c0-.6-.4-1-1-1H7.5C3.6 0 0 3.6 0 8.5v15c0 4.9 4 8.5 8.5 8.5h11c4.9 0 8.5-3.6 8.5-8.5V8.5c0-5.4-3.9-8.5-9-8.5H7V26.5h12.5z"
          />
        </svg>
        Entrar com Facebook
      </button>
    </div>
  );
};

export default Signin;
