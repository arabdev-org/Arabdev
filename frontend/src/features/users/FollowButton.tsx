import Button, { type ButtonProps } from '@mui/material/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { updateUserInCaches } from '@/api/cache';
import { errorMessage } from '@/api/errors';
import { usersApi } from '@/api/users';
import { useNotify } from '@/components/Notifier';
import { useAuth } from '@/features/auth/AuthProvider';

interface FollowButtonProps {
  userId: number;
  username: string;
  following: boolean;
  size?: ButtonProps['size'];
  fullWidth?: boolean;
  onChange?: (following: boolean) => void;
}

/**
 * Follow / Following. Hovering "Following" reveals "Unfollow" (with a label change, not
 * just a color change). Updates every cached copy of the user optimistically.
 */
export function FollowButton({ userId, username, following, size = 'small', fullWidth, onChange }: FollowButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [hover, setHover] = useState(false);

  const mutation = useMutation({
    mutationFn: (follow: boolean) => (follow ? usersApi.follow(userId) : usersApi.unfollow(userId)),
    onMutate: (follow) => {
      updateUserInCaches(queryClient, userId, (card) => ({
        ...card,
        is_following: follow,
        followers_count: Math.max(0, card.followers_count + (follow ? 1 : -1)),
      }));
      onChange?.(follow);
    },
    onSuccess: (state) => {
      updateUserInCaches(queryClient, userId, (card) => ({
        ...card,
        is_following: state.following,
        followers_count: state.followers_count,
      }));
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['following'] });
    },
    onError: (error, follow) => {
      updateUserInCaches(queryClient, userId, (card) => ({
        ...card,
        is_following: !follow,
        followers_count: Math.max(0, card.followers_count + (follow ? -1 : 1)),
      }));
      onChange?.(!follow);
      notify(errorMessage(error, t), 'error');
    },
  });

  if (user?.id === userId) return null;

  const label = following ? (hover ? t('profile.unfollow') : t('profile.followingButton')) : t('profile.follow');

  return (
    <Button
      size={size}
      fullWidth={fullWidth}
      variant={following ? 'outlined' : 'contained'}
      color={following && hover ? 'error' : following ? 'inherit' : 'secondary'}
      disabled={mutation.isPending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-pressed={following}
      aria-label={`${following ? t('profile.unfollow') : t('profile.follow')} @${username}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
          navigate('/login');
          return;
        }
        mutation.mutate(!following);
      }}
      sx={{ minWidth: 96, flexShrink: 0, borderRadius: 999 }}
    >
      {label}
    </Button>
  );
}
