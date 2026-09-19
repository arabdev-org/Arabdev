import type { QueryClient } from '@tanstack/react-query';

import type { Page, Post, SearchResults, UserCard } from '@/types/api';

import { POST_QUERY_ROOTS, USER_QUERY_ROOTS } from './queryKeys';

type Updater<T> = (value: T) => T;

function isPage<T>(data: unknown): data is Page<T> {
  return typeof data === 'object' && data !== null && Array.isArray((data as Page<T>).items);
}

function isSearch(data: unknown): data is SearchResults {
  return typeof data === 'object' && data !== null && 'query' in data && 'type' in data;
}

function mapPosts(data: unknown, postId: number, update: Updater<Post>): unknown {
  if (!data) return data;
  if (isSearch(data)) {
    return data.posts ? { ...data, posts: mapPosts(data.posts, postId, update) as Page<Post> } : data;
  }
  if (isPage<Post>(data)) {
    return { ...data, items: data.items.map((post) => (post.id === postId ? update(post) : post)) };
  }
  const post = data as Post;
  return post.id === postId && 'content_html' in post ? update(post) : data;
}

/** Apply an update to one post everywhere it's cached (feeds, profile, search, detail...). */
export function updatePostInCaches(queryClient: QueryClient, postId: number, update: Updater<Post>) {
  queryClient.setQueriesData(
    { predicate: (query) => POST_QUERY_ROOTS.includes(String(query.queryKey[0])) },
    (data: unknown) => mapPosts(data, postId, update),
  );
}

function mapUsers(data: unknown, userId: number, update: Updater<UserCard>): unknown {
  if (!data) return data;
  if (isSearch(data)) {
    return data.users ? { ...data, users: mapUsers(data.users, userId, update) as Page<UserCard> } : data;
  }
  if (Array.isArray(data)) {
    return data.map((user: UserCard) => (user.id === userId ? update(user) : user));
  }
  if (isPage<UserCard>(data)) {
    return { ...data, items: data.items.map((user) => (user.id === userId ? update(user) : user)) };
  }
  const user = data as UserCard;
  return user.id === userId && 'is_following' in user ? update(user) : data;
}

/** Apply an update to one user card/profile everywhere it's cached. */
export function updateUserInCaches(queryClient: QueryClient, userId: number, update: Updater<UserCard>) {
  queryClient.setQueriesData(
    { predicate: (query) => USER_QUERY_ROOTS.includes(String(query.queryKey[0])) },
    (data: unknown) => mapUsers(data, userId, update),
  );
}
