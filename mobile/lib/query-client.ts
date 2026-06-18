import { QueryClient } from '@tanstack/react-query';
import { apiGet } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const path = queryKey[0] as string;
        return apiGet(path);
      },
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});
