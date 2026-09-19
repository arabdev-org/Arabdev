import createCache, { type EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

import i18n, { directionOf, LANGUAGE_STORAGE_KEY, readStoredLanguage, type Language } from '@/i18n';
import { COLOR_MODE_STORAGE_KEY, createAppTheme } from '@/theme/theme';

/**
 * The single place where language, text direction and theme are wired together.
 * Changing the language flips the document direction, the Emotion cache (which mirrors
 * physical CSS properties for RTL) and the MUI theme direction, all at once.
 */

interface PreferencesContextValue {
  language: Language;
  direction: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const caches: Record<'rtl' | 'ltr', EmotionCache> = {
  rtl: createCache({ key: 'ad-rtl', stylisPlugins: [prefixer, rtlPlugin] }),
  ltr: createCache({ key: 'ad-ltr', stylisPlugins: [prefixer] }),
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
  const direction = directionOf(language);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice still applies for this visit */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language, direction]);

  const theme = useMemo(() => createAppTheme(direction), [direction]);
  const value = useMemo(() => ({ language, direction, setLanguage }), [language, direction, setLanguage]);

  return (
    <PreferencesContext.Provider value={value}>
      <CacheProvider value={caches[direction]}>
        <ThemeProvider
          theme={theme}
          modeStorageKey={COLOR_MODE_STORAGE_KEY}
          defaultMode="system"
          disableTransitionOnChange
        >
          <CssBaseline enableColorScheme />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}
