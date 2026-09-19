import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { UserAvatar } from '@/components/common';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import type { Interest, UserCard as UserCardData } from '@/types/api';

import { FollowButton } from './FollowButton';

export function interestName(interest: Interest, language: string) {
  return language === 'ar' ? interest.name_ar : interest.name_en;
}

interface UserCardProps {
  user: UserCardData;
  dense?: boolean;
  onFollowChange?: (following: boolean) => void;
}

/** A developer in a list: who they are, what they work on, and a follow action. */
export function UserCard({ user, dense = false, onFollowChange }: UserCardProps) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const profileUrl = `/u/${user.username}`;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: dense ? 'center' : 'flex-start',
        px: 2,
        py: dense ? 1.25 : 2,
        position: 'relative',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <UserAvatar name={user.display_name} src={user.avatar_url} size={dense ? 40 : 48} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Link
            component={RouterLink}
            to={profileUrl}
            color="text.primary"
            noWrap
            sx={{
              fontWeight: 700, // The whole row is clickable; the follow button sits above this overlay.
              '&::after': { content: '""', position: 'absolute', inset: 0 },
            }}
          >
            {user.display_name}
          </Link>
          {user.follows_you && (
            <Chip label={t('profile.followsYou')} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap dir="ltr" sx={{ textAlign: 'start' }}>
          @{user.username}
        </Typography>
        {!dense && user.bio && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {user.bio}
          </Typography>
        )}
        {!dense && user.interests.length > 0 && (
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
            {user.interests.slice(0, 4).map((interest) => (
              <Chip key={interest.id} label={interestName(interest, language)} size="small" variant="outlined" />
            ))}
          </Stack>
        )}
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <FollowButton
          userId={user.id}
          username={user.username}
          following={user.is_following}
          onChange={onFollowChange}
        />
      </Box>
    </Stack>
  );
}
