import { useColorScheme } from '@mui/material/styles';
import { useCallback } from 'react';

import { usersApi } from '@/api/users';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Language } from '@/i18n';
import type { ThemeMode } from '@/types/api';

import { usePreferences } from './PreferencesProvider';

/**
 * Theme and language, applied instantly and saved to the account when signed in,
 * so the choice follows the user to other devices.
 */
export function useAppearance() {
  const { mode, setMode } = useColorScheme();
  const { language, setLanguage } = usePreferences();
  const { user, setUser } = useAuth();

  const persist = useCallback(
    (patch: { theme?: ThemeMode; language?: Language }) => {
      if (!user) return;
      void usersApi
        .updateSettings(patch)
        .then((settings) => setUser({ ...user, settings }))
        .catch(() => undefined);
    },
    [user, setUser],
  );

  const changeMode = useCallback(
    (next: ThemeMode) => {
      setMode(next);
      persist({ theme: next });
    },
    [setMode, persist],
  );

  const changeLanguage = useCallback(
    (next: Language) => {
      setLanguage(next);
      persist({ language: next });
    },
    [setLanguage, persist],
  );

  return { mode: (mode ?? 'system') as ThemeMode, setMode: changeMode, language, setLanguage: changeLanguage };
}
