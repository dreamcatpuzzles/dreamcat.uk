"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import NetworkGraph, { type GraphDelivery } from "@/app/admin/AdminNetworkGraph";
import type { Connection, Player } from "@/app/admin/types";
import { socket } from "@/app/socket";

interface GraphResponse {
  players: Pick<Player, "id" | "profilePictureUrl" | "paused">[];
  connections: (Omit<Connection, "playerOne" | "playerTwo"> & {
    playerOne: Pick<Player, "id">;
    playerTwo: Pick<Player, "id">;
  })[];
  deliveries: (Omit<GraphDelivery, "package"> & {
    package: Pick<GraphDelivery["package"], "id">;
  })[];
  latestProofs: { id: string; imageUrl: string }[];
  leaderboard: { id: string; name: string; connections: number }[];
}

export default function GraphPage() {
  const queryClient = useQueryClient();
  const graph = useQuery({
    queryKey: queryKeys.publicGraph,
    queryFn: ({ signal }) => apiJson<GraphResponse>("/api/graph", { signal }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicGraph });
    };
    const join = () => socket.emit("join-graph");
    socket.on("network:updated", refresh);
    socket.on("connect", join);
    socket.on("connect", refresh);
    if (socket.connected) join();
    return () => {
      socket.off("network:updated", refresh);
      socket.off("connect", join);
      socket.off("connect", refresh);
    };
  }, [queryClient]);

  // Whenever a package reaches a new holder, queue a slow pan to that player.
  // The queue holds at most three pending pans; extras displace the oldest.
  const [focusRequest, setFocusRequest] = useState<{
    playerId: string;
    seq: number;
  } | null>(null);
  const focusSeq = useRef(0);
  const focusQueue = useRef<string[]>([]);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDeliveries = useRef<Map<
    string,
    { holder: string; owner: string }
  > | null>(null);
  const [glowRequest, setGlowRequest] = useState<{
    playerId: string;
    seq: number;
  } | null>(null);
  const glowSeq = useRef(0);

  const pumpFocus = useRef<() => void>(() => {});
  useEffect(() => {
    pumpFocus.current = () => {
      focusTimer.current = null;
      const next = focusQueue.current.shift();
      if (next === undefined) return;
      setFocusRequest({ playerId: next, seq: ++focusSeq.current });
      focusTimer.current = setTimeout(() => pumpFocus.current(), 5000);
    };
  }, []);

  const enqueueFocus = useCallback((playerId: string) => {
    if (focusQueue.current.length >= 3) focusQueue.current.shift();
    focusQueue.current.push(playerId);
    if (focusTimer.current === null) pumpFocus.current();
  }, []);

  useEffect(() => {
    const deliveries = graph.data?.deliveries;
    if (!deliveries) return;
    const active = new Map(
      deliveries.map((delivery) => [
        delivery.package.id,
        {
          holder: delivery.journey.at(-1) ?? delivery.owner.id,
          owner: delivery.owner.id,
        },
      ]),
    );
    const previous = previousDeliveries.current;
    if (previous) {
      for (const [packageId, { holder }] of active) {
        if (previous.get(packageId)?.holder !== holder) enqueueFocus(holder);
      }
      // A delivery leaving the active list means its proof was accepted —
      // flash the deliverer's node.
      for (const [packageId, { owner }] of previous) {
        if (!active.has(packageId)) {
          setGlowRequest({ playerId: owner, seq: ++glowSeq.current });
        }
      }
    }
    previousDeliveries.current = active;
  }, [graph.data, enqueueFocus]);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    [],
  );

  return (
    <main className="relative h-screen overflow-hidden">
      {graph.isPending && <p className="p-6 text-center">Loading network…</p>}
      {graph.isError && <p role="alert" className="p-6 text-center text-red-700">Could not load the network.</p>}
      {graph.data && (
        <>
          <div className="absolute inset-0">
            <NetworkGraph
              isPublicView
              focusRequest={focusRequest}
              glowRequest={glowRequest}
              players={graph.data.players.map((player) => ({ ...player, name: "" }))}
              connections={graph.data.connections.map((connection) => ({
                ...connection,
                playerOne: { ...connection.playerOne, name: "" },
                playerTwo: { ...connection.playerTwo, name: "" },
              }))}
              deliveries={graph.data.deliveries.map((delivery) => ({
                ...delivery,
                package: { ...delivery.package, name: "" },
              }))}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
            <aside className="w-72">
              <h1 className="mb-4 text-4xl text-white drop-shadow-md">leaderboard</h1>
              <ol className="space-y-2">
                {graph.data.leaderboard.slice(0, 7).map((entry, index) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 text-2xl shadow"
                  >
                    <span className="w-8 text-right opacity-60">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {entry.connections}x
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/person_icon.svg" alt="" aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
            <div>
              <h1 className="mb-4 text-4xl text-white drop-shadow-md">latest deliveries</h1>
              <div className="flex gap-4">
                {graph.data.latestProofs.map((proof) => (
                  <Image
                    key={proof.id}
                    unoptimized
                    width={288}
                    height={288}
                    src={proof.imageUrl}
                    alt="Proof of delivery"
                    className="aspect-square h-48 rounded-lg object-cover shadow"
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
