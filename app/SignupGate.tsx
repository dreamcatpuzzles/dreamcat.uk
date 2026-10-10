"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { apiJson, queryKeys } from "@/app/api";

// Wraps pages in the signup flow: when signups are disabled, logged-out
// visitors see a plain "not yet" page instead. Signed-in players are
// unaffected, as is the admin site (which never goes through this gate).
export default function SignupGate({ children }: { children: ReactNode }) {
  const configQuery = useQuery({
    queryKey: queryKeys.config,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiJson<{ signupsAllowed: boolean }>("/api/config", { signal }),
  });
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiJson("/api/session", { signal }, "Could not load session"),
    // A failed session lookup must not refetch on mount — otherwise a page
    // that mounts/unmounts this gate on the query's pending flag loops
    // forever (remount refetch -> pending -> unmount -> remount).
    retry: false,
    retryOnMount: false,
  });

  if (configQuery.isPending || sessionQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Loading…</p>
      </main>
    );
  }

  if (configQuery.data?.signupsAllowed === false && !sessionQuery.isSuccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <h1 className="text-4xl">Not yet!</h1>
        <p>Come back from 6pm to sign up and play</p>
      </main>
    );
  }

  return <>{children}</>;
}
