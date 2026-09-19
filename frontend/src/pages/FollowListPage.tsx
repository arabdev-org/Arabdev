import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router';

import { errorCode, errorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { usersApi } from '@/api/users';
import { ErrorState, Surface } from '@/components/common';
import { EmptyState } from '@/components/EmptyState';
import { UserListSkeleton } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { UserCard } from '@/features/users/UserCard';
import { useDocumentTitle, usePageParam } from '@/hooks';

type ListKind = 'followers' | 'following';

export default function FollowListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { direction } = usePreferences();
  const navigate = useNavigate();
  const params = useParams();
  const username = (params.username ?? '').toLowerCase();
  const list = params.list as ListKind;
  const [page, setPage] = usePageParam();
  const isMe = user?.username === username;

  const profile = useQuery({ queryKey: queryKeys.profile(username), queryFn: () => usersApi.profile(username) });
  const query = useQuery({
    queryKey: list === 'followers' ? queryKeys.followers(username, page) : queryKeys.following(username, page),
    queryFn: () => (list === 'followers' ? usersApi.followers(username, page) : usersApi.following(username, page)),
    placeholderData: keepPreviousData,
    enabled: list === 'followers' || list === 'following',
  });
  const name = profile.data?.display_name ?? `@${username}`;
  useDocumentTitle(list === 'followers' ? t('profile.followersOf', { name }) : t('profile.followingOf', { name }));

  if (list !== 'followers' && list !== 'following') return <Navigate to={`/u/${username}`} replace />;

  const emptyTitle = list === 'followers' ? t('profile.emptyFollowersTitle') : t('profile.emptyFollowingTitle');
  const emptyBody =
    list === 'followers'
      ? isMe
        ? t('profile.emptyFollowersBodyMe')
        : t('profile.emptyFollowersBody', { username })
      : isMe
        ? t('profile.emptyFollowingBodyMe')
        : t('profile.emptyFollowingBody', { username });

  return (
    <Surface>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1, py: 1 }}>
        <IconButton component={RouterLink} to={`/u/${username}`} aria-label={t('common.back')}>
          <ArrowBackIcon sx={{ transform: direction === 'rtl' ? 'scaleX(-1)' : undefined }} />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1" noWrap>
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: 'start' }}>
            @{username}
          </Typography>
        </Box>
      </Stack>
      <Tabs
        value={list}
        onChange={(_, value: ListKind) => navigate(`/u/${username}/${value}`)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="followers" label={t('profile.followers')} />
        <Tab value="following" label={t('profile.following')} />
      </Tabs>

      {query.isPending ? (
        <UserListSkeleton count={4} />
      ) : query.isError ? (
        errorCode(query.error) === 'follow_lists_private' ? (
          <EmptyState icon={<LockOutlinedIcon />} title={t('profile.privateLists')} />
        ) : (
          <ErrorState message={errorMessage(query.error, t)} onRetry={() => void query.refetch()} />
        )
      ) : query.data.total === 0 ? (
        <EmptyState
          icon={<GroupOutlinedIcon />}
          title={emptyTitle}
          description={emptyBody}
          action={isMe ? { label: t('profile.findDevelopers'), to: '/explore' } : undefined}
        />
      ) : (
        <Box sx={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
          {query.data.items.map((card, index) => (
            <Fragment key={card.id}>
              {index > 0 && <Divider />}
              <UserCard user={card} />
            </Fragment>
          ))}
          <Divider />
          <Pagination page={page} pages={query.data.pages} onChange={setPage} />
        </Box>
      )}
    </Surface>
  );
}
