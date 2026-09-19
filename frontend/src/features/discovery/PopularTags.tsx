import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { discoveryApi } from '@/api/misc';
import { queryKeys } from '@/api/queryKeys';
import { displayFont } from '@/theme/typography';

/** Ranked list of the most used tags; the rank uses Anton like a scoreboard. */
export function PopularTags({ limit = 10 }: { limit?: number }) {
  const { t } = useTranslation();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.popularTags,
    queryFn: () => discoveryApi.popularTags(20),
    staleTime: 2 * 60_000,
  });

  if (isPending) {
    return (
      <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={28} />
        ))}
      </Stack>
    );
  }
  const tags = (data ?? []).slice(0, limit);
  if (!tags.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
        {t('explore.noTags')}
      </Typography>
    );
  }

  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, pb: 1 }}>
      {tags.map((tag, index) => (
        <li key={tag.slug}>
          <ButtonBase
            component={RouterLink}
            to={`/tags/${encodeURIComponent(tag.slug)}`}
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: 1.5,
              px: 2,
              py: 1,
              textAlign: 'start',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography
              component="span"
              aria-hidden
              sx={{
                fontFamily: displayFont,
                fontSize: 18,
                color: index < 3 ? 'accent.text' : 'text.disabled',
                width: 22,
              }}
            >
              {index + 1}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap dir="auto" sx={{ fontWeight: 700 }}>
                #{tag.slug}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('explore.postsCount', { count: tag.posts_count })}
              </Typography>
            </Box>
          </ButtonBase>
        </li>
      ))}
    </Box>
  );
}
