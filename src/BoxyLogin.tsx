import { Circle, CircleArrowRight, CircleCheck, CircleHelp, CircleX, LogIn, Lock, User } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import styles from './BoxyLogin.module.scss';
import { loadGoogle, requestGoogleAccessToken } from './google';

export interface Credentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface BoxyLoginProps {
  /** Resolves to whether the credentials are valid. */
  authenticate: (credentials: Credentials) => boolean | Promise<boolean>;
  /** Adds a "sign in with Google" button to the first face. */
  google?: {
    clientId: string;
    /** Receives a Google OAuth access token; resolves to whether it is valid. */
    authenticate: (accessToken: string) => boolean | Promise<boolean>;
  };
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.87-3A7.17 7.17 0 0 1 12 19.27a7.2 7.2 0 0 1-6.76-4.97H1.24v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.24 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.24a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.73c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.24 6.6l4 3.1A7.2 7.2 0 0 1 12 4.73Z"
      />
    </svg>
  );
}

/** Which face of the box is showing. */
type Step = 'start' | 'username' | 'password' | 'remember' | 'result';
type Field = 'username' | 'password';
type Outcome = 'success' | 'failure';

export function BoxyLogin({ authenticate, google }: BoxyLoginProps) {
  const id = useId();
  const [step, setStep] = useState<Step>('start');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // fields the user tried to skip: they get a nudge in their placeholder
  const [prompted, setPrompted] = useState<Field[]>([]);
  const [shaking, setShaking] = useState(false);
  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const gsi = useRef<Awaited<ReturnType<typeof loadGoogle>>>(undefined);

  // load Google's script up front: its popup can only open straight from a click
  const googleClientId = google?.clientId;
  useEffect(() => {
    if (googleClientId)
      loadGoogle().then(
        (loaded) => (gsi.current = loaded),
        () => undefined,
      );
  }, [googleClientId]);

  useEffect(() => {
    if (step === 'username') usernameInput.current?.focus({ preventScroll: true });
    if (step === 'password') passwordInput.current?.focus({ preventScroll: true });
  }, [step]);

  const reject = (field: Field) => {
    setPrompted((fields) => (fields.includes(field) ? fields : [...fields, field]));
    setShaking(true);
  };

  const advance = async () => {
    switch (step) {
      case 'start':
        return setStep('username');
      case 'username':
        return username ? setStep('password') : reject('username');
      case 'password':
        return password ? setStep('remember') : reject('password');
      case 'remember':
        return finish(() => authenticate({ username, password, rememberMe }));
      case 'result':
        // a failed login invites another go; a successful one is done
        if (outcome === 'failure') {
          setPassword('');
          setOutcome(null);
          setStep('username');
        }
    }
  };

  const finish = async (check: () => boolean | Promise<boolean>) => {
    setOutcome(null);
    setStep('result');
    try {
      setOutcome((await check()) ? 'success' : 'failure');
    } catch {
      setOutcome('failure');
    }
  };

  const loginWithGoogle = async () => {
    if (!google || !gsi.current) return;
    let token: string;
    try {
      token = await requestGoogleAccessToken(gsi.current, google.clientId);
    } catch {
      return; // popup closed or blocked: stay on the first face
    }
    await finish(() => google.authenticate(token));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void advance();
  };

  // Only the visible face is interactive, and only its button submits (so Enter advances the right step).
  const faceProps = (own: Step) => ({ inert: step !== own });
  const buttonType = (own: Step) => (step === own ? 'submit' : 'button');

  const placeholder = (field: Field) => (prompted.includes(field) ? `enter your ${field} to continue` : field);

  return (
    <div
      className={styles.wrapper}
      data-shaking={shaking}
      onAnimationEnd={(event) => event.target === event.currentTarget && setShaking(false)}
    >
      <form name="boxy-login-form" onSubmit={onSubmit} noValidate>
        <fieldset className={styles.fieldset}>
          <div className={styles.inner} data-step={step}>
            <div className={`${styles.cap} ${styles.left}`} {...faceProps('start')}>
              <button className={styles.button} type={buttonType('start')} title="login" aria-label="Begin login">
                <User className={styles.icon} aria-hidden />
              </button>
              {google && (
                <button
                  className={styles.button}
                  type="button"
                  title="sign in with Google"
                  aria-label="Sign in with Google"
                  onClick={() => void loginWithGoogle()}
                >
                  <GoogleIcon className={styles.icon} />
                </button>
              )}
            </div>

            <div className={`${styles.side} ${styles.front}`} {...faceProps('username')}>
              <User className={styles.icon} aria-hidden />
              <label className={styles.field}>
                <input
                  ref={usernameInput}
                  name="username"
                  aria-label="username"
                  aria-invalid={prompted.includes('username') && !username}
                  title="enter your username"
                  placeholder={placeholder('username')}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <button className={styles.button} type={buttonType('username')} aria-label="Next: password">
                <CircleArrowRight className={styles.icon} aria-hidden />
              </button>
            </div>

            <div className={`${styles.side} ${styles.bottom}`} {...faceProps('password')}>
              <Lock className={styles.icon} aria-hidden />
              <label className={styles.field}>
                <input
                  ref={passwordInput}
                  type="password"
                  name="password"
                  aria-label="password"
                  aria-invalid={prompted.includes('password') && !password}
                  title="enter your password"
                  placeholder={placeholder('password')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <button className={styles.button} type={buttonType('password')} aria-label="Next: remember me">
                <CircleArrowRight className={styles.icon} aria-hidden />
              </button>
            </div>

            <div className={`${styles.side} ${styles.back}`} {...faceProps('remember')}>
              {rememberMe ? (
                <CircleCheck className={`${styles.icon} ${styles.checked}`} aria-hidden />
              ) : (
                <Circle className={styles.icon} aria-hidden />
              )}
              <label className={`${styles.field} ${styles.remember}`} htmlFor={`${id}-remember`}>
                <input
                  id={`${id}-remember`}
                  className={styles.visuallyHidden}
                  type="checkbox"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                remember me next time?
              </label>
              <button className={styles.button} type={buttonType('remember')} aria-label="Log in">
                <LogIn className={styles.icon} aria-hidden />
              </button>
            </div>

            {/* Reserved for "forgot your password": the legacy code never navigated here, so it stays out of reach. */}
            <div className={`${styles.side} ${styles.top}`} inert>
              <CircleHelp className={styles.icon} aria-hidden />
              <label className={styles.field}>
                <input
                  type="email"
                  name="email"
                  aria-label="email"
                  title="we'll email login details."
                  placeholder="email"
                />
              </label>
              <button className={styles.button} type="button" aria-label="Send login details" />
            </div>

            <div className={`${styles.cap} ${styles.right}`} data-outcome={outcome} {...faceProps('result')}>
              <button
                className={styles.button}
                type={buttonType('result')}
                title={outcome === 'failure' ? 'logout' : undefined}
                aria-label={outcome === 'failure' ? 'Login failed, try again' : 'Logged in'}
              >
                {outcome === 'success' && <User className={styles.icon} aria-hidden />}
                {outcome === 'failure' && <CircleX className={styles.icon} aria-hidden />}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      <p className={styles.visuallyHidden} role="status">
        {outcome === 'success' && 'Logged in.'}
        {outcome === 'failure' && 'Login failed. Try again.'}
      </p>
    </div>
  );
}
