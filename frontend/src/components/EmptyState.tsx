import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; to?: string; onClick?: () => void; icon?: ReactNode };
  compact?: boolean;
}

/** An intentional "nothing here yet" with a clear next step. */
export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <Box
      role="status"
      sx={{
        textAlign: 'center',
        px: 3,
        py: compact ? 5 : { xs: 7, md: 9 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'accent.subtle',
          color: 'accent.text',
          mb: 0.5,
          '& svg': { fontSize: 28 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" component="h2">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          size="large"
          startIcon={action.icon}
          onClick={action.onClick}
          {...(action.to ? { component: RouterLink, to: action.to } : {})}
          sx={{ mt: 1.5 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
