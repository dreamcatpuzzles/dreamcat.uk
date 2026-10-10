"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";
import SignupGate from "@/app/SignupGate";
import Link from "next/link";
import { Button } from "./Button";

interface Player {
  id: string;
  name: string;
  profilePictureUrl: string;
}

export default function Home() {
  const router = useRouter();
  const playerQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) =>
      apiJson<Player>(
        "/api/session",
        { signal },
        "Could not load session",
      ),
    retry: false,
  });
  const [showBanterModal, setShowBanterModal] = useState(false);

  // If the player is already logged in, we take them straight to the game view.
  useEffect(() => {
    if (playerQuery.data) {
      router.push("/game");
    }
  }, [playerQuery.data, router]);

  // isPending flips back to true during background refetches of a failed
  // (data-less) query, which would unmount SignupGate and its queries —
  // gate on isFetched instead so only the first load shows a spinner.
  if (!playerQuery.isFetched) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const content = (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <img src="/mascot.png" alt="Special Ducklivery duck mascot" className="w-32" />
      <h1 className="text-5xl text-rose-500 text-center py-4">Special Ducklivery!</h1>
      <div>
        <h2 className="text-3xl">How to play</h2>
        <p className="pb-2">This is a game about human connection, art, and rubber ducks.</p>
        <p className="pb-4">Start by uploading your self-portrait then your quest is to work with other attendees to deliver all the ducks!</p>
      </div>
      <Link href="/start" className="bg-rose-500 text-white py-2 px-4 rounded hover:bg-rose-600">
        awesome let's go
      </Link>
      <Button onClick={() => setShowBanterModal(true)} className="mt-4">
        oh wow that's a lot to remember i'm not sure i followed everything
      </Button>
      {showBanterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full flex flex-col items-center">
            <p>That's ok! We'll explain everything as you go along.</p>
            <p className="mb-4">
              (also if you want a hand come grab Michael or Sarah)
            </p>
            <Link href="/start" className="bg-rose-500 text-white py-3 px-4 rounded hover:bg-rose-600">
              ok let's actually start
            </Link>
            <br/>
            <Button theme="secondary" onClick={() => setShowBanterModal(false)} className="mt-4">
              back
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return <SignupGate>{content}</SignupGate>;
}
