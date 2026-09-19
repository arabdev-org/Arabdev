import type { FollowState, Me, Page, Post, Profile, Reply, TokenResponse, UserCard, UserSettings } from '@/types/api';

import { api } from './client';

export interface ProfilePayload {
  display_name: string;
  bio: string | null;
  location: string | null;
  website: string | null;
}

export const usersApi = {
  me: () => api.get<Me>('/users/me').then((r) => r.data),
  updateProfile: (payload: ProfilePayload) => api.patch<Me>('/users/me/profile', payload).then((r) => r.data),
  updateUsername: (username: string) => api.patch<Me>('/users/me/username', { username }).then((r) => r.data),
  updateEmail: (email: string, current_password: string) =>
    api.patch<Me>('/users/me/email', { email, current_password }).then((r) => r.data),
  changePassword: (payload: { current_password: string; new_password: string; new_password_confirm: string }) =>
    api.put<TokenResponse>('/users/me/password', payload).then((r) => r.data),
  updateInterests: (interest_ids: number[]) => api.put<Me>('/users/me/interests', { interest_ids }).then((r) => r.data),
  updateSettings: (payload: Partial<UserSettings>) =>
    api.patch<UserSettings>('/users/me/settings', payload).then((r) => r.data),
  completeOnboarding: () => api.post<Me>('/users/me/onboarding/complete').then((r) => r.data),
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Me>('/users/me/avatar', form, {
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  removeAvatar: () => api.delete<Me>('/users/me/avatar').then((r) => r.data),
  deleteAccount: (password: string) => api.delete('/users/me', { data: { password } }),
  bookmarks: (page: number) => api.get<Page<Post>>('/users/me/bookmarks', { params: { page } }).then((r) => r.data),

  recommended: (limit = 6) => api.get<UserCard[]>('/users/recommended', { params: { limit } }).then((r) => r.data),
  profile: (username: string) => api.get<Profile>(`/users/${encodeURIComponent(username)}`).then((r) => r.data),
  posts: (username: string, page: number) =>
    api.get<Page<Post>>(`/users/${encodeURIComponent(username)}/posts`, { params: { page } }).then((r) => r.data),
  replies: (username: string, page: number) =>
    api.get<Page<Reply>>(`/users/${encodeURIComponent(username)}/replies`, { params: { page } }).then((r) => r.data),
  followers: (username: string, page: number) =>
    api
      .get<Page<UserCard>>(`/users/${encodeURIComponent(username)}/followers`, { params: { page } })
      .then((r) => r.data),
  following: (username: string, page: number) =>
    api
      .get<Page<UserCard>>(`/users/${encodeURIComponent(username)}/following`, { params: { page } })
      .then((r) => r.data),
  follow: (userId: number) => api.post<FollowState>(`/users/${userId}/follow`).then((r) => r.data),
  unfollow: (userId: number) => api.delete<FollowState>(`/users/${userId}/follow`).then((r) => r.data),
};
