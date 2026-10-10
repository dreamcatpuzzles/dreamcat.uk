"use client";

import {
  useMutation,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PlayerHeader from "@/app/PlayerHeader";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";
import GameNavigation from "@/app/game/GameNavigation";
import InboxTab from "@/app/game/InboxTab";
import HelpTab from "@/app/game/HelpTab";
import NetworkTab from "@/app/game/NetworkTab";
import IcebreakerModal from "@/app/game/IcebreakerModal";
import ScanModal, { type ScanResponse } from "@/app/game/ScanModal";
import type {
  GameTab,
  InboxResponse,
  NetworkConnection,
  NetworkResponse,
} from "@/app/game/types";
import { socket } from "@/app/socket";

export default function GamePage() {
  const [activeTab, setActiveTab] = useState<GameTab>("inbox");
  const [scanOpen, setScanOpen] = useState(false);
  const [greeting, setGreeting] = useState<NetworkConnection | null>(null);
  const shownGreetingsRef = useRef<Set<string>>(new Set());
  const [pickup, setPickup] = useState<{
    name: string;
    recipient: string | null;
  } | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [inboxQuery, networkQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.game.inbox,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<InboxResponse>("/api/inbox", { signal }),
      },
      {
        queryKey: queryKeys.game.network,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<NetworkResponse>("/api/network", { signal }),
      },
    ],
  });

  const playerId = networkQuery.data?.player.id;
  const paused = Boolean(networkQuery.data?.player.paused);
  const pauseReason = networkQuery.data?.player.pauseReason ?? null;
  const canScan = !paused && !networkQuery.isPending && !networkQuery.isError;
  const canReceivePackage = Boolean(inboxQuery.data?.canReceivePackage);

  // Once networking is done the player gets a "Delivery induction" inbox
  // item instead of being pushed straight into the guide — the icebreaker
  // for their last connection still shows on top of it. The key changed from
  // the old auto-redirect's "delivery-guide-seen" because that flag was set
  // without the guide ever being shown.
  const guideKey = playerId ? `delivery-induction-done:${playerId}` : null;
  const guideSeen = Boolean(
    guideKey &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(guideKey),
  );
  const deliveryInduction = canReceivePackage && !guideSeen;
  const learnDelivery = () => {
    if (guideKey) window.localStorage.setItem(guideKey, "1");
    router.push("/new/deliveries");
  };

  const { mutate: markGreeted } = useMutation({
    mutationFn: (connectionId: string) =>
      apiJson(`/api/connections/${encodeURIComponent(connectionId)}/greeted`, { method: "POST" }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.network });
    },
  });

  const closeGreeting = () => setGreeting(null);

  useEffect(() => {
    if (greeting || pickup) return;
    const network = networkQuery.data;
    const ungreeted = network?.connections.filter(
      (connection) =>
        connection.status === "confirmed" &&
        !connection.greeted &&
        !shownGreetingsRef.current.has(connection.id),
    ) ?? [];
    const latestUngreeted = ungreeted.at(-1);
    if (!latestUngreeted) return;
    for (const connection of ungreeted) {
      shownGreetingsRef.current.add(connection.id);
    }
    markGreeted(latestUngreeted.id);
    const frame = requestAnimationFrame(() => setGreeting(latestUngreeted));
    return () => cancelAnimationFrame(frame);
  }, [networkQuery.data, greeting, pickup, markGreeted]);

  const handleScanComplete = (response: ScanResponse) => {
    setScanOpen(false);
    setActiveTab("inbox");
    if (response.kind === "package" && !response.alreadyOwn) {
      setPickup({
        name: response.packageName || "a duck",
        recipient:
          response.packageType === "direct"
            ? response.recipient ?? "the recipient"
            : null,
      });
    }
  };

  // Tell the server the player still has the game open, once a minute.
  useEffect(() => {
    const ping = () => {
      void fetch("/activity/alive", { method: "POST" }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshGameData = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    };
    socket.on("connections:updated", refreshGameData);
    socket.on("deliveries:updated", refreshGameData);
    socket.on("challenges:updated", refreshGameData);
    socket.on("connect", refreshGameData);
    if (playerId) socket.disconnect().connect();
    return () => {
      socket.off("connections:updated", refreshGameData);
      socket.off("deliveries:updated", refreshGameData);
      socket.off("challenges:updated", refreshGameData);
      socket.off("connect", refreshGameData);
    };
  }, [playerId, queryClient]);

  return (
    <div className="min-h-screen pb-24">
      <PlayerHeader
        stats={networkQuery.data && {
          connections: networkQuery.data.connections.filter((connection) => connection.status === "confirmed").length,
          completedDeliveries: networkQuery.data.completedDeliveries,
        }}

      />
      {activeTab === "inbox" ? (
        <InboxTab
          challenges={inboxQuery.data?.challenges ?? []}
          connections={inboxQuery.data?.connections ?? []}
          packages={inboxQuery.data?.packages ?? []}
          canReceivePackage={canReceivePackage}
          deliveryInduction={deliveryInduction}
          onLearnDelivery={learnDelivery}
          loading={inboxQuery.isPending}
          error={inboxQuery.isError ? "Could not load your missions." : ""}
          paused={paused}
          pauseReason={pauseReason}
        />
      ) : activeTab === "network" ? (
        <NetworkTab
          network={networkQuery.data ?? null}
          loading={networkQuery.isPending}
          error={networkQuery.isError ? "Could not load your network." : ""}
        />
      ) : (
        <HelpTab
          paused={paused}
          loading={networkQuery.isPending}
          error={networkQuery.isError ? "Could not load your player status." : ""}
          canReceivePackage={canReceivePackage}
        />
      )}
      {greeting && (
        <IcebreakerModal
          name={greeting.player.name ?? "a new friend"}
          profilePictureUrl={greeting.player.profilePictureUrl}
          onDone={closeGreeting}
        />
      )}
      {pickup && pickup.recipient !== null ? (
        <Modal
          title="This is a special delivery!"
          actions={
            <Button onClick={() => setPickup(null)}>
              it would be my honour
            </Button>
          }
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-2xl">
              You&rsquo;ve been entrusted with a very important mission:
            </p>
            <p>
              Take this package to {pickup.recipient}, take a proof of
              delivery, and then return to the post office.
            </p>
          </div>
        </Modal>
      ) : pickup && (
        <Modal
          actions={
            <Button onClick={() => setPickup(null)}>
              let&rsquo;s go!
            </Button>
          }
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-2xl">You&rsquo;ve picked up {pickup.name}!</p>
          </div>
        </Modal>
      )}
      {scanOpen && canScan && playerId && (
        <ScanModal
          playerId={playerId}
          onClose={() => setScanOpen(false)}
          onComplete={handleScanComplete}
        />
      )}
      <GameNavigation
        activeTab={activeTab}
        onSelect={(tab) => {
          setActiveTab(tab);
          setScanOpen(false);
        }}
        onScan={() => {
          if (canScan) setScanOpen(true);
        }}
        scanDisabled={!canScan}
      />
    </div>
  );
}
