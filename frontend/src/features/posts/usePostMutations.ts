import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { updatePostInCaches } from '@/api/cache';
import { errorMessage } from '@/api/errors';
import { postsApi, type Interaction } from '@/api/posts';
import { useNotify } from '@/components/Notifier';
import type { Post } from '@/types/api';

const FLAG: Record<Interaction, 'liked' | 'bookmarked' | 'reposted'> = {
  like: 'liked',
  bookmark: 'bookmarked',
  repost: 'reposted',
};
const COUNT: Partial<Record<Interaction, 'likes_count' | 'reposts_count'>> = {
  like: 'likes_count',
  repost: 'reposts_count',
};

function toggled(post: Post, kind: Interaction, active: boolean): Post {
  const counter = COUNT[kind];
  const next = { ...post, [FLAG[kind]]: active };
  if (counter && post[FLAG[kind]] !== active) next[counter] = Math.max(0, post[counter] + (active ? 1 : -1));
  return next;
}

/** Like / bookmark / repost with optimistic updates across every cached copy of the post. */
export function useInteraction() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ post, kind, active }: { post: Post; kind: Interaction; active: boolean }) =>
      postsApi.interact(post.id, kind, active),
    onMutate: ({ post, kind, active }) => {
      updatePostInCaches(queryClient, post.id, (cached) => toggled(cached, kind, active));
    },
    onSuccess: (counters, { kind }) => {
      updatePostInCaches(queryClient, counters.post_id, (cached) => ({
        ...cached,
        liked: counters.liked,
        bookmarked: counters.bookmarked,
        reposted: counters.reposted,
        likes_count: counters.likes_count,
        comments_count: counters.comments_count,
        reposts_count: counters.reposts_count,
      }));
      if (kind === 'bookmark') void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error, { post, kind, active }) => {
      updatePostInCaches(queryClient, post.id, (cached) => toggled(cached, kind, !active));
      notify(errorMessage(error, t), 'error');
    },
  });
}

export function useDeletePost(onDeleted?: () => void) {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (postId: number) => postsApi.remove(postId),
    onSuccess: (_, postId) => {
      queryClient.removeQueries({ queryKey: ['post', postId] });
      for (const root of ['feed', 'trending', 'tag-posts', 'user-posts', 'bookmarks', 'search', 'profile']) {
        void queryClient.invalidateQueries({ queryKey: [root] });
      }
      notify(t('post.deleted'));
      onDeleted?.();
    },
    onError: (error) => notify(errorMessage(error, t), 'error'),
  });
}
