import { useState } from "react";
import DeliveryRoute from "@/app/DeliveryRoute";
import { Button } from "@/app/Button";
import DebugCheatButton from "@/app/game/DebugCheatButton";
import IntroducerNote from "@/app/game/IntroducerNote";
import ProofCapture from "@/app/game/ProofCapture";
import ChallengeBody from "@/app/game/inbox-items/ChallengeBody";
import type { PackageMission } from "@/app/game/types";

export default function PackageDeliveryTask({ item }: { item: PackageMission }) {
  const [proofOpen, setProofOpen] = useState(false);
  const packageName = item.name || "A duck";
  const completedSteps = Math.max(
    0,
    Math.min(item.journey.length - 1, item.deliveryLength),
  );
  const challenge = item.challenge;
  const partner = challenge?.otherPlayer.name ?? "your partner";
  return (
    <article
      data-kind={
        item.status === "in_progress" && item.type !== "direct"
          ? "deliver"
          : challenge !== null
            ? "challenge"
            : item.proofSubmitted
              ? "awaitingConfirmation"
              : "proof"
      }
      className="space-y-3 rounded-2xl bg-white p-4 text-center text-2xl shadow"
    >
      {item.type === "direct" ? (
        <>
          <p>
            Take {packageName} to {item.recipient || "the recipient"}!
          </p>
          <ProofCapture
            base={`/api/deliveries/${encodeURIComponent(item.id)}`}
            submitted={item.proofSubmitted}
            proofImageUrl={item.proofImageUrl}
          />
        </>
      ) : item.status === "in_progress" ? (
        <>
          <p>Take {packageName} to:</p>
          {item.nextTargetProfilePictureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.nextTargetProfilePictureUrl}
              alt="Next package target"
              className="block aspect-square w-full rounded-full object-cover"
            />
          )}
          {item.nextTargetName && (
            <p className="tracking-widest">{item.nextTargetName}</p>
          )}
          <p>and scan their QR code.</p>
          {item.journey.length > 1 && (
            <IntroducerNote
              player={item.journey[item.journey.length - 1]}
            />
          )}
          <DebugCheatButton kind="package" id={item.id} />
        </>
      ) : challenge === null ? (
        // The challenge side was given up — a delivery-level photo still
        // lets the post office approve it.
        item.proofSubmitted ? (
          <p className="text-lg">
            Go back to the Post Office with your package and show your proof
            of delivery for a reward!
          </p>
        ) : (
          <>
            <p className="text-lg">
              Take a proof of delivery photo to finish delivering {packageName}!
            </p>
            <Button onClick={() => setProofOpen(true)}>
              take proof of delivery photo
            </Button>
          </>
        )
      ) : challenge.name === null ? (
        <>
          <p>Challenge time!</p>
          <p className="text-lg">
            Go to the post office challenge zone and collect a challenge to
            do with {partner}!
          </p>
          <p className="text-lg">
            Scan the QR code on the challenge to accept it.
          </p>
          <p className="text-sm">(If you don't like the first one you get you can pick another...)</p>
        </>
      ) : (
        <ChallengeBody challenge={challenge} />
      )}
      {item.status === "in_progress" && item.type !== "direct" && (
        <>
          <hr />
          <DeliveryRoute
            journey={item.journey}
            deliveryLength={item.deliveryLength}
            nextTargetProfilePictureUrl={item.nextTargetProfilePictureUrl}
          />
          <p>
            {completedSteps} of {item.deliveryLength} steps complete
          </p>
        </>
      )}
      {proofOpen && (
        <ProofCapture
          base={`/api/deliveries/${encodeURIComponent(item.id)}`}
          submitted={item.proofSubmitted}
          proofImageUrl={item.proofImageUrl}
          modal
          onClose={() => setProofOpen(false)}
        />
      )}
    </article>
  );
}
