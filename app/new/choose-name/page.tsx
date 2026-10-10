"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import SignupGate from "@/app/SignupGate";
import Link from "next/link";
import InlineLink from "@/app/InlineLink";

function getLastScannedId() {
  if (typeof window === "undefined") {
    return "";
  }
  const idFromStorage = window.sessionStorage.getItem("lastScannedId") ?? "";
  if (idFromStorage.length !== 5) {
    return "";
  }
  return idFromStorage;
}

export default function ChooseNamePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [allowEditId, setAllowEditId] = useState(true)
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const createPlayer = useMutation({
    mutationFn: ({
      imageKey,
      name: playerName,
      userId: playerId,
    }: {
      imageKey: string;
      name: string;
      userId: string;
    }) =>
      apiJson(
        "/api/players",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: playerId,
            name: playerName,
            imageKey,
          }),
        },
        "Could not create player",
      ),
    onSuccess: () => {
      sessionStorage.removeItem("uploadedImageKey");
      sessionStorage.removeItem("lastScannedId");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.session }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.players,
        }),
      ]);
      router.push("/new/welcome");
    },
    onError: (error) => {
      console.log(error);
      setAllowEditId(true);
    }
  });

  const submitPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const imageKey = sessionStorage.getItem("uploadedImageKey");
    if (!imageKey) {
      setStatus("Upload a self-portrait first.");
      return;
    }

    setStatus("");
    createPlayer.mutate({ userId, name, imageKey });
  };

  useEffect(() => {
    const lastScannedId = getLastScannedId();
    if (lastScannedId) {
      setUserId(lastScannedId);
      setAllowEditId(false);
    }
  }, []);

  return (
    <SignupGate>
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <InlineLink href="/new/upload-photo" size="2xl">
        ← back
      </InlineLink>
      <h1 className="text-center text-3xl">What&apos;s your name?</h1>
      <p>Please use the name you&apos;d like everyone else here to call you.</p>
      <p>Surname too please! There are enough Bens flying around.</p>

      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={submitPlayer}
      >
        <label className="flex flex-col gap-1">
          Your name
          <input
            className="rounded border border-rose-500 bg-white px-3 py-2"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          5-character code on ID card (next to your QR code)
          <input
            className="rounded border border-rose-500 bg-white px-3 py-2 uppercase disabled:cursor-not-allowed disabled:bg-gray-100"
            type="text"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            minLength={5}
            maxLength={5}
            pattern="[a-zA-Z0-9]{5}"
            autoCapitalize="characters"
            required
            disabled={!allowEditId}
          />
        </label>

        <Button
          type="submit"
          disabled={createPlayer.isPending}
        >
          {createPlayer.isPending ? "saving…" : "let's play the game!"}
        </Button>
      </form>

      {(status || createPlayer.error) && (
        <p role="status">
          {status || createPlayer.error?.message}
        </p>
      )}
    </main>
    </SignupGate>
  );
}
