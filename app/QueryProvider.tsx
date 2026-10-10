"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";

export default function AppQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // Explicit exponential backoff (1s, 2s, … capped at 30s) rather
            // than relying on the library default.
            retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30_000),
            staleTime: 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
