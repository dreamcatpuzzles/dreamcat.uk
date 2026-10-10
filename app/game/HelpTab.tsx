"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button, LinkButton } from "@/app/Button";
import { GAME_OVER_KEY } from "@/app/GameOverRedirect";
import Modal from "@/app/Modal";
import type { NetworkResponse } from "@/app/game/types";

interface HelpTabProps {
  paused: boolean;
  loading: boolean;
  error: string;
  canReceivePackage: boolean;
}

export default function HelpTab({ paused, loading, error, canReceivePackage }: HelpTabProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const pause = useMutation({
    mutationFn: (paused: boolean) => apiJson<{ paused: boolean }>("/api/player/pause", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    }),
    onSuccess: (data) => {
      setConfirming(false);
      queryClient.setQueryData<NetworkResponse>(queryKeys.game.network, (network) => network ? {
        ...network,
        player: {
          ...network.player,
          paused: data.paused,
          pauseReason: data.paused ? "manual" : null,
        },
      } : network);
      void Promise.all([
        queryKeys.game.all,
        queryKeys.session,
        queryKeys.admin.players,
        queryKeys.admin.connections,
        queryKeys.admin.deliveries,
        queryKeys.publicGraph,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-center text-4xl">Settings</h1>
      <button
        type="button"
        disabled={loading || Boolean(error) || pause.isPending}
        onClick={() => (paused ? pause.mutate(false) : setConfirming(true))}
        className="mx-auto block rounded bg-rose-500 px-5 py-3 text-xl text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pause.isPending ? (pause.variables ? "Pausing…" : "Unpausing…") : paused ? "unpause" : "pause my game"}
      </button>
      {confirming && (
        <Modal
          title="Do you wish to pause?"
          onClose={() => setConfirming(false)}
          closeText="nope, I'll stay"
          actions={
            <Button
              onClick={() => pause.mutate(true)}
              disabled={pause.isPending}
            >
              {pause.isPending ? "pausing…" : "yep, give me a break"}
            </Button>
          }
        >
          <div className="space-y-3 text-center">
            <p>
              Whilst you are paused, you will not be selected as a delivery
              target for other players.
            </p>
            <p>
              Please do this if you are taking a break for a few minutes or
              leaving the game.
            </p>
          </div>
        </Modal>
      )}
      {paused && (
        <>
          <button
            type="button"
            onClick={() => setEnding(true)}
            className="mx-auto mt-6 block rounded bg-black px-5 py-3 text-xl text-white"
          >
            END GAME
          </button>
          {ending && (
            <Modal
              title="Are you sure you want to end the game?"
              onClose={() => setEnding(false)}
              closeText="actually I'll stay"
              actions={
                <Button
                  onClick={() => {
                    window.localStorage.setItem(GAME_OVER_KEY, "1");
                    router.push("/wrapped");
                  }}
                >
                  yes, I&rsquo;m outta here
                </Button>
              }
            >
              <div className="space-y-3 text-center">
                <p>You won&rsquo;t be able to rejoin.</p>
                <p>But you will get a fun summary of your adventures!</p>
              </div>
            </Modal>
          )}
        </>
      )}
      {(error || pause.error) && <p role="alert" className="mt-4 text-center text-red-700">{error || pause.error?.message}</p>}
      <nav className="mt-8 flex flex-col items-center gap-3 text-xl">
        <LinkButton href="/new/welcome">
          review networking guide
        </LinkButton>
        {canReceivePackage && (
          <LinkButton href="/new/deliveries">
            review delivery guide
          </LinkButton>
        )}
      </nav>
    </main>
  );
}
