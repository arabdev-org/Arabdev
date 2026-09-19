import Divider from '@mui/material/Divider';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { AdCard, useFeedAds } from '@/features/ads/AdCard';
import type { Post } from '@/types/api';

import { PostCard } from './PostCard';

/** Ads appear after every 8 posts: a fixed rhythm, never random. */
export const AD_INTERVAL = 8;

interface PostListProps {
  posts: Post[];
  page?: number;
  withAds?: boolean;
}

export function PostList({ posts, page = 1, withAds = false }: PostListProps) {
  const { t } = useTranslation();
  const ads = useFeedAds(page, withAds);
  const showAds = withAds && Boolean(ads?.length);

  return (
    <div role="feed" aria-label={t('feed.feedLabel')} aria-busy="false">
      {posts.map((post, index) => {
        const slot = Math.floor(index / AD_INTERVAL);
        const adAfter = showAds && (index + 1) % AD_INTERVAL === 0 && ads ? ads[slot % ads.length] : null;
        return (
          <Fragment key={`${post.id}-${post.reposted_by?.id ?? 'own'}`}>
            {index > 0 && <Divider component="div" role="presentation" />}
            <PostCard post={post} />
            {adAfter && (
              <>
                <Divider component="div" role="presentation" />
                <AdCard ad={adAfter} />
              </>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
