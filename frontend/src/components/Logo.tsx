import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router';

import { displayFont } from '@/theme/typography';
import { HOME_PATH } from '@/site';

interface LogoProps {
  size?: number;
  to?: string | null;
  /** On dark surfaces "Dev" switches to white. */
  onDark?: boolean;
}

/** The ArabDev wordmark: one word in Anton, "Arab" in brand red, "Dev" in ink. */
export function Logo({ size = 28, to = HOME_PATH, onDark = false }: LogoProps) {
  const word = (
    <Box
      component="span"
      dir="ltr"
      sx={{
        fontFamily: displayFont,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        display: 'inline-block',
      }}
    >
      <Box component="span" sx={{ color: 'primary.main' }}>
        Arab
      </Box>
      <Box component="span" sx={{ color: onDark ? '#FFFFFF' : 'text.primary' }}>
        Dev
      </Box>
    </Box>
  );

  if (!to) return word;
  return (
    <Box
      component={RouterLink}
      to={to}
      aria-label="ArabDev"
      sx={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', borderRadius: 1 }}
    >
      {word}
    </Box>
  );
}
