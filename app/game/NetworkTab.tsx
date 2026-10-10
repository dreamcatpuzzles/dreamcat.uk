"use client";

import { useCallback, useState } from "react";
import Modal from "@/app/Modal";
import NetworkGraph from "@/app/game/NetworkGraph";
import type { NetworkPlayer, NetworkResponse } from "@/app/game/types";

interface NetworkTabProps {
  error: string;
  loading: boolean;
  network: NetworkResponse | null;
}

export default function NetworkTab({
  error,
  loading,
  network,
}: NetworkTabProps) {
  const [view, setView] = useState<"graph" | "list" | "leaderboard">("graph");
  const [selected, setSelected] = useState<NetworkPlayer | null>(null);
  const select = useCallback((player: NetworkPlayer) => setSelected(player), []);
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-4 text-center text-4xl">My Network</h1>
      <div className="mb-6 flex justify-center gap-2" role="tablist">
        {(["graph", "list", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={view === tab}
            onClick={() => setView(tab)}
            className={`rounded-xl px-4 py-2 text-2xl transition ${
              view === tab
                ? "bg-rose-500 text-white"
                : "text-rose-800 hover:bg-rose-100"
            }`}
          >
            {tab === "graph" ? "Graph" : tab === "list" ? "List" : "Leaderboard"}
          </button>
        ))}
      </div>
      {loading && !network && (
        <p className="text-center">Loading your network…</p>
      )}
      {error && <p className="text-center text-red-700">{error}</p>}
      {network && !error && view === "graph" && (
        <NetworkGraph
          player={network.player}
          connections={network.connections}
          peerConnections={network.peerConnections}
          onSelect={select}
        />
      )}
      {network && !error && view === "list" && (
        <ul className="space-y-4">
          {network.connections.map((connection, index) => (
            <li
              key={connection.id}
              className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow ${
                index % 2 === 1 ? "flex-row-reverse text-right" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={connection.player.profilePictureUrl}
                alt={connection.player.name ?? "A new connection"}
                className="aspect-square w-1/2 shrink-0 rounded-full object-cover"
              />
              <p className="text-5xl">
                {connection.player.name ?? "???"}
              </p>
            </li>
          ))}
        </ul>
      )}
      {network && !error && view === "leaderboard" && (
        <ol className="space-y-2">
          {network.leaderboard.map((entry, index) => (
            <li
              key={entry.id}
              className={`flex items-center gap-4 rounded-2xl p-4 text-2xl shadow ${
                entry.id === network.player.id
                  ? "bg-rose-500 text-white"
                  : "bg-white"
              }`}
            >
              <span className="w-10 text-right opacity-60">{index + 1}</span>
              <span className="flex-1">{entry.name}</span>
              <span className="flex items-center gap-1">
                {entry.connections}x
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/person_icon.svg"
                  alt=""
                  aria-hidden="true"
                  className={`h-5 w-5 ${entry.id === network.player.id ? "invert" : ""}`}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
      {selected && (
        <Modal
          onClose={() => setSelected(null)}
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.profilePictureUrl}
              alt={selected.name ?? "Player portrait"}
              className="w-full max-w-sm rounded-full object-cover"
            />
            <p className="text-3xl">{selected.name ?? "Someone new!"}</p>
          </div>
        </Modal>
      )}
    </main>
  );
}
