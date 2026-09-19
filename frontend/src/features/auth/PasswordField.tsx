import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordField(props, ref) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      inputRef={ref}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...props.slotProps,
        htmlInput: { dir: 'ltr', ...(props.slotProps?.htmlInput as object) },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={visible}
              >
                {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
});

/** 0–4, a quick client-side estimate. The server enforces the real rules. */
export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) score = Math.min(score, 1);
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  if (!password) return null;
  const score = passwordScore(password);
  const levels = [
    { label: t('register.strengthWeak'), color: 'error' as const },
    { label: t('register.strengthWeak'), color: 'error' as const },
    { label: t('register.strengthFair'), color: 'warning' as const },
    { label: t('register.strengthGood'), color: 'success' as const },
    { label: t('register.strengthStrong'), color: 'success' as const },
  ];
  const level = levels[score];
  return (
    <Box sx={{ mt: -1 }} aria-live="polite">
      <LinearProgress
        variant="determinate"
        value={Math.max(score, 1) * 25}
        color={level.color}
        sx={{ height: 4, borderRadius: 2 }}
        aria-label={t('register.strength', { level: level.label })}
      />
      <Typography variant="caption" color="text.secondary">
        {t('register.strength', { level: level.label })}
      </Typography>
    </Box>
  );
}
