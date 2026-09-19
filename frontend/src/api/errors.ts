import { isAxiosError } from 'axios';
import type { TFunction } from 'i18next';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import type { ApiErrorBody } from '@/types/api';

export function apiErrorBody(error: unknown): ApiErrorBody | null {
  if (isAxiosError<ApiErrorBody>(error) && error.response?.data && typeof error.response.data === 'object') {
    return error.response.data;
  }
  return null;
}

export function errorCode(error: unknown): string | null {
  return apiErrorBody(error)?.code ?? null;
}

/** A user-friendly, translated message for any error thrown by the API client. */
export function errorMessage(error: unknown, t: TFunction): string {
  if (isAxiosError(error) && !error.response) return t('errors.network');
  const body = apiErrorBody(error);
  if (!body) return t('errors.generic');
  if (body.code === 'validation_error' && body.errors?.length) {
    const first = body.errors[0];
    return t(`errors.${first.code}`, { defaultValue: first.message });
  }
  return t(`errors.${body.code}`, { defaultValue: body.detail || t('errors.generic') });
}

/**
 * Maps server-side field errors onto react-hook-form fields. Returns true when at least
 * one field was highlighted, so callers can skip a generic toast.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  t: TFunction,
  fields: readonly Path<T>[],
): boolean {
  const body = apiErrorBody(error);
  if (!body) return false;
  let applied = false;
  const set = (field: string | null | undefined, code: string, message: string) => {
    if (field && (fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message: t(`errors.${code}`, { defaultValue: message }) });
      applied = true;
    }
  };
  body.errors?.forEach((item) => set(item.field, item.code, item.message));
  set(body.field, body.code, body.detail);
  return applied;
}
