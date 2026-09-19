import { useColorScheme } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { authApi, type RegisterPayload } from '@/api/auth';
import { refreshSession, registerSessionHandlers, setAccessToken } from '@/api/client';
import { useNotify } from '@/components/Notifier';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import type { Me, TokenResponse } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/**
 * A non-sensitive hint that this browser has signed in before. Without it, a visitor
 * has no refresh cookie, so the startup refresh request is skipped entirely.
 */
const SESSION_HINT_KEY = 'arabdev.session';
const sessionHint = {
  get: () => {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      return true;
    }
  },
  set: (value: boolean) => {
    try {
      if (value) localStorage.setItem(SESSION_HINT_KEY, '1');
      else localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      /* storage unavailable: we'll just try the refresh */
    }
  },
};

interface AuthContextValue {
  status: AuthStatus;
  user: Me | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<Me>;
  register: (payload: RegisterPayload) => Promise<Me>;
  logout: () => Promise<void>;
  acceptTokens: (data: TokenResponse) => void;
  setUser: (user: Me) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<Me | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notify = useNotify();
  const { t } = useTranslation();
  const { setLanguage } = usePreferences();
  const { setMode } = useColorScheme();
  const bootstrapped = useRef(false);

  /** A signed-in user's saved appearance settings win over this browser's defaults. */
  const applyPreferences = useCallback(
    (me: Me) => {
      setLanguage(me.settings.language);
      setMode(me.settings.theme);
    },
    [setLanguage, setMode],
  );

  const acceptTokens = useCallback((data: TokenResponse) => {
    sessionHint.set(true);
    setAccessToken(data.access_token);
    setUserState(data.user);
    setStatus('authenticated');
  }, []);

  const endSession = useCallback(() => {
    sessionHint.set(false);
    setAccessToken(null);
    setUserState(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    registerSessionHandlers({
      onTokenRefreshed: (data) => setUserState(data.user),
      onSessionEnded: () => {
        endSession();
        notify(t('auth.sessionExpired'), 'warning');
        navigate('/login', { replace: true });
      },
    });
  }, [endSession, navigate, notify, t]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (!sessionHint.get()) {
      setStatus('anonymous');
      return;
    }
    refreshSession()
      .then((data) => {
        acceptTokens(data);
        applyPreferences(data.user);
      })
      .catch(() => {
        sessionHint.set(false);
        setStatus('anonymous');
      });
  }, [acceptTokens, applyPreferences]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const data = await authApi.login({ email, password, remember_me: rememberMe });
      queryClient.clear();
      acceptTokens(data);
      applyPreferences(data.user);
      return data.user;
    },
    [acceptTokens, applyPreferences, queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await authApi.register(payload);
      queryClient.clear();
      acceptTokens(data);
      return data.user;
    },
    [acceptTokens, queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      endSession();
      navigate('/login', { replace: true });
    }
  }, [endSession, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, acceptTokens, setUser: setUserState }),
    [status, user, login, register, logout, acceptTokens],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

/** The signed-in user. Only call this under a route guarded by RequireAuth. */
export function useCurrentUser(): Me {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called without a signed-in user');
  return user;
}
