import SearchIcon from '@mui/icons-material/Search';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router';

import { errorMessage } from '@/api/errors';
import { discoveryApi } from '@/api/misc';
import { queryKeys } from '@/api/queryKeys';
import { ErrorState, SectionHeading, Surface } from '@/components/common';
import { EmptyState } from '@/components/EmptyState';
import { PostListSkeleton } from '@/components/LoadingState';
import { Pagination } from '@/components/Pagination';
import { PostList } from '@/features/posts/PostList';
import { SearchBar } from '@/features/search/SearchBar';
import { UserCard } from '@/features/users/UserCard';
import { useDocumentTitle, usePageParam } from '@/hooks';
import type { Page, SearchType, TagStat } from '@/types/api';

const TYPES: SearchType[] = ['all', 'posts', 'users', 'tags'];

function TagRows({ tags }: { tags: TagStat[] }) {
  const { t } = useTranslation();
  return (
    <div>
      {tags.map((tag, index) => (
        <Fragment key={tag.slug}>
          {index > 0 && <Divider />}
          <ButtonBase
            component={RouterLink}
            to={`/tags/${encodeURIComponent(tag.slug)}`}
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography sx={{ fontWeight: 700 }} dir="auto">
              #{tag.slug}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('explore.postsCount', { count: tag.posts_count })}
            </Typography>
          </ButtonBase>
        </Fragment>
      ))}
    </div>
  );
}

function Group<T>({
  title,
  page,
  onViewAll,
  children,
}: {
  title: string;
  page: Page<T> | null;
  onViewAll: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  if (!page || page.total === 0) return null;
  return (
    <Box component="section" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <SectionHeading
        action={
          page.total > page.items.length ? (
            <Button size="small" onClick={onViewAll}>
              {t('search.viewAll', { count: page.total })}
            </Button>
          ) : undefined
        }
      >
        {title}
      </SectionHeading>
      {children}
    </Box>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = usePageParam();
  const q = (params.get('q') ?? '').trim();
  const requested = params.get('type') as SearchType | null;
  const type: SearchType = requested && TYPES.includes(requested) ? requested : 'all';
  useDocumentTitle(q ? t('search.resultsFor', { query: q }) : t('search.title'));

  const query = useQuery({
    queryKey: queryKeys.search(q, type, page),
    queryFn: ({ signal }) => discoveryApi.search({ q, type, page }, signal),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

  const setType = (next: SearchType) => setParams(next === 'all' ? { q } : { q, type: next });
  const data = query.data;
  const noResults = data && !data.posts?.total && !data.users?.total && !data.tags?.total;
  const current = type === 'posts' ? data?.posts : type === 'users' ? data?.users : type === 'tags' ? data?.tags : null;

  return (
    <Surface>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h3" component="h1" sx={{ mb: 1.5 }}>
          {q ? t('search.resultsFor', { query: q }) : t('search.title')}
        </Typography>
        <SearchBar key={q} initialQuery={q} autoFocus={!q} />
      </Box>

      {!q ? (
        <EmptyState icon={<SearchIcon />} title={t('search.startTitle')} description={t('search.startBody')} />
      ) : (
        <>
          <Tabs
            value={type}
            onChange={(_, value: SearchType) => setType(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
          >
            <Tab value="all" label={t('search.all')} />
            <Tab value="posts" label={t('search.posts')} />
            <Tab value="users" label={t('search.users')} />
            <Tab value="tags" label={t('search.tags')} />
          </Tabs>

          {query.isPending ? (
            <PostListSkeleton count={3} />
          ) : query.isError ? (
            <ErrorState message={errorMessage(query.error, t)} onRetry={() => void query.refetch()} />
          ) : noResults || (type !== 'all' && !current?.total) ? (
            <EmptyState
              icon={<SearchOffOutlinedIcon />}
              title={t('search.noResultsTitle', { query: q })}
              description={t('search.noResultsBody')}
            />
          ) : (
            <Box sx={{ opacity: query.isPlaceholderData ? 0.6 : 1 }}>
              {type === 'all' && data && (
                <>
                  <Group title={t('search.users')} page={data.users} onViewAll={() => setType('users')}>
                    {data.users?.items.map((user) => (
                      <UserCard key={user.id} user={user} dense />
                    ))}
                  </Group>
                  <Group title={t('search.tags')} page={data.tags} onViewAll={() => setType('tags')}>
                    <TagRows tags={data.tags?.items ?? []} />
                  </Group>
                  <Group title={t('search.posts')} page={data.posts} onViewAll={() => setType('posts')}>
                    <PostList posts={data.posts?.items ?? []} />
                  </Group>
                </>
              )}
              {type === 'posts' && data?.posts && <PostList posts={data.posts.items} />}
              {type === 'users' &&
                data?.users?.items.map((user, index) => (
                  <Fragment key={user.id}>
                    {index > 0 && <Divider />}
                    <UserCard user={user} />
                  </Fragment>
                ))}
              {type === 'tags' && data?.tags && <TagRows tags={data.tags.items} />}
              {current && (
                <>
                  <Divider />
                  <Pagination page={page} pages={current.pages} onChange={setPage} />
                </>
              )}
            </Box>
          )}
        </>
      )}
    </Surface>
  );
}
