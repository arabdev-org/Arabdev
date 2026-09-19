import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { discoveryApi } from '@/api/misc';
import { queryKeys } from '@/api/queryKeys';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { interestName } from '@/features/users/UserCard';

interface InterestSelectorProps {
  value: number[];
  onChange: (ids: number[]) => void;
}

/** Multi-select chips. Selection is shown by a check icon and fill, not color alone. */
export function InterestSelector({ value, onChange }: InterestSelectorProps) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.interests,
    queryFn: discoveryApi.interests,
    staleTime: Infinity,
  });

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Array.from({ length: 16 }, (_, i) => (
          <Skeleton key={i} variant="rounded" width={70 + (i % 4) * 18} height={36} />
        ))}
      </Box>
    );
  }

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <Box role="group" aria-label={t('editProfile.interests')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {(data ?? []).map((interest) => {
        const selected = value.includes(interest.id);
        return (
          <Chip
            key={interest.id}
            label={interestName(interest, language)}
            icon={selected ? <CheckIcon /> : undefined}
            clickable
            onClick={() => toggle(interest.id)}
            aria-pressed={selected}
            variant={selected ? 'filled' : 'outlined'}
            sx={{
              height: 36,
              px: 0.5,
              fontSize: '0.9375rem',
              fontWeight: selected ? 700 : 500,
              borderColor: selected ? 'primary.main' : 'surface.borderStrong',
              bgcolor: selected ? 'accent.subtle' : 'transparent',
              color: selected ? 'accent.text' : 'text.primary',
              '& .MuiChip-icon': { color: 'inherit' },
              '&.MuiChip-clickable:hover': { bgcolor: selected ? 'accent.hover' : 'action.hover' },
              ...(selected && { border: 1 }),
            }}
          />
        );
      })}
    </Box>
  );
}
