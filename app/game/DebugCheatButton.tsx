"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";

interface DebugCheatButtonProps {
  kind: "connection" | "package";
  id: string;
}

// Renders nothing unless the admin "debug cheat mode" flag is on. When it
// is, fetches the code this task needs scanned and submits it to the real
// /api/scan endpoint — the normal scan flow then runs unchanged.
export default function DebugCheatButton({ kind, id }: DebugCheatButtonProps) {
  const queryClient = useQueryClient();
  const configQuery = useQuery({
    queryKey: queryKeys.config,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiJson<{ debugCheatMode?: boolean }>("/api/config", { signal }),
  });
  const cheat = useMutation({
    mutationFn: async () => {
      const { code } = await apiJson<{ code: string }>(
        `/api/cheat/scan-code/${kind}/${encodeURIComponent(id)}`,
      );
      return apiJson("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: code }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });

  if (configQuery.data?.debugCheatMode !== true) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => cheat.mutate()}
        disabled={cheat.isPending}
        className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {cheat.isPending ? "cheating…" : "debug: cheat"}
      </button>
      {cheat.error && (
        <p role="alert" className="text-base text-red-700">
          {cheat.error.message}
        </p>
      )}
    </div>
  );
}
