"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button, LabelButton } from "@/app/Button";
import FlipCameraIcon from "@/app/FlipCameraIcon";
import Modal from "@/app/Modal";
import LiveCamera, { type LiveCameraControls } from "@/app/new/upload-photo/LiveCamera";

interface PreparedUpload {
  url: string;
  fields: Record<string, string>;
}

export default function ProofCapture({ base, submitted, proofImageUrl, modal, onClose }: {
  base: string;
  submitted: boolean;
  proofImageUrl: string | null;
  // Renders inside its own Modal (challenge proofs) — pass onClose to wire
  // its close button. Without it the component renders inline and ignores
  // onClose.
  modal?: boolean;
  onClose?: () => void;
}) {
  const queryClient = useQueryClient();
  const [cameraOn, setCameraOn] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<LiveCameraControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const choosePhoto = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCameraOn(false);
    setError("");
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const [cameraError, setCameraError] = useState("");

  const filePicker = (
    <LabelButton theme="secondary">
      select a file
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) choosePhoto(file);
          event.target.value = "";
        }}
      />
    </LabelButton>
  );

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2_000_000) throw new Error("The photo must be smaller than 2 MB.");
      const prepared = await apiJson<PreparedUpload>(
        `${base}/proof-upload`,
        { method: "POST" },
      );
      const imageKey = prepared.fields.key;
      if (!imageKey) throw new Error("Upload key missing");
      const formData = new FormData();
      Object.entries(prepared.fields).forEach(([key, value]) => formData.append(key, value));
      formData.append("Content-Type", "image/jpeg");
      formData.append("file", file);
      const result = await fetch(prepared.url, { method: "POST", body: formData });
      if (!result.ok) throw new Error("Proof photo upload failed");
      await apiJson(
        `${base}/proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageKey }),
        },
      );
    },
    onSuccess: () => {
      setPhoto(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.inbox });
    },
  });

  const submittedView = (
    <>
      <p>
        Return to the Post Office with your package and show your proof of
        delivery for a reward
      </p>
      {proofImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proofImageUrl}
          alt="Proof of delivery"
          className="mx-auto block max-h-64 rounded-lg"
        />
      )}
    </>
  );

  // The modal presentation puts the camera controls in the footer columns:
  // flip/close | take photo | select a file.
  if (modal) {
    if (submitted) {
      return (
        <Modal title="Proof submitted!" onClose={onClose ?? (() => {})}>
          <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
            {submittedView}
          </div>
        </Modal>
      );
    }
    const preview = previewUrl && photo;
    const cameraShowing = !preview && !cameraError;
    const content = (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3">
        <p className="text-lg">Make sure your subjects are okay with being photographed!</p>
        <p className="text-lg">It doesn't have to have anyone's face in.</p>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Proof selfie preview"
            className="aspect-square max-h-full w-full max-w-64 rounded-lg object-cover"
          />
        ) : cameraError ? (
          <p role="alert" className="text-red-700">{cameraError}</p>
        ) : (
          <LiveCamera
            square
            controls={false}
            ref={cameraRef}
            onReadyChange={setCameraReady}
            facingMode="user"
            onCapture={choosePhoto}
            onError={() => setCameraError("Could not access your camera. You can select a file instead.")}
          />
        )}
        {(error || upload.error) && <p role="alert" className="text-red-700">{error || upload.error?.message}</p>}
      </div>
    );
    return (
      <Modal
        onClose={onClose ?? (() => {})}
        aboveClose={
          cameraShowing && (
            <Button
              theme="secondary"
              onClick={() => cameraRef.current?.flip()}
              disabled={!cameraReady}
              ariaLabel="flip camera"
            >
              <FlipCameraIcon className="h-5 w-5" />
            </Button>
          )
        }
        actions={
          preview ? (
            <Button
              onClick={() => upload.mutate(photo)}
              disabled={upload.isPending}
            >
              {upload.isPending ? "uploading…" : "Submit proof of delivery"}
            </Button>
          ) : cameraShowing ? (
            <Button
              onClick={() => cameraRef.current?.capture()}
              disabled={!cameraReady}
            >
              {cameraReady ? "take photo" : "starting camera..."}
            </Button>
          ) : undefined
        }
        secondaryActions={
          preview ? (
            <Button
              theme="secondary"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPhoto(null);
                setPreviewUrl(null);
                setCameraError("");
                setCameraReady(false);
              }}
              disabled={upload.isPending}
            >
              retake photo
            </Button>
          ) : (
            filePicker
          )
        }
      >
        {content}
      </Modal>
    );
  }

  if (submitted) return submittedView;

  return (
    <div className="mt-3 space-y-3">
      <p>Take a photo as proof of delivery - doesn't have to have your face in. Then return to the post office.</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) choosePhoto(file);
          event.target.value = "";
        }}
      />
      {cameraOn ? (
        <LiveCamera
          facingMode="user"
          onCapture={choosePhoto}
          onError={() => {
            setCameraOn(false);
            setError("Could not access your camera. Check camera permissions.");
          }}
        />
      ) : (
        <div className="flex justify-center gap-3">
          <Button onClick={() => setCameraOn(true)}>
            {photo ? "Retake photo" : "Take proof photo"}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            choose a photo
          </Button>
        </div>
      )}
      {previewUrl && photo && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Proof photo preview"
            className="max-h-64 max-w-full rounded-lg"
          />
          <Button
            onClick={() => upload.mutate(photo)}
            disabled={upload.isPending}
          >
            {upload.isPending ? "Uploading…" : "Submit proof of delivery"}
          </Button>
        </div>
      )}
      {(error || upload.error) && <p role="alert" className="text-red-700">{error || upload.error?.message}</p>}
    </div>
  );
}
