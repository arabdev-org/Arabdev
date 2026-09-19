import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { RouterProvider } from 'react-router/dom';

import { NotifierProvider } from '@/components/Notifier';
import { PreferencesProvider } from '@/features/preferences/PreferencesProvider';
import { router } from '@/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <NotifierProvider>
          <RouterProvider router={router} />
        </NotifierProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
