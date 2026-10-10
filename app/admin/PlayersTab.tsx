"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiJson, apiVoid, queryKeys } from "@/app/api";
import type { AdminSession } from "@/app/admin/AdminLoginForm";
import type { Delivery, Package, Player, PlayerEvent, PlayerEventsResponse, PlayerResponse } from "@/app/admin/types";
import { socket } from "@/app/socket";
import Modal from "../Modal";
import QRForPlayer from "../QRForPlayer";
import { Button } from "../Button";
import QRCode from "react-qr-code";

interface PlayersTabProps {
  deliveries: Delivery[];
  packages: Package[];
  players: Player[];
}

const INACTIVE_SECONDS = 4 * 60;

function formatAge(seconds: number): string {
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function describeEvent(event: PlayerEvent): string {
  const data = event.data ?? {};
  switch (event.action) {
    case "alive": return "still active in the game";
    case "scan": {
      const detail =
        data.kind === "player" ? data.scannedPlayerId :
        data.kind === "package" ? (data.packageName ?? data.packageId) :
        data.kind === "challenge" ? data.challenge : null;
      return `scanned ${String(data.code ?? "a code")}${detail ? ` (${String(detail)})` : ""}`;
    }
    case "proof": return "submitted a proof of delivery photo";
    case "captcha":
      return `solved a captcha${data.partnerName ? ` with ${String(data.partnerName)}` : ""}`;
    case "hint": return "claimed a name hint";
    case "give_up": return "gave up on a connection";
    case "pause":
      return data.source === "auto" ? "was automatically paused for inactivity"
        : data.source === "admin" ? "was paused by the admin"
        : "paused the game";
    case "unpause": return "rejoined the game";
    default: return event.action;
  }
}

function EventList({ events }: { events: PlayerEvent[] }) {
  if (events.length === 0) return <p>No activity recorded yet.</p>;
  return (
    <ul className="space-y-1">
      {events.map((event, index) => (
        <li key={index} className="flex justify-between gap-3">
          <span>{describeEvent(event)}</span>
          <span className="shrink-0 text-gray-400">
            {new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlayerEventsModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const eventsQuery = useQuery({
    queryKey: ["admin", "players", player.id, "events"],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      apiJson<PlayerEventsResponse>(
        `/api/admin/players/${encodeURIComponent(player.id)}/events`,
        { signal },
      ),
  });
  return (
    <Modal title={`${player.name}'s activity`} onClose={onClose}>
      <div className="text-left text-base">
        {eventsQuery.isPending ? (
          <p>Loading…</p>
        ) : eventsQuery.isError ? (
          <p role="alert" className="text-red-700">Could not load events.</p>
        ) : (
          <EventList events={eventsQuery.data?.events ?? []} />
        )}
      </div>
    </Modal>
  );
}

export default function PlayersTab({
  deliveries,
  packages,
  players,
}: PlayersTabProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedPackages, setSelectedPackages] = useState<
    Record<string, string>
  >({});
  const [magicLinkToken, setMagicLinkToken] = useState<string | null>(null);
  const [magicLinkExpiresAt, setMagicLinkExpiresAt] = useState<string | null>(null);
  const [magicLinkFor, setMagicLinkFor] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"all" | "inactive" | "paused">("all");
  const [eventsFor, setEventsFor] = useState<Player | null>(null);
  const [confirmUnpauseAll, setConfirmUnpauseAll] = useState(false);
  const assignedPackageIds = new Set(
    deliveries
      .filter((delivery) => delivery.status !== "confirmed")
      .map((delivery) => delivery.package.id),
  );
  const availablePackages = packages.filter(
    (item) => !assignedPackageIds.has(item.id),
  );
  const assignDelivery = useMutation({
    mutationFn: ({
      ownerId,
      packageId,
    }: {
      ownerId: string;
      packageId: string;
    }) =>
      apiJson("/api/admin/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, packageId }),
      }),
    onSuccess: () => {
      setSelectedPackages({});
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.deliveries,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
      ]);
    },
  });

  const removeDelivery = useMutation({
    mutationFn: (packageId: string) =>
      apiVoid(
        `/api/admin/deliveries/${packageId}`,
        { method: "DELETE" },
        "Could not remove delivery",
      ),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.deliveries,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
      ]);
    },
  });

  const pause = useMutation({
    mutationFn: ({ playerId, paused }: { playerId: string; paused: boolean }) =>
      apiJson<{ id: string; paused: boolean }>(`/api/admin/players/${encodeURIComponent(playerId)}/pause`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<PlayerResponse>(queryKeys.admin.players, (current) => current ? {
        players: current.players.map((player) => player.id === data.id
          ? { ...player, paused: data.paused, pauseReason: data.paused ? "manual" : null }
          : player),
      } : current);
      void Promise.all([
        queryKeys.admin.players,
        queryKeys.admin.connections,
        queryKeys.admin.deliveries,
        queryKeys.game.all,
        queryKeys.session,
        queryKeys.publicGraph,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });

  const impersonate = useMutation({
    mutationFn: (player: Player) =>
      apiJson<AdminSession>(
        `/api/admin/players/${encodeURIComponent(player.id)}/impersonate`,
        { method: "POST" },
        "Could not impersonate player",
      ),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.admin.session, session);
      queryClient.removeQueries({ queryKey: queryKeys.session });
      queryClient.removeQueries({ queryKey: queryKeys.game.all });
      socket.disconnect().connect();
      router.push("/game");
    },
  });

  const generateMagicLink = useMutation({
    mutationFn: (playerId: string) => {
      setMagicLinkFor(players.find((player) => player.id === playerId)?.name ?? null);
      return apiJson<{ token: string, expiresAt: string }>(
        `/api/admin/magic-link`,
        {
          method: "POST",
          body: JSON.stringify({ playerId }),
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    ,
    onSuccess: (data) => {
      const { token: magicLink, expiresAt } = data;
      setMagicLinkToken(magicLink);
      setMagicLinkExpiresAt(expiresAt);
    },
  });

  const playerCard = (player: Player) => (
          <article
            key={player.id}
            className="overflow-hidden rounded-xl bg-gray-800 p-3 shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.profilePictureUrl}
              alt={`${player.name}'s profile`}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <p className="mt-2 text-2xl">{player.name}</p>
            <p>ID: {player.id}</p>
            {player.paused && (
              <p className="text-amber-300">
                paused {player.pauseReason === "auto" ? "(auto)" : "(manual)"}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={impersonate.isPending}
                onClick={() => impersonate.mutate(player)}
                className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {impersonate.isPending && impersonate.variables.id === player.id
                  ? "Signing in…"
                  : `Impersonate ${player.name}`}
              </button>
              <button
                type="button"
                aria-label={`${player.paused ? "Unpause" : "Pause"} ${player.name}`}
                disabled={pause.isPending}
                onClick={() => pause.mutate({ playerId: player.id, paused: !player.paused })}
                className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pause.isPending && pause.variables.playerId === player.id
                  ? (pause.variables.paused ? "Pausing…" : "Unpausing…")
                  : player.paused ? "Unpause" : "Pause"}
              </button>
              <Button
                type="button"
                theme="secondary"
                onClick={() => generateMagicLink.mutate(player.id)}
                disabled={generateMagicLink.isPending}
              >
                {generateMagicLink.isPending ? "Creating link…" : "Create magic link"}
              </Button>
            </div>
            <div
              className="mx-auto mt-3 w-fit bg-white p-2"
              aria-label={`QR code for ${player.name}`}
            >
              <QRForPlayer playerId={player.id} size={128} />
            </div>
            <div className="mt-3 border-t border-gray-700 pt-3">
              {(() => {
                const owned = deliveries.filter((item) => item.owner.id === player.id);
                const active = owned.filter((item) => item.status !== "confirmed");
                const delivered = owned.filter((item) => item.status === "confirmed");
                return (
                  <>
                    <p className="font-semibold">Active packages</p>
                    {active.length === 0 ? (
                      <p>None</p>
                    ) : (
                      <ul className="space-y-1">
                        {active.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between"
                          >
                            <span>{item.package.name}</span>
                            <button
                              type="button"
                              disabled={removeDelivery.isPending}
                              onClick={() => removeDelivery.mutate(item.package.id)}
                              className="ml-2 rounded bg-red-600 px-2 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">
                        Delivered packages ({delivered.length})
                      </summary>
                      {delivered.length === 0 ? (
                        <p>None</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {delivered.map((item) => (
                            <li key={item.id}>{item.package.name}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </>
                );
              })()}
            </div>
            <div className="mt-3">
              <select
                aria-label={`Package to assign to ${player.name}`}
                disabled={Boolean(player.paused)}
                value={selectedPackages[player.id] ?? ""}
                onChange={(event) =>
                  setSelectedPackages((current) => ({
                    ...current,
                    [player.id]: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
              >
                <option value="">Choose package</option>
                {availablePackages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={
                  assignDelivery.isPending || Boolean(player.paused) || !selectedPackages[player.id]
                }
                onClick={() =>
                  assignDelivery.mutate({
                    ownerId: player.id,
                    packageId: selectedPackages[player.id],
                  })
                }
                className="mt-2 w-full rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignDelivery.isPending &&
                  assignDelivery.variables.ownerId === player.id
                  ? "Assigning…"
                  : "Assign delivery"}
              </button>
            </div>
            <div className="mt-3 border-t border-gray-700 pt-3">
              <p className="font-semibold">Activity</p>
              <p>
                last active {formatAge(player.inactiveSeconds ?? 0)}
              </p>
              <EventList events={player.recentEvents ?? []} />
              <Button
                type="button"
                theme="secondary"
                onClick={() => setEventsFor(player)}
              >
                all events
              </Button>
            </div>
          </article>
  );

  const playerGrid = (list: Player[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {list.map(playerCard)}
    </div>
  );

  const pausedCard = (player: Player) => (
    <article
      key={player.id}
      className="overflow-hidden rounded-xl bg-gray-800 p-3 shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={player.profilePictureUrl}
        alt={`${player.name}'s profile`}
        className="aspect-square w-full rounded-lg object-cover"
      />
      <p className="mt-2 text-2xl">{player.name}</p>
      <p>ID: {player.id}</p>
      <p className="text-amber-300">
        paused {player.pauseReason === "auto" ? "(auto)" : "(manual)"}
      </p>
      <p className="mt-2">last active {formatAge(player.inactiveSeconds ?? 0)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          aria-label={`Unpause ${player.name}`}
          disabled={pause.isPending}
          onClick={() => pause.mutate({ playerId: player.id, paused: false })}
          className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pause.isPending && pause.variables.playerId === player.id
            ? "Unpausing…"
            : "Unpause"}
        </button>
        <Button
          type="button"
          theme="secondary"
          onClick={() => setEventsFor(player)}
        >
          all events
        </Button>
      </div>
    </article>
  );

  const inactivePlayers = players
    .filter((player) => !player.paused && (player.inactiveSeconds ?? 0) > INACTIVE_SECONDS)
    .sort((a, b) => (b.inactiveSeconds ?? 0) - (a.inactiveSeconds ?? 0));
  const pausedPlayers = players
    .filter((player) => player.paused)
    .sort((a, b) => (b.inactiveSeconds ?? 0) - (a.inactiveSeconds ?? 0));

  const unpauseAll = useMutation({
    mutationFn: () =>
      Promise.all(
        pausedPlayers.map((player) =>
          apiJson(`/api/admin/players/${encodeURIComponent(player.id)}/pause`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paused: false }),
          }),
        ),
      ),
    onSuccess: () => setConfirmUnpauseAll(false),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.players });
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });

  return (
    <>
      <div className="mb-4 flex justify-center gap-2">
        {(["all", "inactive", "paused"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded px-5 py-2 capitalize ${
              subTab === tab ? "bg-rose-500 text-white" : "bg-gray-700 text-gray-100"
            }`}
            onClick={() => setSubTab(tab)}
          >
            {tab === "all" ? "all players" : tab}
          </button>
        ))}
      </div>
      {subTab === "all" ? (
        <>
          {players.length === 0 && (
            <p className="text-center">No players yet.</p>
          )}
          {playerGrid(players)}
        </>
      ) : subTab === "inactive" ? (
        <>
          {inactivePlayers.length === 0 && (
            <p className="text-center">No inactive players.</p>
          )}
          {playerGrid(inactivePlayers)}
        </>
      ) : (
        <>
          {pausedPlayers.length === 0 ? (
            <p className="text-center">No paused players.</p>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <Button
                  type="button"
                  onClick={() => setConfirmUnpauseAll(true)}
                  disabled={unpauseAll.isPending}
                >
                  unpause all
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {pausedPlayers.map(pausedCard)}
              </div>
            </>
          )}
        </>
      )}
      {(assignDelivery.error || removeDelivery.error || impersonate.error || pause.error || unpauseAll.error) && (
        <p role="alert" className="mt-4 text-center text-red-300">
          {assignDelivery.error?.message ?? removeDelivery.error?.message ??
            impersonate.error?.message ?? pause.error?.message ?? unpauseAll.error?.message}
        </p>
      )}
      {confirmUnpauseAll && (
        <Modal
          title="Are you sure?"
          onClose={() => setConfirmUnpauseAll(false)}
          closeText="no"
          actions={
            <Button
              onClick={() => unpauseAll.mutate()}
              disabled={unpauseAll.isPending}
            >
              {unpauseAll.isPending ? "unpausing…" : "yes, unpause all"}
            </Button>
          }
        >
          <p className="text-center text-lg">
            Unpause all {pausedPlayers.length} players?
          </p>
        </Modal>
      )}
      {magicLinkToken && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded p-32 flex flex-col items-center bg-amber-100 text-gray-900 shadow-lg">
          <p className="mb-2">Scan this to log in as {magicLinkFor}:</p>
          <QRCode value={`${window.location.origin}/login/${magicLinkToken}`} size={128} />
          <p className="mt-2 text-sm text-gray-700">
            Expires at {new Date(magicLinkExpiresAt || "").toLocaleString()}
          </p>
          <Button onClick={() => setMagicLinkToken(null)} className="mt-2">
            Close
          </Button>
        </div>
      )}
      {eventsFor && (
        <PlayerEventsModal
          player={eventsFor}
          onClose={() => setEventsFor(null)}
        />
      )}
    </>
  );
}
