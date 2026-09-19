import { useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useDocumentTitle(title: string | null | undefined) {
  const { t } = useTranslation();
  useEffect(() => {
    const app = t('common.appName');
    document.title = title ? `${title} · ${app}` : app;
  }, [title, t]);
}

/** Current ?page= value (1-based) and a setter that keeps other params and scrolls to top. */
export function usePageParam(): [number, (page: number) => void] {
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get('page') ?? '1');
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const setPage = useCallback(
    (next: number) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next <= 1) updated.delete('page');
          else updated.set('page', String(next));
          return updated;
        },
        { preventScrollReset: false },
      );
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [setParams],
  );
  return [page, setPage];
}

export function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}
