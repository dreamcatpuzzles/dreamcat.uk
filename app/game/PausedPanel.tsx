"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";

export default function PausedPanel({ auto }: { auto: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const unpause = useMutation({
    mutationFn: () =>
      apiJson("/api/player/pause", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: false }),
      }),
    onSuccess: () => {
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  return (
    <article className="space-y-3 rounded-2xl bg-white p-4 text-center text-2xl shadow">
      <p className="text-4xl font-bold">GAME PAUSED</p>
      <p>
        {auto
          ? "You have been automatically paused for inactivity"
          : "You have manually paused your game"}
      </p>
      <p className="text-xl">
        Whilst you are paused, you will not be selected for other players.
      </p>
      <p className="text-xl">Tap here to unpause and rejoin the game:</p>
      <Button onClick={() => setConfirmOpen(true)}>unpause</Button>
      {confirmOpen && (
        <Modal
          title="Are you ready to rejoin the game?"
          onClose={() => setConfirmOpen(false)}
          closeText="not yet"
          actions={
            <Button
              onClick={() => unpause.mutate()}
              disabled={unpause.isPending}
            >
              let me in!
            </Button>
          }
        >
          {unpause.error && (
            <p role="alert" className="text-center text-red-700">
              {unpause.error.message}
            </p>
          )}
        </Modal>
      )}
    </article>
  );
}
