import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Avatar, { type AvatarProps } from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper, { type PaperProps } from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { formatFullDate, formatRelativeTime, initialsOf } from '@/utils/format';

/** A bordered content surface. Used for the feed column and sidebar blocks. */
export function Surface({ children, sx, ...rest }: PaperProps) {
  return (
    <Paper
      variant="outlined"
      sx={[{ borderRadius: { xs: 0, sm: 3 }, overflow: 'clip' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      {children}
    </Paper>
  );
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
      <Typography variant="h5" component="h2">
        {children}
      </Typography>
      {action}
    </Stack>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h3" component="h1" noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function UserAvatar({
  name,
  src,
  size = 40,
  sx,
  ...rest
}: { name: string; src: string | null | undefined; size?: number } & Omit<AvatarProps, 'src'>) {
  return (
    <Avatar
      src={src ?? undefined}
      alt={name}
      sx={[{ width: size, height: size, fontSize: size * 0.38 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      {initialsOf(name)}
    </Avatar>
  );
}

export function RelativeTime({ iso }: { iso: string }) {
  const { language } = usePreferences();
  return (
    <Tooltip title={formatFullDate(iso, language)}>
      <Box component="time" dateTime={iso} sx={{ whiteSpace: 'nowrap' }}>
        {formatRelativeTime(iso, language)}
      </Box>
    </Tooltip>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Stack role="alert" spacing={1.5} sx={{ alignItems: 'center', py: 6, px: 3, textAlign: 'center' }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 36 }} aria-hidden />
      <Typography variant="h5" component="p">
        {t('common.somethingWrong')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </Stack>
  );
}
