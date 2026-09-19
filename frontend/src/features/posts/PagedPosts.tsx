import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessage } from '@/api/errors';
import { ErrorState } from '@/components/common';
import { PostListSkeleton } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import type { Page, Post } from '@/types/api';

import { PostList } from './PostList';

interface PagedPostsProps {
  query: UseQueryResult<Page<Post>>;
  page: number;
  onPageChange: (page: number) => void;
  empty: ReactNode;
  withAds?: boolean;
}

/** Loading, error, empty and paginated states for any server-paginated list of posts. */
export function PagedPosts({ query, page, onPageChange, empty, withAds = false }: PagedPostsProps) {
  const { t } = useTranslation();
  const data = query.data;

  // A stale link to a page that no longer exists (e.g. ?page=9 after deletions): go to the last page.
  useEffect(() => {
    if (data && data.total > 0 && data.items.length === 0 && page > data.pages) onPageChange(data.pages);
  }, [data, page, onPageChange]);

  if (query.isPending) return <PostListSkeleton />;
  if (query.isError) return <ErrorState message={errorMessage(query.error, t)} onRetry={() => void query.refetch()} />;
  if (!data || data.total === 0) return <>{empty}</>;

  return (
    <Box
      sx={{ opacity: query.isPlaceholderData ? 0.55 : 1, transition: 'opacity 150ms' }}
      aria-busy={query.isPlaceholderData}
    >
      <PostList posts={data.items} page={page} withAds={withAds} />
      <Divider />
      <Pagination page={page} pages={data.pages} onChange={onPageChange} />
    </Box>
  );
}
