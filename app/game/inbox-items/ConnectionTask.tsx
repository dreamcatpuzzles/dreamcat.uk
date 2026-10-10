import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";
import DebugCheatButton from "@/app/game/DebugCheatButton";
import type { ConnectionMission } from "@/app/game/types";

// The server sends hintDelaySeconds — seconds until the next hint action
// unlocks. The task card is keyed by hint level so claiming a hint remounts
// it and restarts the countdown.
function maskName(name: string) {
  return name
    .split(" ")
    .map((word) =>
      word.length <= 1 ? "_" :
      word.length === 2 ? `${word[0]}_` :
      `${word[0]}${"_".repeat(word.length - 2)}${word[word.length - 1]}`)
    .join(" ");
}

export default function ConnectionTask({ connection }: { connection: ConnectionMission }) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [givingUp, setGivingUp] = useState(false);
  const ready = elapsed >= connection.hintDelaySeconds;
  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [ready]);
  const giveUpStage = connection.hintLevel >= 2;
  const secondsLeft = Math.ceil(
    Math.max(0, connection.hintDelaySeconds - elapsed) / 10,
  ) * 10;

  const hintAction = useMutation({
    mutationFn: (action: "hint" | "give-up") =>
      apiJson(
        `/api/connections/${encodeURIComponent(connection.id)}/${action}`,
        { method: "POST" },
        "Could not update the connection",
      ),
    onSuccess: (_data, action) => {
      if (action === "give-up") setGivingUp(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });

  return (
    <article data-kind="connection" className="space-y-3 rounded-2xl bg-white p-4 text-center text-2xl shadow">
      <p>Find this person:</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={connection.profilePictureUrl}
        alt="Player to connect with"
        className="block aspect-square w-full rounded-full object-cover"
      />
      {connection.name && connection.hintLevel > 0 && (
        <p className="tracking-widest">
          {connection.hintLevel >= 2 ? connection.name : maskName(connection.name)}
        </p>
      )}
      <p>then scan their QR code!</p>
      <DebugCheatButton kind="connection" id={connection.id} />
      <button
        type="button"
        disabled={!ready || hintAction.isPending}
        onClick={() =>
          giveUpStage ? setGivingUp(true) : hintAction.mutate("hint")}
        className="mt-2 w-full rounded border border-green-700 bg-green-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-white disabled:text-green-950"
      >
        {ready
          ? giveUpStage ? "give up" : "hint"
          : `${giveUpStage ? "give up" : "hint"} available in ${secondsLeft} seconds`}
      </button>
      {givingUp && (
        <Modal
          title="Give up?"
          onClose={() => setGivingUp(false)}
          closeText="actually, no"
          secondaryActions={
            <div className="flex gap-2">
              <Button
                onClick={() => hintAction.mutate("give-up")}
                disabled={hintAction.isPending}
              >
                {hintAction.isPending ? "giving up…" : "yes, I surrender"}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-center">
            <p><strong>Are you sure you want to give up?</strong></p>
            <p>
              You&apos;ll be given a new connection target, but we&apos;ll keep
              this connection around as they might find you!
            </p>
          </div>
        </Modal>
      )}
    </article>
  );
}
