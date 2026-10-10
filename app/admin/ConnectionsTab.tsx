"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, apiVoid, queryKeys } from "@/app/api";
import NetworkGraph from "@/app/admin/AdminNetworkGraph";
import type { Connection, Delivery, Player } from "@/app/admin/types";

interface ConnectionsTabProps {
  players: Player[];
  connections: Connection[];
  deliveries: Delivery[];
}

export default function ConnectionsTab({
  players,
  connections,
  deliveries,
}: ConnectionsTabProps) {
  const queryClient = useQueryClient();
  const [playerOneId, setPlayerOneId] = useState("");
  const [playerTwoId, setPlayerTwoId] = useState("");
  const [showGraph, setShowGraph] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [centerOnPlayer, setCenterOnPlayer] = useState<string | undefined>();
  const invalidateConnections = () => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.connections,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
    ]);
  };

  const createConnection = useMutation({
    mutationFn: (ids?: { playerOneId: string; playerTwoId: string }) =>
      apiJson<{ id: string; status: "planned" }>(
        "/api/admin/connections",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            ids ?? { playerOneId, playerTwoId },
          ),
        },
        "Could not create connection",
      ),
    onSuccess: () => {
      setPlayerOneId("");
      setPlayerTwoId("");
      invalidateConnections();
    },
  });

  const updateConnection = useMutation({
    mutationFn: ({
      connection,
      status,
    }: {
      connection: Connection;
      status: Connection["status"];
    }) =>
      apiJson<{
        status: Connection["status"];
        confirmedAt: string | null;
      }>(
        `/api/admin/connections/${encodeURIComponent(connection.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
        "Could not update connection",
      ),
    onSuccess: invalidateConnections,
  });

  const deleteConnection = useMutation({
    mutationFn: (connection: Connection) =>
      apiVoid(
        `/api/admin/connections/${encodeURIComponent(connection.id)}`,
        { method: "DELETE" },
        "Could not delete connection",
      ),
    onSuccess: invalidateConnections,
  });

  const deleteAllConnections = useMutation({
    mutationFn: () =>
      apiVoid(
        "/api/admin/connections",
        { method: "DELETE" },
        "Could not delete connections",
      ),
    onSuccess: invalidateConnections,
  });

  function confirmDeleteConnection(connection: Connection) {
    const description = `${connection.playerOne.name} ↔ ${connection.playerTwo.name}`;
    if (!window.confirm(`Delete the connection ${description}?`)) return;
    deleteConnection.mutate(connection);
  }

  function confirmDeleteAllConnections() {
    if (
      !window.confirm(
        `Delete all ${connections.length} connections? This cannot be undone.`,
      )
    ) {
      return;
    }
    deleteAllConnections.mutate();
  }

  const filteredPlayers = searchQuery
    ? players.filter((player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSearchSelect = (playerId: string) => {
    setCenterOnPlayer(playerId);
    setSearchQuery("");
    setShowAutocomplete(false);
    // Reset centerOnPlayer after animation
    setTimeout(() => setCenterOnPlayer(undefined), 800);
  };

  const mutationError =
    createConnection.error ??
    updateConnection.error ??
    deleteConnection.error ??
    deleteAllConnections.error;
  const updatingConnectionId = updateConnection.isPending
    ? updateConnection.variables.connection.id
    : null;
  const deletingConnectionId = deleteConnection.isPending
    ? deleteConnection.variables.id
    : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowGraph(true)}
            className={`rounded px-4 py-2 ${
              showGraph
                ? "bg-rose-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
          >
            Graph View
          </button>
          <button
            type="button"
            onClick={() => setShowGraph(false)}
            className={`rounded px-4 py-2 ${
              !showGraph
                ? "bg-rose-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
          >
            List View
          </button>
        </div>
        {showGraph && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              className="rounded border border-gray-600 bg-gray-800 px-4 py-2 w-64 text-gray-100 placeholder:text-gray-400"
            />
            {showAutocomplete && filteredPlayers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSearchSelect(player.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                  >
                    {player.name} ({player.id})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showGraph ? (
        <NetworkGraph
          players={players}
          connections={connections}
          deliveries={deliveries}
          onCreateConnection={(playerOneId, playerTwoId) =>
            createConnection.mutate({ playerOneId, playerTwoId })
          }
          onUpdateConnection={(connection, status) =>
            updateConnection.mutate({ connection, status })
          }
          onDeleteConnection={(connection) =>
            deleteConnection.mutate(connection)
          }
          centerOnPlayerId={centerOnPlayer}
        />
      ) : (
        <>
          <section className="mx-auto mb-8 max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
            <h2 className="mb-4 text-2xl">Create connection</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1 block">First player</span>
                <select
                  value={playerOneId}
                  onChange={(event) => setPlayerOneId(event.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                >
                  <option value="">Choose a player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.id})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block">Second player</span>
                <select
                  value={playerTwoId}
                  onChange={(event) => setPlayerTwoId(event.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                >
                  <option value="">Choose a player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              disabled={
                createConnection.isPending ||
                !playerOneId ||
                !playerTwoId ||
                playerOneId === playerTwoId
              }
              onClick={() => createConnection.mutate()}
              className="mt-4 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createConnection.isPending
                ? "Creating…"
                : "Create planned connection"}
            </button>
            {mutationError && (
              <p className="mt-3 text-red-300">{mutationError.message}</p>
            )}
          </section>

          {connections.length === 0 && (
            <p className="text-center">No connections yet.</p>
          )}
          {connections.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                disabled={
                  deleteAllConnections.isPending ||
                  deletingConnectionId !== null ||
                  updatingConnectionId !== null
                }
                onClick={confirmDeleteAllConnections}
                className="rounded bg-red-700 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteAllConnections.isPending
                  ? "Deleting all…"
                  : "Delete all connections"}
              </button>
            </div>
          )}
          <div className="space-y-3">
            {connections.map((connection) => (
              <article
                key={connection.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-800 p-4 shadow"
              >
                <div>
                  <p className="text-xl">
                    {connection.playerOne.name} ({connection.playerOne.id}) ↔{" "}
                    {connection.playerTwo.name} ({connection.playerTwo.id})
                  </p>
                  <p className="capitalize">Status: {connection.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      deleteAllConnections.isPending ||
                      deletingConnectionId !== null ||
                      updatingConnectionId !== null
                    }
                    onClick={() =>
                      updateConnection.mutate({
                        connection,
                        status:
                          connection.status === "planned"
                            ? "confirmed"
                            : "planned",
                      })
                    }
                    className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingConnectionId === connection.id
                      ? "Updating…"
                      : connection.status === "planned"
                        ? "Confirm"
                        : "Mark planned"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      deleteAllConnections.isPending ||
                      deletingConnectionId !== null ||
                      updatingConnectionId !== null
                    }
                    onClick={() => confirmDeleteConnection(connection)}
                    className="rounded bg-red-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingConnectionId === connection.id
                      ? "Deleting…"
                      : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
