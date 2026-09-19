import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

/** Placeholder rows shaped like the content they stand in for, so the page doesn't jump. */
export function PostListSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useTranslation();
  return (
    <Box aria-busy="true" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider />}
          <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="35%" height={20} />
              <Skeleton width="80%" height={28} sx={{ mt: 0.5 }} />
              <Skeleton width="100%" />
              <Skeleton width="92%" />
              <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width={40} height={24} />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Fragment>
      ))}
    </Box>
  );
}

export function UserListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Stack spacing={2} sx={{ p: 2 }} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <Stack key={index} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="50%" />
            <Skeleton width="30%" />
          </Box>
          <Skeleton variant="rounded" width={72} height={32} />
        </Stack>
      ))}
    </Stack>
  );
}

export function LoadingState({ minHeight = 240 }: { minHeight?: number }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ minHeight, display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label={t('common.loading')} size={32} />
    </Box>
  );
}
