// Google Identity Services (GIS), loaded on demand. Only the slice of its API that we use is typed here.
interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface Gsi {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback: (error: { type: string }) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: Gsi;
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let loading: Promise<Gsi> | undefined;

/** Loads the GIS script once. Call early: the popup must open straight from the click, so the script has to be ready. */
export function loadGoogle(): Promise<Gsi> {
  loading ??= new Promise<Gsi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error('Google script did not load')));
    script.onerror = () => reject(new Error('Google script failed to load'));
    document.head.append(script);
  });
  // a failed load shouldn't be cached forever
  loading.catch(() => (loading = undefined));
  return loading;
}

/** Opens Google's sign-in popup and resolves with an OAuth access token. Must be called from a user gesture. */
export function requestGoogleAccessToken(google: Gsi, clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    google.accounts.oauth2
      .initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: ({ access_token, error }) =>
          access_token ? resolve(access_token) : reject(new Error(error ?? 'No access token')),
        error_callback: ({ type }) => reject(new Error(type)),
      })
      .requestAccessToken();
  });
}
