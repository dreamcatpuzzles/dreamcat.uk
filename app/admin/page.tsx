"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import AdminLoginForm, {
  type AdminSession,
} from "@/app/admin/AdminLoginForm";
import ChallengesTab from "@/app/admin/ChallengesTab";
import ConnectionsTab from "@/app/admin/ConnectionsTab";
import DeliveriesTab from "@/app/admin/DeliveriesTab";
import FeedbackTab from "@/app/admin/FeedbackTab";
import GlobalSettingsTab from "@/app/admin/GlobalSettingsTab";
import PackagesTab from "@/app/admin/PackagesTab";
import PlayersTab from "@/app/admin/PlayersTab";
import PrintTab from "@/app/admin/PrintTab";
import PuzzlesTab from "@/app/admin/PuzzlesTab";
import SessionTab from "@/app/admin/SessionTab";
import StatsTab from "@/app/admin/StatsTab";
import type {
  ChallengeResponse,
  ConnectionResponse,
  DeliveryResponse,
  PackageResponse,
  PlayerResponse,
  UploadResponse,
} from "@/app/admin/types";
import UploadsTab from "@/app/admin/UploadsTab";
import { socket } from "@/app/socket";

const ADMIN_TABS = [
  "players",
  "packages",
  "deliveries",
  "uploads",
  "connections",
  "challenges",
  "print",
  "puzzles",
  "stats",
  "feedback",
  "seed data",
  "global settings",
  "session",
] as const;

type AdminTab = (typeof ADMIN_TABS)[number];

function isAdminTab(value: string | null): value is AdminTab {
  return ADMIN_TABS.includes(value as AdminTab);
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab: AdminTab = isAdminTab(tabParam) ? tabParam : "players";
  const setActiveTab = (tab: AdminTab) =>
    router.replace(`/admin/?tab=${encodeURIComponent(tab)}`);
  const [seedStatus, setSeedStatus] = useState("");
  const [connectionTarget, setConnectionTarget] = useState("5");
  const queryClient = useQueryClient();

  const refreshData = () =>
    void Promise.all(
      [
        queryKeys.admin.players,
        queryKeys.admin.packages,
        queryKeys.admin.connections,
        queryKeys.admin.deliveries,
        queryKeys.game.all,
        queryKeys.publicGraph,
        queryKeys.session,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const resetData = useMutation({
    mutationFn: (confirmation: string) =>
      apiJson<{ message: string }>("/api/admin/seed-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      }),
    onSuccess: (data) => {
      setSeedStatus(data.message);
      refreshData();
    },
  });
  const seedPlayers = useMutation({
    mutationFn: () =>
      apiJson<{ players: number }>("/api/admin/seed-data/players", {
        method: "POST",
      }),
    onSuccess: (data) => {
      setSeedStatus(`Created ${data.players} players.`);
      refreshData();
    },
  });
  const seedPackages = useMutation({
    mutationFn: () =>
      apiJson<{ packages: number }>("/api/admin/seed-data/packages", {
        method: "POST",
      }),
    onSuccess: (data) => {
      setSeedStatus(`Created ${data.packages} packages.`);
      refreshData();
    },
  });

  const seedConnections = useMutation({
    mutationFn: (target: number) =>
      apiJson<{ created: number; unfilledPlayers: number }>(
        "/api/admin/seed-data/connections",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target }),
        },
      ),
    onSuccess: (data) => {
      setSeedStatus(
        `Created ${data.created} confirmed connections.` +
          (data.unfilledPlayers > 0
            ? ` ${data.unfilledPlayers} players remain below the target.`
            : " All players meet the target."),
      );
      refreshData();
    },
  });
  const prepareLoadTest = useMutation({
    mutationFn: () =>
      apiJson<{ ready: boolean; checks: { label: string; ok: boolean; detail: string }[] }>(
        "/api/admin/seed-data/prepare-load-test",
        { method: "POST" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
      refreshData();
    },
  });
  const seedPending = resetData.isPending || seedPlayers.isPending ||
    seedPackages.isPending || seedConnections.isPending ||
    prepareLoadTest.isPending;

  function clearSeedFeedback() {
    setSeedStatus("");
    resetData.reset();
    seedPlayers.reset();
    seedPackages.reset();
    seedConnections.reset();
    prepareLoadTest.reset();
  }

  function confirmReset() {
    if (!window.confirm(
      "Delete all deliveries, connections, packages, and players from the database? This cannot be undone.",
    )) return;
    const confirmation = window.prompt(
      'Type "kablooie" to delete the database data:',
    );
    if (confirmation !== null) {
      clearSeedFeedback();
      resetData.mutate(confirmation);
    }
  }
  const adminSession = useQuery({
    queryKey: queryKeys.admin.session,
    queryFn: ({ signal }) =>
      apiJson<AdminSession>("/api/admin/session", { signal }),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const isAdmin = adminSession.data?.role === "admin";
  const [
    playersQuery,
    uploadsQuery,
    connectionsQuery,
    packagesQuery,
    deliveriesQuery,
    challengesQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.admin.players,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<PlayerResponse>("/api/admin/players", { signal }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.admin.uploads,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<UploadResponse>("/api/admin/profiles/all", { signal }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.admin.connections,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<ConnectionResponse>("/api/admin/connections", { signal }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.admin.packages,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<PackageResponse>("/api/admin/packages", { signal }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.admin.deliveries,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<DeliveryResponse>("/api/admin/deliveries", { signal }),
        enabled: isAdmin,
      },
      {
        queryKey: queryKeys.admin.challenges,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          apiJson<ChallengeResponse>("/api/admin/challenges", { signal }),
        enabled: isAdmin,
      },
    ],
  });

  // Reconnect the socket when admin status flips so the server-side
  // session cookie re-evaluates membership of the "admin" room.
  const wasAdmin = useRef<boolean | null>(null);
  useEffect(() => {
    if (wasAdmin.current === isAdmin) return;
    wasAdmin.current = isAdmin;
    socket.disconnect().connect();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const refresh = () => {
      for (const key of [queryKeys.admin.players, queryKeys.admin.connections, queryKeys.admin.deliveries, queryKeys.admin.stats, queryKeys.admin.challenges]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    };
    socket.on("network:updated", refresh);
    socket.on("connect", refresh);
    return () => {
      socket.off("network:updated", refresh);
      socket.off("connect", refresh);
    };
  }, [isAdmin, queryClient]);

  const uploads = useMemo(
    () =>
      (uploadsQuery.data?.filesWithPresignedUrls ?? [])
        .filter((upload) => upload.presignedUrl)
        .sort(
          (a, b) =>
            new Date(b.LastModified ?? 0).getTime() -
            new Date(a.LastModified ?? 0).getTime(),
        ),
    [uploadsQuery.data],
  );
  const adminQueries = [
    playersQuery,
    uploadsQuery,
    connectionsQuery,
    packagesQuery,
    deliveriesQuery,
  ];
  const loading = adminQueries.some((query) => query.isPending);
  const error = adminQueries.some((query) => query.isError);
  const players = playersQuery.data?.players ?? [];
  const connections = connectionsQuery.data?.connections ?? [];
  const packages = packagesQuery.data?.packages ?? [];
  const deliveries = deliveriesQuery.data?.deliveries ?? [];
  const takenIds = new Set(
    [...players, ...packages].map((entry) => entry.id.toUpperCase()),
  );
  const target = Number(connectionTarget);
  const validTarget = connectionTarget.trim() !== "" &&
    Number.isSafeInteger(target) && target >= 0 && target < players.length;

  if (adminSession.isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <h1 className="mb-6 text-center text-4xl">Admin page</h1>
        <p className="text-center">Checking access…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <h1 className="mb-6 text-center text-4xl">Admin page</h1>
        <AdminLoginForm />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <h1 className="mb-6 text-center text-4xl">Admin page</h1>

      <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`rounded px-5 py-2 capitalize ${
              activeTab === tab
                ? "bg-rose-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== "session" && activeTab !== "seed data" &&
        activeTab !== "stats" && activeTab !== "puzzles" && activeTab !== "challenges" &&
        activeTab !== "global settings" && activeTab !== "feedback" && loading && (
        <p className="text-center">Loading…</p>
      )}
      {activeTab !== "session" && activeTab !== "seed data" &&
        activeTab !== "stats" && activeTab !== "puzzles" && activeTab !== "challenges" &&
        activeTab !== "global settings" && activeTab !== "feedback" && error && (
        <p className="text-center text-red-300">
          Could not load admin data.
        </p>
      )}

      {!loading && !error && activeTab === "players" && (
        <PlayersTab
          players={players}
          packages={packages}
          deliveries={deliveries}
        />
      )}
      {!loading && !error && activeTab === "packages" && (
        <PackagesTab packages={packages} />
      )}
      {!loading && !error && activeTab === "deliveries" && (
        <DeliveriesTab deliveries={deliveries} players={players} />
      )}
      {!loading && !error && activeTab === "uploads" && (
        <UploadsTab uploads={uploads} />
      )}
      {!loading && !error && activeTab === "connections" && (
        <ConnectionsTab
          players={players}
          connections={connections}
          deliveries={deliveries}
        />
      )}
      {!loading && !error && activeTab === "challenges" && (
        <ChallengesTab challenges={challengesQuery.data?.challenges ?? []} />
      )}
      {!loading && !error && activeTab === "print" && (
        <PrintTab takenIds={takenIds} packages={packages} />
      )}
      {activeTab === "puzzles" && <PuzzlesTab />}
      {activeTab === "stats" && <StatsTab />}
      {activeTab === "feedback" && <FeedbackTab />}
      {activeTab === "global settings" && <GlobalSettingsTab />}
      {activeTab === "seed data" && (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-gray-800 p-5 shadow">
          <h2 className="text-2xl">Seed data</h2>
          <div>
            <p>
              Create the printed duck packages (PD0000–PD3351), named from
              duck-names.yaml. Existing packages are renamed.
            </p>
            <button
              type="button"
              disabled={seedPending}
              onClick={() => {
                clearSeedFeedback();
                seedPackages.mutate();
              }}
              className="mt-3 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {seedPackages.isPending ? "Creating…" : "create seed packages"}
            </button>
          </div>
          <div className="border-t border-gray-700 pt-5">
            <p>
              Import player images from seed-data/players as dummy players.
              Existing players are kept.
            </p>
            <button
              type="button"
              disabled={seedPending}
              onClick={() => {
                clearSeedFeedback();
                seedPlayers.mutate();
              }}
              className="mt-3 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {seedPlayers.isPending ? "Creating…" : "create dummy players"}
            </button>
          </div>
          <div className="border-t border-gray-700 pt-5">
            <label className="block" htmlFor="connection-target">
              Target connections per player
            </label>
            <input
              id="connection-target"
              type="number"
              min={0}
              max={players.length > 0 ? players.length - 1 : undefined}
              step={1}
              value={connectionTarget}
              onChange={(event) => setConnectionTarget(event.target.value)}
              className="mt-2 w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
            />
            <p className="mt-2">
              Add random confirmed connections without exceeding the target.
              Existing connections count toward the target.
            </p>
            <button
              type="button"
              disabled={seedPending || !validTarget}
              onClick={() => {
                clearSeedFeedback();
                seedConnections.mutate(target);
              }}
              className="mt-3 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {seedConnections.isPending
                ? "Connecting…"
                : "Add random connections"}
            </button>
          </div>
          <div className="border-t border-gray-700 pt-5">
            <p>
              Enable sign-ups and cheat codes, disable auto-pause, seed all
              package barcodes, and check the environment.
            </p>
            <button
              type="button"
              disabled={seedPending}
              onClick={() => {
                clearSeedFeedback();
                prepareLoadTest.mutate();
              }}
              className="mt-3 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prepareLoadTest.isPending ? "Preparing…" : "prepare for load testing"}
            </button>
            {prepareLoadTest.isError && (
              <p className="mt-2 text-red-300">{prepareLoadTest.error.message}</p>
            )}
            {prepareLoadTest.data && (
              <ul className="mt-3 space-y-1">
                {prepareLoadTest.data.checks.map((check) => (
                  <li key={check.label} className={check.ok ? "text-green-300" : "text-red-300"}>
                    {check.ok ? "✓" : "✗"} {check.label} — {check.detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-gray-700 pt-5">
            <p>
              Delete all deliveries, connections, packages, and players.
              Uploaded images are not deleted.
            </p>
            <button
              type="button"
              disabled={seedPending}
              onClick={confirmReset}
              className="mt-3 rounded bg-red-700 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetData.isPending ? "Deleting…" : "Delete database data"}
            </button>
          </div>
          {seedStatus && (
            <p role="status" className="text-green-400">{seedStatus}</p>
          )}
          {(seedPlayers.error || seedPackages.error || resetData.error || seedConnections.error) && (
            <p role="alert" className="text-red-300">
              {seedPlayers.error?.message ??
                seedPackages.error?.message ??
                resetData.error?.message ??
                seedConnections.error?.message}
            </p>
          )}
        </section>
      )}
      {activeTab === "session" && (
        <SessionTab playerId={adminSession.data?.playerId ?? null} />
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageContent />
    </Suspense>
  );
}
