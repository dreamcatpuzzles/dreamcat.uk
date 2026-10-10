"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiJson, queryKeys } from "@/app/api";

interface CollectResponse {
  id: string;
  name: string;
  type: string;
  location: string;
  otherPlayer: { id: string; name: string } | null;
}

export default function CollectChallenge() {
  const card = String(useParams().card ?? "");
  const router = useRouter();
  const queryClient = useQueryClient();
  const collect = useMutation({
    mutationFn: () =>
      apiJson<CollectResponse>(
        "/api/challenges/collect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card }),
        },
        "Could not collect this challenge",
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });
  const { mutate } = collect;

  // StrictMode remounts effects in dev, which would collect twice.
  const collectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (card && collectedRef.current !== card) {
      collectedRef.current = card;
      mutate();
    }
  }, [mutate, card]);

  useEffect(() => {
    if (collect.failureReason?.message === "Not signed in") {
      router.replace("/");
    }
  }, [collect.failureReason, router]);

  const data = collect.data;
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center p-6 text-center">
      <h1 className="text-2xl">
        {data
          ? `Your challenge with ${data.otherPlayer?.name} is: ${data.name}!`
          : collect.isError
            ? collect.error.message
            : "Collecting your challenge…"}
      </h1>
      {data && (
        <p className="mt-4 text-xl">
          {data.type === "captcha"
            ? `Go to ${data.location} and open the challenge from your inbox.`
            : "Read the description on the card to complete the challenge."}
        </p>
      )}
      <Link
        href="/game"
        className="mt-8 rounded-xl bg-rose-500 px-6 py-3 text-xl text-white"
      >
        Back to inbox
      </Link>
    </main>
  );
}
