import type { FieldAvailability, TokenResponse } from '@/types/api';

import { api } from './client';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  language: 'ar' | 'en';
}

export const authApi = {
  login: (payload: { email: string; password: string; remember_me: boolean }) =>
    api.post<TokenResponse>('/auth/login', payload, { skipAuthRefresh: true }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<TokenResponse>('/auth/register', payload, { skipAuthRefresh: true }).then((r) => r.data),

  logout: () => api.post('/auth/logout', null, { skipAuthRefresh: true }),

  availability: (params: { username?: string; email?: string }, signal?: AbortSignal) =>
    api
      .get<{ username: FieldAvailability | null; email: FieldAvailability | null }>('/auth/availability', {
        params,
        signal,
      })
      .then((r) => r.data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (payload: { token: string; password: string; password_confirm: string }) =>
    api.post('/auth/reset-password', payload).then((r) => r.data),
};
