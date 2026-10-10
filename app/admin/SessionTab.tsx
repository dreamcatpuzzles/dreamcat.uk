"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiVoid, queryKeys } from "@/app/api";
import type { AdminSession } from "@/app/admin/AdminLoginForm";
import { socket } from "@/app/socket";

interface SessionTabProps {
  playerId: string | null;
}

export default function SessionTab({ playerId }: SessionTabProps) {
  const queryClient = useQueryClient();

  function clearAdminState() {
    queryClient.removeQueries({ queryKey: queryKeys.admin.players });
    queryClient.removeQueries({ queryKey: queryKeys.admin.uploads });
    queryClient.removeQueries({ queryKey: queryKeys.admin.connections });
    queryClient.setQueryData<AdminSession>(
      queryKeys.admin.session,
      { role: "player" },
    );
  }

  const leavePlayer = useMutation({
    mutationFn: () =>
      apiJson<AdminSession>(
        "/api/admin/session/player",
        { method: "DELETE" },
        "Could not log out as player",
      ),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.admin.session, session);
      queryClient.removeQueries({ queryKey: queryKeys.session });
      queryClient.removeQueries({ queryKey: queryKeys.game.all });
      socket.disconnect().connect();
    },
  });

  const leaveAdmin = useMutation({
    mutationFn: () =>
      apiVoid(
        "/api/admin/session",
        { method: "DELETE" },
        "Could not leave admin mode",
      ),
    onSuccess: clearAdminState,
  });

  const logOut = useMutation({
    mutationFn: () =>
      apiVoid(
        "/api/session",
        { method: "DELETE" },
        "Could not log out",
      ),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.game.all });
      clearAdminState();
      socket.disconnect().connect();
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  const isPending = leavePlayer.isPending || leaveAdmin.isPending ||
    logOut.isPending;
  const error = leavePlayer.error ?? leaveAdmin.error ?? logOut.error;

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-xl bg-gray-800 p-5 shadow">
      <p>
        {playerId
          ? `Logged in as player ${playerId}.`
          : "Not logged in as a player."}
      </p>
      {playerId && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => leavePlayer.mutate()}
          className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {leavePlayer.isPending ? "Logging out…" : "Log out as player"}
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => leaveAdmin.mutate()}
          className="rounded bg-red-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {leaveAdmin.isPending ? "Leaving…" : "Log out of admin role"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => logOut.mutate()}
          className="rounded bg-red-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logOut.isPending ? "Logging out…" : "Log out entirely"}
        </button>
      </div>

      {error && <p className="text-red-300">{error.message}</p>}
    </section>
  );
}
