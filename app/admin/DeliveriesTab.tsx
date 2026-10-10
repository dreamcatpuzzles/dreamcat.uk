"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { apiJson, queryKeys } from "@/app/api";
import DeliveryRoute from "@/app/DeliveryRoute";
import type { Delivery, Player } from "@/app/admin/types";
import Link from "next/link";

interface DeliveriesTabProps {
  deliveries: Delivery[];
  players: Player[];
}

export default function DeliveriesTab({ deliveries, players }: DeliveriesTabProps) {
  const queryClient = useQueryClient();
  const playerById = new Map(players.map((player) => [player.id, player]));
  const routeStops = (delivery: Delivery) => (delivery.route.length ? delivery.route : delivery.journey).map((id) => ({
    id,
    name: playerById.get(id)?.name,
    profilePictureUrl: playerById.get(id)?.profilePictureUrl ?? "",
  }));
  const confirm = useMutation({
    mutationFn: ({ packageId, show }: { packageId: string; show: boolean }) =>
      apiJson(`/api/admin/deliveries/${encodeURIComponent(packageId)}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show }),
      }),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveries }),
        queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
      ]);
    },
  });
  const challengeProofs = (delivery: Delivery) =>
    (delivery.challenge?.players ?? []).filter((player) => player.proofImageUrl);
  const hasProof = (delivery: Delivery) =>
    Boolean(delivery.proofPictureUrl) || challengeProofs(delivery).length > 0;
  const challengeResolved = (delivery: Delivery) =>
    Boolean(delivery.challenge) &&
    delivery.challenge!.players.every((player) => player.status !== "open");
  const canConfirm = (delivery: Delivery) =>
    delivery.status === "awaiting_proof" && (hasProof(delivery) || challengeResolved(delivery));

  const awaitingApproval = deliveries.filter((delivery) =>
    delivery.status === "awaiting_proof" && hasProof(delivery));
  const inProgress = deliveries.filter((delivery) =>
    delivery.status !== "confirmed" && !awaitingApproval.includes(delivery));
  const confirmed = deliveries.filter((delivery) => delivery.status === "confirmed");

  const confirmButtons = (delivery: Delivery) => (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={!canConfirm(delivery) || confirm.isPending}
        onClick={() => confirm.mutate({ packageId: delivery.package.id, show: true })}
        className="rounded bg-rose-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {confirm.isPending && confirm.variables?.packageId === delivery.package.id
          ? "Confirming…"
          : "Approve and show"}
      </button>
      <button
        type="button"
        disabled={!canConfirm(delivery) || confirm.isPending}
        onClick={() => confirm.mutate({ packageId: delivery.package.id, show: false })}
        className="rounded bg-gray-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Approve and do not show
      </button>
    </div>
  );

  const challengeInfo = (delivery: Delivery) => delivery.challenge && (
    <p>
      Challenge: {delivery.challenge.name ?? "waiting to be collected"} —{" "}
      {delivery.challenge.players.map((player) =>
        `${player.name}: ${player.status}${player.proofImageUrl ? " (proof sent)" : ""}`
      ).join(", ")}
    </p>
  );

  const proofImage = (delivery: Delivery, size: string) => delivery.proofPictureUrl && (
    <Link href={delivery.proofPictureUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
      <Image unoptimized width={256} height={256} src={delivery.proofPictureUrl} alt={`Proof of delivery for ${delivery.package.name}`} className={`${size} rounded-lg object-cover`} />
    </Link>
  );

  const proofImages = (delivery: Delivery, size: string) => (
    <>
      {proofImage(delivery, size)}
      {challengeProofs(delivery).map((player) => (
        <Link key={player.id} href={player.proofImageUrl!} target="_blank" rel="noopener noreferrer" className="inline-block">
          <Image unoptimized width={256} height={256} src={player.proofImageUrl!} alt={`Proof of delivery from ${player.name}`} className={`${size} rounded-lg object-cover`} />
        </Link>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      {deliveries.length === 0 && <p className="text-center">No deliveries yet.</p>}
      {awaitingApproval.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">Awaiting approval</h2>
          <div className="space-y-4">
            {awaitingApproval.map((delivery) => (
              <article key={delivery.id} className="rounded-xl bg-gray-800 p-5 shadow">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl">{delivery.package.name} ({delivery.package.id})</h3>
                    <p className="mt-2">Owner: {delivery.owner.name} ({delivery.owner.id})</p>
                    {delivery.package.type === "direct" ? (
                      <p>Direct delivery to {delivery.package.recipient || "the recipient"}</p>
                    ) : (
                      <>
                        <p>{Math.min(delivery.journey.length - 1, delivery.deliveryLength)}/{delivery.deliveryLength} steps</p>
                        <DeliveryRoute
                          journey={routeStops(delivery)}
                          deliveryLength={delivery.deliveryLength}
                          completedStops={delivery.journey.length}
                        />
                        <p>Visited: {delivery.journey.slice(1).map((id) => playerById.get(id)?.name ?? id).join(" → ") || "None yet"}</p>
                      </>
                    )}
                    {challengeInfo(delivery)}
                    <p>Proof submitted</p>
                  </div>
                  {hasProof(delivery) && (
                    <div className="flex shrink-0 flex-col items-start gap-3">
                      {proofImages(delivery, "h-64 w-64")}
                      {confirmButtons(delivery)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">In progress</h2>
          <div className="space-y-4">
            {inProgress.map((delivery) => (
              <article key={delivery.id} className="rounded-xl bg-gray-800 p-5 shadow">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl">{delivery.package.name} ({delivery.package.id})</h3>
                    <p className="mt-2">Owner: {delivery.owner.name} ({delivery.owner.id})</p>
                    {delivery.package.type === "direct" ? (
                      <p>Direct delivery to {delivery.package.recipient || "the recipient"}</p>
                    ) : (
                      <>
                        <p>{Math.min(delivery.journey.length - 1, delivery.deliveryLength)}/{delivery.deliveryLength} steps</p>
                        <DeliveryRoute
                          journey={routeStops(delivery)}
                          deliveryLength={delivery.deliveryLength}
                          completedStops={delivery.journey.length}
                        />
                        <p>Visited: {delivery.journey.slice(1).map((id) => playerById.get(id)?.name ?? id).join(" → ") || "None yet"}</p>
                      </>
                    )}
                    {challengeInfo(delivery)}
                    {delivery.status === "in_progress" && delivery.package.type !== "direct" ? (
                      <p>Next target: {delivery.nextTarget.name} ({delivery.nextTarget.id})</p>
                    ) : (
                      <p>Awaiting proof of delivery</p>
                    )}
                    {!hasProof(delivery) && (
                      <div className="mt-3">{confirmButtons(delivery)}</div>
                    )}
                  </div>
                  {hasProof(delivery) && (
                    <div className="flex shrink-0 flex-col items-start gap-3">
                      {proofImages(delivery, "h-64 w-64")}
                      {confirmButtons(delivery)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {confirm.error && <p className="text-red-300">{confirm.error.message}</p>}
      {confirmed.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">Completed</h2>
          <ul className="space-y-2">
            {confirmed.map((delivery) => (
              <li key={delivery.id} className="rounded-xl bg-gray-800 p-4 shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <p>{delivery.package.name} ({delivery.package.id}) — {delivery.owner.name}: confirmed</p>
                    {delivery.proofShown && <p className="text-sm">Proof shown on graph</p>}
                    <DeliveryRoute
                      journey={routeStops(delivery)}
                      deliveryLength={delivery.deliveryLength}
                      completedStops={delivery.journey.length}
                    />
                    {challengeInfo(delivery)}
                  </div>
                  {proofImages(delivery, "h-56 w-56")}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
