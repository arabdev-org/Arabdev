import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '@/api/queryKeys';
import { usersApi } from '@/api/users';
import { UserListSkeleton } from '@/components/LoadingState';

import { UserCard } from './UserCard';

interface RecommendedDevelopersProps {
  limit?: number;
  dense?: boolean;
  onFollowChange?: (following: boolean) => void;
}

export function RecommendedDevelopers({ limit = 5, dense = false, onFollowChange }: RecommendedDevelopersProps) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.recommended(limit),
    queryFn: () => usersApi.recommended(limit),
    staleTime: 60_000,
  });

  if (isPending) return <UserListSkeleton count={Math.min(limit, 3)} />;
  if (isError || !data.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
        {t('onboarding.peopleEmpty')}
      </Typography>
    );
  }
  return (
    <div>
      {data.map((user, index) => (
        <Fragment key={user.id}>
          {index > 0 && !dense && <Divider />}
          <UserCard user={user} dense={dense} onFollowChange={onFollowChange} />
        </Fragment>
      ))}
    </div>
  );
}
