import { BoxyLogin, type Credentials } from './BoxyLogin';

// Dummy credentials, so the demo can fake a successful login.
const SPOOF_LOGIN_UN = 'admin@sweetmail.com';
const SPOOF_LOGIN_PW = '1234';

const authenticate = ({ username, password }: Credentials) =>
  username === SPOOF_LOGIN_UN && password === SPOOF_LOGIN_PW;

export default function App() {
  return (
    <main>
      <BoxyLogin authenticate={authenticate} />
      <p className="hint">
        email <kbd>{SPOOF_LOGIN_UN}</kbd> · password <kbd>{SPOOF_LOGIN_PW}</kbd>
      </p>
    </main>
  );
}
