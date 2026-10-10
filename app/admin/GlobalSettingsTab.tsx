"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";

interface GlobalSettings {
  allowSignups: boolean;
  autoPauseEnabled: boolean;
  autoPauseMinutes: number;
  debugCheatMode: boolean;
  logSql: boolean;
  graphLockEnabled: boolean;
}

export default function GlobalSettingsTab() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<GlobalSettings>>({});
  const settingsQuery = useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiJson<GlobalSettings>("/api/admin/settings", { signal }),
  });
  const save = useMutation({
    mutationFn: (patch: Partial<GlobalSettings>) =>
      apiJson<GlobalSettings>("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.admin.settings, data);
      setDraft({});
    },
  });

  if (settingsQuery.isPending) return <p className="text-center">Loading…</p>;
  if (settingsQuery.isError || !settingsQuery.data) {
    return <p className="text-center text-red-300">Could not load settings.</p>;
  }
  const settings = { ...settingsQuery.data, ...draft };
  const dirtyCount = Object.keys(draft).length;

  return (
    <>
      <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-gray-800 p-5 pb-20 shadow">
        <h2 className="text-2xl">Global settings</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.allowSignups}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, allowSignups: event.target.checked }))
            }
            className="h-5 w-5"
          />
          allow signups?
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoPauseEnabled}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, autoPauseEnabled: event.target.checked }))
            }
            className="h-5 w-5"
          />
          is auto-pause enabled
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.debugCheatMode}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, debugCheatMode: event.target.checked }))
            }
            className="h-5 w-5"
          />
          debug cheat mode
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.logSql}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, logSql: event.target.checked }))
            }
            className="h-5 w-5"
          />
          log all SQL queries
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.graphLockEnabled}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({ ...current, graphLockEnabled: event.target.checked }))
            }
            className="h-5 w-5"
          />
          enable global graph lock
        </label>
        <label className="flex items-center gap-3">
          auto-pause after
          <input
            type="number"
            min={1}
            value={settings.autoPauseMinutes}
            disabled={save.isPending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                autoPauseMinutes: Math.max(1, Math.round(Number(event.target.value) || 1)),
              }))
            }
            className="w-20 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-center"
          />
          minutes of inactivity
        </label>
        {save.isError && (
          <p role="alert" className="text-red-300">
            {save.error.message}
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-700 bg-gray-900/95 p-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <span className="text-sm text-gray-300">
            {dirtyCount > 0
              ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`
              : "No unsaved changes"}
          </span>
          <button
            type="button"
            onClick={() => save.mutate(draft)}
            disabled={save.isPending || dirtyCount === 0}
            className="rounded bg-rose-500 px-5 py-2 text-white disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "save"}
          </button>
          <button
            type="button"
            onClick={() => setDraft({})}
            disabled={dirtyCount === 0}
            className="rounded bg-gray-600 px-5 py-2 text-white disabled:opacity-50"
          >
            revert
          </button>
        </div>
      </div>
    </>
  );
}
