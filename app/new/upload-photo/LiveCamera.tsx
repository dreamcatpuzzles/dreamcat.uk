"use client";

import { type PointerEvent as ReactPointerEvent, type Ref, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/app/Button";
import FlipCameraIcon from "@/app/FlipCameraIcon";

type FacingMode = "environment" | "user";

const MAX_ZOOM = 4;

interface LiveCameraControls {
  capture: () => void;
  flip: () => void;
}

interface LiveCameraProps {
  onCapture: (file: File) => void;
  onError: () => void;
  facingMode?: FacingMode;
  circular?: boolean;
  square?: boolean;
  zoomable?: boolean;
  // With controls={false} the built-in button row is hidden and the caller
  // drives the camera through the ref instead (e.g. buttons in a modal footer).
  controls?: boolean;
  ref?: Ref<LiveCameraControls>;
  onReadyChange?: (ready: boolean) => void;
}

export default function LiveCamera({ onCapture, onError, facingMode = "environment", circular = false, square = false, zoomable = false, controls = true, ref, onReadyChange }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const [facing, setFacing] = useState<FacingMode>(facingMode);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomHintArcId = useId();

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);
      } catch {
        if (!cancelled) onError();
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onError, facing]);

  const flipCamera = () => {
    setZoom(1);
    setReady(false);
    setFacing(facing === "environment" ? "user" : "environment");
  };

  const updatePinch = () => {
    if (!pinchRef.current || pointersRef.current.size !== 2) return;
    const [first, second] = [...pointersRef.current.values()];
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setZoom(Math.min(MAX_ZOOM, Math.max(1, pinchRef.current.zoom * distance / pinchRef.current.distance)));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom,
      };
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointersRef.current.get(event.pointerId);
    if (!pointer) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    updatePinch();
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    if (circular || square) {
      const sourceSize = Math.min(video.videoWidth, video.videoHeight) / zoom;
      const size = Math.min(Math.round(sourceSize), 480);
      canvas.width = size;
      canvas.height = size;
      if (circular) {
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        context.clip();
      }
      context.drawImage(
        video,
        (video.videoWidth - sourceSize) / 2,
        (video.videoHeight - sourceSize) / 2,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size,
      );
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const sourceWidth = video.videoWidth / zoom;
      const sourceHeight = video.videoHeight / zoom;
      context.drawImage(
        video,
        (video.videoWidth - sourceWidth) / 2,
        (video.videoHeight - sourceHeight) / 2,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
    const type = circular ? "image/png" : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(
          new File([blob], `self-portrait-${Date.now()}.${circular ? "png" : "jpg"}`, {
            type,
          }),
        );
      },
      type,
      0.85,
    );
  };

  useImperativeHandle(ref, () => ({ capture: captureImage, flip: flipCamera }));

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  return (
    <>
      <div className={circular || square ? "relative aspect-square w-[480px] max-w-full" : "relative max-w-full"}>
        <div
          className={`touch-none overflow-hidden bg-black ${circular ? "h-full w-full rounded-full" : square ? "h-full w-full rounded-xl" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <video
            ref={videoRef}
            className={circular || square ? "h-full w-full object-cover" : "max-w-full"}
            width="480"
            autoPlay
            playsInline
            muted
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
        {circular && zoomable && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
          >
            <defs>
              <path id={zoomHintArcId} d="M -5,50 A 55,55 0 0 0 105,50" fill="none" />
            </defs>
            <text
              fontSize="7.2"
              fill="rgba(0, 0, 0, 0.55)"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="0.4"
              paintOrder="stroke"
              style={{ letterSpacing: "0.08em" }}
            >
              <textPath href={`#${zoomHintArcId}`} startOffset="25%" textAnchor="middle">
                pinch to zoom
              </textPath>
            </text>
          </svg>
        )}
        {circular && (
          <button
            type="button"
            onClick={flipCamera}
            disabled={!ready}
            aria-label="flip camera"
            className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-50"
          >
            <FlipCameraIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      {controls && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={captureImage}
            disabled={!ready}
          >
            {ready ? "take photo" : "starting camera..."}
          </Button>
          {!circular && (
            <Button
              theme="secondary"
              onClick={flipCamera}
              disabled={!ready}
            >
              flip camera
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export type { LiveCameraControls };
