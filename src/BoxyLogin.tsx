import {
  Circle,
  CircleArrowRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Lock,
  User,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { explode } from './explode';
import styles from './BoxyLogin.module.scss';

export interface Credentials {
  username: string;
  password: string;
}

export interface Session {
  username: string;
  rememberMe: boolean;
}

interface BoxyLoginProps {
  /** Resolves to whether the credentials are valid. Checked as soon as the password is entered. */
  authenticate: (credentials: Credentials) => boolean | Promise<boolean>;
  /** Called once the user has chosen whether to be remembered; if it throws, the login is reported as failed. */
  onLogin?: (session: Session) => void | Promise<void>;
}

/** Which face of the box is showing. */
type Step = 'start' | 'username' | 'password' | 'remember' | 'result';
type Field = 'username' | 'password';
type Outcome = 'success' | 'failure';

export function BoxyLogin({ authenticate, onLogin }: BoxyLoginProps) {
  const id = useId();
  const [step, setStep] = useState<Step>('start');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // fields the user tried to skip: they get a nudge in their placeholder
  const [prompted, setPrompted] = useState<Field[]>([]);
  // why the password was turned away, shown in its placeholder until the user starts typing again
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const checking = useRef(false);
  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const logoutButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === 'username') usernameInput.current?.focus({ preventScroll: true });
    if (step === 'password') passwordInput.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (menuOpen) logoutButton.current?.focus({ preventScroll: true });
  }, [menuOpen]);

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
        if (!password) return reject('password');
        return verify();
      case 'remember':
        return finish(async () => void (await onLogin?.({ username, rememberMe })));
      case 'result':
        // a failed login invites another go; a successful one offers to log out
        if (outcome === 'failure') {
          setPassword('');
          setOutcome(null);
          setStep('username');
        } else if (outcome === 'success') {
          setMenuOpen((open) => !open);
        }
    }
  };

  // The box only moves on from the password once it is right.
  const verify = async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      if (await authenticate({ username, password })) {
        setShowPassword(false); // don't leave it on display
        setStep('remember');
        return;
      }
      setPasswordError('is incorrect');
    } catch {
      setPasswordError('could not be checked, try again');
    } finally {
      checking.current = false;
    }
    setPassword('');
    setShaking(true);
    passwordInput.current?.focus({ preventScroll: true });
  };

  const logout = () => {
    setMenuOpen(false);
    setOutcome(null);
    setUsername('');
    setPassword('');
    setRememberMe(false);
    setPrompted([]);
    setPasswordError(null);
    setStep('start');
  };

  const finish = async (complete: () => Promise<void>) => {
    setOutcome(null);
    setStep('result');
    try {
      await complete();
      setOutcome('success');
    } catch {
      setOutcome('failure');
    }
  };

  // typing sets off a little explosion of the character just typed (deleting doesn't)
  const burst = (event: ChangeEvent<HTMLInputElement>) => {
    const typed = (event.nativeEvent as InputEvent).data;
    if (typed) explode(event.target, typed.slice(-1));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void advance();
  };

  // Only the visible face is interactive, and only its button submits (so Enter advances the right step).
  const faceProps = (own: Step) => ({ inert: step !== own });
  const buttonType = (own: Step) => (step === own ? 'submit' : 'button');

  const labels: Record<Field, string> = { username: 'username or email', password: 'password' };
  const placeholder = (field: Field) =>
    (field === 'password' && passwordError && `password ${passwordError}`) ||
    (prompted.includes(field) ? `enter your ${labels[field]} to continue` : labels[field]);

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
            </div>

            <div className={`${styles.side} ${styles.front}`} {...faceProps('username')}>
              <User className={styles.icon} aria-hidden />
              <label className={styles.field}>
                <input
                  ref={usernameInput}
                  name="username"
                  aria-label="username or email"
                  aria-invalid={prompted.includes('username') && !username}
                  title="enter your username or email"
                  placeholder={placeholder('username')}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    burst(event);
                  }}
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
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  aria-label="password"
                  aria-invalid={passwordError !== null || (prompted.includes('password') && !password)}
                  title="enter your password"
                  placeholder={placeholder('password')}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError(null);
                    burst(event);
                  }}
                  autoComplete="off"
                  required
                />
              </label>
              <button
                className={`${styles.button} ${styles.toggle}`}
                type="button"
                title={showPassword ? 'hide password' : 'show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? (
                  <EyeOff className={styles.icon} aria-hidden />
                ) : (
                  <Eye className={styles.icon} aria-hidden />
                )}
              </button>
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
                aria-expanded={outcome === 'success' ? menuOpen : undefined}
                aria-controls={outcome === 'success' ? `${id}-menu` : undefined}
              >
                {outcome === 'success' && <User className={styles.icon} aria-hidden />}
                {outcome === 'failure' && <CircleX className={styles.icon} aria-hidden />}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      {menuOpen && (
        <div
          className={styles.menu}
          id={`${id}-menu`}
          onKeyDown={(event) => event.key === 'Escape' && setMenuOpen(false)}
        >
          <button ref={logoutButton} className={styles.logout} type="button" onClick={logout}>
            <LogOut className={styles.icon} aria-hidden />
            log out
          </button>
        </div>
      )}
      <p className={styles.visuallyHidden} role="status">
        {passwordError && `Password ${passwordError}.`}
        {outcome === 'success' && 'Logged in.'}
        {outcome === 'failure' && 'Login failed. Try again.'}
      </p>
    </div>
  );
}
