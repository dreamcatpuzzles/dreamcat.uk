"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";
import type { ChallengeDetail } from "@/app/game/types";

const CREATURES: Record<string, string> = {
  duck: "ducks",
  frog: "frogs",
  crab: "crabs",
};

function accessoryPrompt(accessory: string, creature: string): string {
  switch (accessory) {
    case "flag": return `Select the squares with ${creature} flying the flag`;
    case "tattoo": return `Tap the squares with ${creature} sporting a tattoo`;
    case "earring": return `Select the squares with ${creature} wearing a shiny earring`;
    case "tache": return `Select the squares with ${creature} with a big ol' tache`;
    case "hat": return `Tap the squares with ${creature} rocking a spinny hat`;
    default: return `Select all squares with ${creature} wearing ${accessory}`;
  }
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

function BlankCaptchaGrid({ grid, selected, onToggle }: {
  grid: { rows: number; cols: number };
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div
      className="grid w-48 gap-1"
      style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: grid.rows * grid.cols }, (_, index) => {
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;
        const key = cellKey(row, col);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected.has(key)}
            aria-label={`cell ${row + 1}, ${col + 1}`}
            onClick={() => onToggle(key)}
            className={`aspect-square rounded border-2 ${
              selected.has(key) ? "border-rose-500 bg-rose-500/20" : "border-gray-300 bg-gray-100"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function CaptchaChallengeModal({ challengeId, onClose }: {
  challengeId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<"wrong" | null>(null);
  const [justSolved, setJustSolved] = useState(false);

  const detail = useQuery({
    queryKey: queryKeys.game.challenge(challengeId),
    queryFn: ({ signal }) =>
      apiJson<ChallengeDetail>(`/api/challenges/${encodeURIComponent(challengeId)}`, { signal }),
  });

  const refreshAndClose = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    onClose();
  };

  const submit = useMutation({
    mutationFn: () =>
      apiJson<{ correct: boolean }>(
        `/api/challenges/${encodeURIComponent(challengeId)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cells: [...selected] }),
        },
      ),
    onSuccess: (data) => {
      if (data.correct) {
        setJustSolved(true);
        void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
      } else {
        setResult("wrong");
      }
    },
  });

  const toggleCell = (key: string) => {
    setResult(null);
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const challenge = detail.data;
  const solved = justSolved || challenge?.solved === true;
  return (
    <Modal
      title="Captcha challenge!"
      onClose={solved ? undefined : refreshAndClose}
      actions={
        solved ? (
          <Button onClick={refreshAndClose}>continue</Button>
        ) : (
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || !challenge}>
            {submit.isPending ? "checking…" : "submit"}
          </Button>
        )
      }
    >
      {solved ? (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
          <p className="text-2xl">Correct!</p>
        </div>
      ) : !challenge ? (
        <div className="flex min-h-full items-center justify-center text-center">
          <p className="text-2xl">
            {detail.isError ? "This captcha could not be loaded." : "Loading…"}
          </p>
        </div>
      ) : (
        <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
          <p>Go to {challenge.location} and complete this captcha:</p>
          {challenge.grid ? (
            <BlankCaptchaGrid
              grid={challenge.grid}
              selected={selected}
              onToggle={toggleCell}
            />
          ) : (
            <p role="alert" className="text-red-700">This captcha could not be loaded.</p>
          )}
          {challenge.accessory && (
            <p>{accessoryPrompt(challenge.accessory, CREATURES[challenge.theme ?? ""] ?? "creatures")}</p>
          )}
          {result === "wrong" && (
            <p role="alert" className="text-red-700">Not correct, try again!</p>
          )}
          {submit.error && (
            <p role="alert" className="text-red-700">{submit.error.message}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
