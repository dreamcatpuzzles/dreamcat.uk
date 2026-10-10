import ChallengeBody from "@/app/game/inbox-items/ChallengeBody";
import type { ChallengeMission } from "@/app/game/types";

// Standalone challenge items are the ones where this player only helps —
// the owner's challenge lives on their delivery item instead.
export default function ChallengeTask({ challenge }: { challenge: ChallengeMission }) {
  return (
    <article data-kind="challenge" className="space-y-3 rounded-2xl bg-white p-4 text-center text-2xl shadow">
      <ChallengeBody challenge={challenge} />
    </article>
  );
}
