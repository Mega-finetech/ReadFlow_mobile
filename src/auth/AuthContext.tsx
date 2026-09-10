import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { User } from '../types';
import { login as loginApi, register as registerApi } from '../api/auth';
import { getToken, setToken, clearToken } from '../api/tokenStore';
import { ttsPlayer } from '../services/ttsService';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const INACTIVITY_CHECK_MS = 30 * 1000;

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  recordActivity: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef<number>(0);

  // Restore session on launch — do NOT clear the token.
  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (stored) {
          setTokenState(stored);
          lastActivityRef.current = Date.now();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password);
    await setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    lastActivityRef.current = Date.now();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const response = await registerApi(email, password);
    await setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    lastActivityRef.current = Date.now();
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const authenticated = !!token;

  // 10-minute inactivity timeout — only while authenticated.
  useEffect(() => {
    if (!authenticated) return;

    lastActivityRef.current = Date.now();

    const checkInactivity = () => {
      // TTS actively playing counts as meaningful activity (requirement E).
      const status = ttsPlayer.getSnapshot().status;
      if (status === 'playing' || status === 'loading') {
        lastActivityRef.current = Date.now();
        return;
      }
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        signOut();
      }
    };

    const interval = setInterval(checkInactivity, INACTIVITY_CHECK_MS);

    // Re-evaluate on return to foreground — timers may pause in background.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkInactivity();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [authenticated, signOut]);

  const value = useMemo(
    () => ({ user, token, isLoading, signIn, signUp, signOut, recordActivity }),
    [user, token, isLoading, signIn, signUp, signOut, recordActivity]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
