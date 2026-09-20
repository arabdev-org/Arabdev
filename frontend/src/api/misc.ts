import type {
  Ad,
  Interest,
  Media,
  Notification,
  Page,
  SearchResults,
  SearchType,
  TagDetail,
  TagStat,
} from '@/types/api';
import { fitForUpload } from '@/utils/upload';

import { api } from './client';

export const discoveryApi = {
  search: (params: { q: string; type: SearchType; page?: number }, signal?: AbortSignal) =>
    api.get<SearchResults>('/search', { params, signal }).then((r) => r.data),
  popularTags: (limit = 12) => api.get<TagStat[]>('/tags/popular', { params: { limit } }).then((r) => r.data),
  tag: (slug: string) => api.get<TagDetail>(`/tags/${encodeURIComponent(slug)}`).then((r) => r.data),
  interests: () => api.get<Interest[]>('/interests').then((r) => r.data),
};

export const notificationsApi = {
  list: (page: number) => api.get<Page<Notification>>('/notifications', { params: { page } }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const mediaApi = {
  upload: async (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', await fitForUpload(file));
    form.append('kind', 'post_image');
    return api
      .post<Media>('/media', form, {
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  remove: (id: number) => api.delete(`/media/${id}`),
};

export const adsApi = {
  list: (params: { placement: 'feed' | 'sidebar'; lang: string; limit: number; offset: number }) =>
    api.get<Ad[]>('/ads', { params }).then((r) => r.data),
  click: (id: number) => api.post(`/ads/${id}/click`),
};
