import { BoxyLogin, type Credentials } from './BoxyLogin';

// Dummy credentials, so the demo can fake a successful login.
const SPOOF_LOGIN_UN = 'admin';
const SPOOF_LOGIN_PW = '1234';

const authenticate = ({ username, password }: Credentials) =>
  username === SPOOF_LOGIN_UN && password === SPOOF_LOGIN_PW;

// Set VITE_GOOGLE_CLIENT_ID (see .env.example) to show the Google button.
const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Demo check: a real app would send the token to its backend instead.
const authenticateGoogle = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.ok;
};

export default function App() {
  return (
    <main>
      <BoxyLogin
        authenticate={authenticate}
        google={GOOGLE_CLIENT_ID ? { clientId: GOOGLE_CLIENT_ID, authenticate: authenticateGoogle } : undefined}
      />
    </main>
  );
}
