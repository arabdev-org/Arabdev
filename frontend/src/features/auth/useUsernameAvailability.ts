import { useQuery } from '@tanstack/react-query';

import { authApi } from '@/api/auth';
import { useDebouncedValue } from '@/hooks';

export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

/**
 * Live "is this username free?" check (debounced). Returns null while the value is
 * locally invalid or unchanged, so the form's own validation message takes over.
 */
export function useUsernameAvailability(username: string, current?: string) {
  const value = useDebouncedValue(username.trim().replace(/^@/, '').toLowerCase(), 350);
  const enabled = USERNAME_PATTERN.test(value) && value !== current;
  const query = useQuery({
    queryKey: ['availability', 'username', value],
    queryFn: ({ signal }) => authApi.availability({ username: value }, signal),
    enabled,
    staleTime: 30_000,
  });
  return {
    value,
    checking: enabled && query.isFetching,
    result: enabled ? (query.data?.username ?? null) : null,
  };
}
