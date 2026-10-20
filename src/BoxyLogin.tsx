import { Circle, CircleArrowRight, CircleCheck, CircleHelp, CircleX, LogIn, Lock, User } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import styles from './BoxyLogin.module.scss';

export interface Credentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface BoxyLoginProps {
  /** Resolves to whether the credentials are valid. */
  authenticate: (credentials: Credentials) => boolean | Promise<boolean>;
}

/** Which face of the box is showing. */
type Step = 'start' | 'username' | 'password' | 'remember' | 'result';
type Field = 'username' | 'password';
type Outcome = 'success' | 'failure';

export function BoxyLogin({ authenticate }: BoxyLoginProps) {
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
      case 'remember': {
        setOutcome(null);
        setStep('result');
        try {
          setOutcome((await authenticate({ username, password, rememberMe })) ? 'success' : 'failure');
        } catch {
          setOutcome('failure');
        }
        return;
      }
      case 'result':
        // a failed login invites another go; a successful one is done
        if (outcome === 'failure') {
          setPassword('');
          setOutcome(null);
          setStep('username');
        }
    }
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
              <button
                className={styles.button}
                type={buttonType('start')}
                title="click to login"
                aria-label="Begin login"
              >
                <User className={styles.icon} aria-hidden />
              </button>
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
                title={outcome === 'failure' ? 'login failed, try again' : undefined}
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
