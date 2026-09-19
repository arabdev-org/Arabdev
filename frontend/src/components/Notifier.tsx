import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
}

type Notify = (message: string, severity?: AlertColor) => void;

const NotifierContext = createContext<Notify | null>(null);

/** App-wide toasts. One at a time, newest wins, so feedback never piles up. */
export function NotifierProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback<Notify>((message, severity = 'success') => {
    setToast({ id: Date.now(), message, severity });
    setOpen(true);
  }, []);

  const value = useMemo(() => notify, [notify]);

  return (
    <NotifierContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.id}
        open={open}
        autoHideDuration={toast?.severity === 'error' ? 6000 : 3500}
        onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 76, md: 24 } }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          sx={{ minWidth: 280, alignItems: 'center' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotifierContext.Provider>
  );
}

export function useNotify(): Notify {
  const context = useContext(NotifierContext);
  if (!context) throw new Error('useNotify must be used inside NotifierProvider');
  return context;
}
