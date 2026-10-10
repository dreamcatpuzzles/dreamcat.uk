"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/app/Button";
import Modal from "@/app/Modal";

interface PhotoCropModalProps {
  imageUrl: string;
  onComplete: (file: File) => void;
  onClose: () => void;
}

export async function createCircularPortrait(imageUrl: string, crop: Area): Promise<File> {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  const size = Math.min(480, Math.round(crop.width));
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop this photo.");
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not crop this photo.");
  return new File([blob], `self-portrait-${Date.now()}.png`, { type: "image/png" });
}

export default function PhotoCropModal({ imageUrl, onComplete, onClose }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function confirmCrop() {
    if (!croppedArea || saving) return;
    setSaving(true);
    setError("");
    try {
      const croppedFile = await createCircularPortrait(imageUrl, croppedArea);
      if (mountedRef.current) onComplete(croppedFile);
    } catch {
      if (mountedRef.current) setError("Could not crop this photo. Please try another image.");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }

  return (
    <Modal
      title="Crop your self-portrait"
      onClose={onClose}
      actions={
        <Button onClick={() => void confirmCrop()} disabled={!croppedArea || saving}>
          {saving ? "cropping…" : "use photo"}
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedArea(pixels)}
            cropperProps={{ role: "group", "aria-label": "Position your self-portrait" }}
            mediaProps={{
              alt: "Selected self-portrait",
              onError: () => {
                setCroppedArea(null);
                setError("Could not open this image. Please choose another photo.");
              },
            }}
          />
        </div>
        <label className="flex shrink-0 items-center gap-3">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={saving}
            className="min-w-0 flex-1 accent-rose-500"
          />
        </label>
        {error && <p role="alert" className="shrink-0 text-center text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
