"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { apiJson, queryKeys } from "@/app/api";

function PlayerContent() {
  const otherPlayerId = useSearchParams().get("id");
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmConnection = useMutation({
    mutationFn: (playerId: string) =>
      apiJson<{ otherPlayerName: string }>(
        "/api/connections/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherPlayerId: playerId }),
        },
        "No connection",
      ),
    onSuccess: () => {
      console.log(confirmConnection.failureReason);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });
  const { mutate } = confirmConnection;

  // StrictMode remounts effects in dev, which would scan the same code twice and show an error
  const scannedRef = useRef<string | null>(null);
  useEffect(() => {
    if (otherPlayerId && scannedRef.current !== otherPlayerId) {
      scannedRef.current = otherPlayerId;
      mutate(otherPlayerId);
    }
  }, [mutate, otherPlayerId]);

  let message = "Checking connection…";
  if (confirmConnection.data) {
    message = `You connected with ${confirmConnection.data.otherPlayerName}!`;
  } else if (confirmConnection.isError) {
    message = "This isn't a player you need to connect with (yet!)";
  }

  useEffect(() => {
    if (confirmConnection.failureReason?.message === "Not signed in") {
      window.sessionStorage.setItem("lastScannedId", otherPlayerId ?? "");
      router.replace("/");
    }
  }, [confirmConnection.failureReason, otherPlayerId, router]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center p-6 text-center">
      <h1 className="text-2xl">
        {otherPlayerId ? message : "Player not found."}
      </h1>
      <Link
        href="/game"
        className="mt-8 rounded-xl bg-rose-500 px-6 py-3 text-xl text-white"
      >
        Back to inbox
      </Link>
    </main>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayerContent />
    </Suspense>
  );
}
