const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Use current domain for redirect URI
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    // Force HTTPS for production
    const origin = window.location.origin.replace('http://', 'https://');
    return `${origin}/calendar/callback`;
  }
  return 'https://mon-secretaria.com/calendar/callback';
};

export function getAuthUrl(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    include_granted_scopes: 'true'
  });
  
  console.log('Google OAuth URL params:', {
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scopes: SCOPES
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleAuthCallback(code: string): Promise<any> {
  const redirectUri = getRedirectUri();
  
  console.log('=== FRONTEND OAUTH CALLBACK ===');
  console.log('Code received:', code ? 'YES' : 'NO');
  console.log('Redirect URI:', redirectUri);
  console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
  
  // Send the code to our backend for secure token exchange
  const backendUrl = `${import.meta.env.VITE_BACKEND_URL}/api/google-oauth-exchange`;
  console.log('Sending request to:', backendUrl);
  
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri
    })
  });
  
  console.log('Backend response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('=== TOKEN EXCHANGE ERROR ===');
    console.error('Response status:', response.status);
    console.error('Response statusText:', response.statusText);
    console.error('Error data:', errorData);
    
    throw new Error(`Échec de l'échange de token: ${errorData.error || errorData.error_description || response.statusText}`);
  }

  const tokens = await response.json();
  
  // Fetch user info to get email
  try {
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      tokens.user_email = userInfo.email;
    }
  } catch (error) {
    console.warn('Could not fetch user email:', error);
  }
  
  // Add timestamp for token management
  tokens.obtained_at = Date.now();
  
  setStoredCredentials(tokens);
  return tokens;
}

export function setStoredCredentials(credentials: any): void {
  localStorage.setItem('calendar_credentials', JSON.stringify(credentials));
}

export function getStoredCredentials(): any {
  const stored = localStorage.getItem('calendar_credentials');
  if (!stored) return null;
  
  try {
    const credentials = JSON.parse(stored);
    // Check if token is expired (tokens typically last 1 hour)
    if (credentials.obtained_at && Date.now() - credentials.obtained_at > 3600000) {
      clearStoredCredentials();
      return null;
    }
    return credentials;
  } catch (error) {
    console.error('Error parsing stored credentials:', error);
    clearStoredCredentials();
    return null;
  }
}

export function clearStoredCredentials(): void {
  localStorage.removeItem('calendar_credentials');
}

export function checkCalendarConnection(): boolean {
  const credentials = getStoredCredentials();
  return credentials !== null && credentials.access_token;
}

export function getConnectedUserEmail(): string | null {
  const credentials = getStoredCredentials();
  return credentials?.user_email || null;
}

export function revokeAccess(): void {
  const credentials = getStoredCredentials();
  if (credentials?.access_token) {
    // Revoke the token with Google
    fetch(`https://oauth2.googleapis.com/revoke?token=${credentials.access_token}`, {
      method: 'POST'
    }).catch(error => {
      console.warn('Error revoking token:', error);
    });
  }
  clearStoredCredentials();
}