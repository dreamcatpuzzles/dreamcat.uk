import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";
import CaptchaChallengeModal from "@/app/game/CaptchaChallengeModal";
import ProofCapture from "@/app/game/ProofCapture";
import type { ChallengeMission } from "@/app/game/types";

// The state-dependent body of a challenge — shared by the owner's delivery
// item and the standalone "[partner]'s challenge" item for the helper.
export default function ChallengeBody({ challenge }: { challenge: ChallengeMission }) {
  const queryClient = useQueryClient();
  const [proofOpen, setProofOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [surrendering, setSurrendering] = useState(false);
  const other = challenge.otherPlayer.name ?? "your partner";
  const isCaptcha = challenge.type === "captcha";
  const typeLabel =
    challenge.type === "captcha" ? "Captcha"
    : challenge.type === "toastcard" ? "Toastcard"
    : "Creative";
  const proofText = challenge.proofText?.replace("{name}", other) ?? null;

  const surrender = useMutation({
    mutationFn: () =>
      apiJson(`/api/challenges/${encodeURIComponent(challenge.id)}/abandon`, {
        method: "POST",
      }),
    onSuccess: () => {
      setSurrendering(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });
  const dismiss = useMutation({
    mutationFn: () =>
      apiJson(`/api/challenges/${encodeURIComponent(challenge.id)}/dismiss`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });

  function challengeTitle() {
    if (challenge.name === null) {
      return challenge.isDeliverer
        ? <b>Challenge with {other}!</b>
        : <b>{other}&rsquo;s challenge</b>;
    }
    return challenge.isDeliverer
      ? <b>{typeLabel} challenge with {other}</b>
      : <b>{other}&rsquo;s {typeLabel} challenge</b>;
  }

  function challengeContent() {
    if (challenge.name === null) {
      return (
        <p className="text-lg">
          Go to the post office challenge zone and collect a challenge to do
          together!
        </p>
      );
    }
    if (challenge.proofSubmitted) {
      return (
        <p className="text-lg">
          {challenge.isDeliverer
            ? "Go back to the Post Office with your package and show your proof of delivery for a reward!"
            : `Proof submitted — ${other} will show it at the post office for the reward!`}
        </p>
      );
    }
    if (isCaptcha && !challenge.solved) {
      return (
        <>
          <p>Prove you&rsquo;re not a bot!</p>
          <p className="text-lg">
            Go to {challenge.location} and complete the captcha with {other}
          </p>
        </>
      );
    }
    return (
      <>
        {!isCaptcha && <p className="text-lg">{challenge.name}</p>}
        {proofText && <p className="text-lg">{proofText}</p>}
      </>
    );
  }

  function challengeImage() {
    if (!challenge.proofSubmitted || !challenge.proofImageUrl) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={challenge.proofImageUrl}
        alt="Proof of delivery"
        className="mx-auto aspect-square w-full max-w-64 rounded-lg object-cover"
      />
    );
  }

  function challengeButtons() {
    if (challenge.name === null) return null;
    if (isCaptcha && !challenge.solved) {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => setChallengeOpen(true)}>
            open challenge
          </Button>
          <Button theme="secondary" onClick={() => setSurrendering(true)}>
            surrender challenge
          </Button>
        </div>
      );
    }

    // Challenge owner
    if (challenge.isDeliverer && challenge.proofSubmitted) return null;
    if (challenge.isDeliverer && !challenge.proofSubmitted) {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => setProofOpen(true)}>
            take proof of delivery photo
          </Button>
          <Button theme="secondary" onClick={() => setSurrendering(true)}>
            surrender challenge
          </Button>
        </div>
      );
    }

    // Challenge helper
    // Helpers can dismiss the challenge to get it out of their inbox
    // once they've helped the owner
    if (!challenge.isDeliverer && challenge.proofSubmitted) {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            theme="secondary"
            onClick={() => dismiss.mutate()}
            disabled={dismiss.isPending}
          >
            {dismiss.isPending ? "dismissing…" : "dismiss"}
          </Button>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {challengeTitle()}
      {challengeContent()}
      {challengeImage()}
      {challengeButtons()}
      {challengeOpen && (
        <CaptchaChallengeModal
          challengeId={challenge.id}
          onClose={() => setChallengeOpen(false)}
        />
      )}
      {proofOpen && (
        <ProofCapture
          base={`/api/challenges/${encodeURIComponent(challenge.id)}`}
          submitted={challenge.proofSubmitted}
          proofImageUrl={challenge.proofImageUrl}
          modal
          onClose={() => setProofOpen(false)}
        />
      )}
      {surrendering && (
        <Modal
          title="Surrender challenge?"
          onClose={() => setSurrendering(false)}
          closeText="actually no"
          secondaryActions={
            <Button
              onClick={() => surrender.mutate()}
              disabled={surrender.isPending}
            >
              {surrender.isPending ? "surrendering…" : "surrender"}
            </Button>
          }
        >
          <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-2xl">Are you sure?</p>
            <p>{other} can do this challenge by themselves.</p>
            {surrender.error && (
              <p role="alert" className="text-lg text-red-700">
                {surrender.error.message}
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
