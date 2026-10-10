// Static params need the card ids at build time — before any API exists —
// so this imports the backend's card catalogue module directly (it is pure
// data). The runtime card data comes from /api/challenge-cards.
import { challengeCards } from "../../../../src/challenges";
import CollectChallenge from "./CollectChallenge";

export function generateStaticParams() {
  return challengeCards.map((card) => ({ card: card.id }));
}

export const dynamicParams = false;

export default function ChallengeCardPage() {
  return <CollectChallenge />;
}
