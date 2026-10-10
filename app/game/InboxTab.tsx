import PausedPanel from "@/app/game/PausedPanel";
import ChallengeTask from "@/app/game/inbox-items/ChallengeTask";
import ConnectionTask from "@/app/game/inbox-items/ConnectionTask";
import DeliveryInductionTask from "@/app/game/inbox-items/DeliveryInductionTask";
import PackageCollectionTask from "@/app/game/inbox-items/PackageCollectionTask";
import PackageDeliveryTask from "@/app/game/inbox-items/PackageDeliveryTask";
import type {
  ChallengeMission,
  ConnectionMission,
  PackageMission,
} from "@/app/game/types";

interface InboxTabProps {
  challenges: ChallengeMission[];
  connections: ConnectionMission[];
  error: string;
  loading: boolean;
  packages: PackageMission[];
  canReceivePackage: boolean;
  deliveryInduction: boolean;
  onLearnDelivery: () => void;
  paused: boolean;
  pauseReason: "manual" | "auto" | null;
}

export default function InboxTab({
  challenges,
  connections,
  error,
  loading,
  packages,
  canReceivePackage,
  deliveryInduction,
  onLearnDelivery,
  paused,
  pauseReason,
}: InboxTabProps) {
  if (paused) {
    return (
      <main className="mx-auto w-full max-w-2xl p-6">
        <PausedPanel auto={pauseReason === "auto"} />
      </main>
    );
  }

  const tasks = [
    ...(deliveryInduction
      ? [<DeliveryInductionTask key="induction" onLearnDelivery={onLearnDelivery} />]
      : []),
    ...challenges.map((challenge) => (
      <ChallengeTask key={`challenge-${challenge.id}`} challenge={challenge} />
    )),
    ...packages.map((item) => <PackageDeliveryTask key={`package-${item.id}`} item={item} />),
    ...connections.map((connection) => (
      <ConnectionTask
        key={`connection-${connection.id}-${connection.hintLevel}`}
        connection={connection}
      />
    )),
  ];
  if (canReceivePackage && tasks.length === 0) {
    tasks.push(<PackageCollectionTask key="post-office" />);
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-center text-4xl">Current task:</h1>
      {loading && <p className="text-center">Loading…</p>}
      {error && <p className="text-center text-red-700">{error}</p>}
      {!loading && !error && (
        <>
          {tasks[0] ?? <p className="text-center text-xl">No missions yet.</p>}
          {tasks.length > 1 && (
            <section className="mt-8 space-y-4">
              <h2 className="text-center text-3xl">Other tasks:</h2>
              {tasks.slice(1)}
            </section>
          )}
        </>
      )}
    </main>
  );
}
