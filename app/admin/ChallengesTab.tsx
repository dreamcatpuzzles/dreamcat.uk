"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";
import type { AdminChallenge } from "@/app/admin/types";

interface ChallengesTabProps {
  challenges: AdminChallenge[];
}

export default function ChallengesTab({ challenges }: ChallengesTabProps) {
  const queryClient = useQueryClient();

  const resolve = useMutation({
    mutationFn: ({ challengeId, playerId, outcome }: {
      challengeId: string;
      playerId: string;
      outcome: "completed" | "abandoned";
    }) =>
      apiJson(`/api/admin/challenges/${encodeURIComponent(challengeId)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, outcome }),
      }),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.challenges }),
        queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
      ]);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {challenges.length === 0 && (
        <p className="text-center">No active challenges.</p>
      )}
      {challenges.map((challenge) => (
        <article
          key={challenge.id}
          className="rounded-xl bg-gray-800 p-5 shadow"
        >
          <h2 className="text-2xl capitalize">
            {challenge.name ?? "Waiting to collect a challenge"}
            {challenge.accessory && (
              <span className="text-lg text-gray-300"> ({challenge.accessory})</span>
            )}
          </h2>
          <div className="mt-3 space-y-3">
            {challenge.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={player.profilePictureUrl}
                  alt={player.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <span className="flex-1">{player.name} ({player.id})</span>
                {player.proofImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.proofImageUrl}
                    alt={`Proof from ${player.name}`}
                    className="h-16 w-16 rounded object-cover"
                  />
                )}
                {player.status === "open" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        resolve.mutate({
                          challengeId: challenge.id,
                          playerId: player.id,
                          outcome: "completed",
                        })}
                      disabled={resolve.isPending}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
                    >
                      complete for {player.name}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        resolve.mutate({
                          challengeId: challenge.id,
                          playerId: player.id,
                          outcome: "abandoned",
                        })}
                      disabled={resolve.isPending}
                      className="rounded bg-gray-600 px-3 py-1.5 text-white disabled:opacity-50"
                    >
                      give up for {player.name}
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400">{player.status}</span>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
      {resolve.error && (
        <p role="alert" className="text-center text-red-300">
          {resolve.error.message}
        </p>
      )}
    </div>
  );
}
