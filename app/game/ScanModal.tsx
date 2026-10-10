"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Html5Qrcode } from "html5-qrcode";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/app/Button";
import FlipCameraIcon from "@/app/FlipCameraIcon";
import Modal from "@/app/Modal";
import QRForPlayer from "@/app/QRForPlayer";
import { apiJson, queryKeys } from "@/app/api";

export interface ScanResponse {
  kind: "package" | "player" | "challenge";
  message: string;
  packageId?: string;
  packageName?: string;
  packageType?: "duck" | "direct";
  recipient?: string | null;
  alreadyOwn?: boolean;
  deliveryStatus?: string;
}

const readerId = "game-qr-reader";

interface ScanModalProps {
  onComplete: (response: ScanResponse) => void;
  onClose: () => void;
  playerId: string;
}

export default function ScanModal({ onComplete, onClose, playerId }: ScanModalProps) {
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startupRef = useRef<Promise<unknown> | null>(null);
  const stopTaskRef = useRef<Promise<void>>(Promise.resolve());
  const scanSessionRef = useRef(0);
  const submitCodeRef = useRef<(code: string) => void>(() => {});
  const processingRef = useRef(false);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const mountedRef = useRef(true);
  const facingRef = useRef<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scan = useMutation({
    mutationFn: (id: string) =>
      apiJson<ScanResponse>(
        "/api/scan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        },
        "Could not process this QR code",
      ),
    onSuccess: (data) => {
      if (mountedRef.current) onComplete(data);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.connections,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.deliveries,
        }),
      ]);
    },
    onSettled: () => {
      processingRef.current = false;
    },
  });
  const submitScan = scan.mutate;

  useEffect(() => {
    submitCodeRef.current = (scannedUrl) => {
      if (!mountedRef.current) return;
      // Post-office challenge cards encode a /challenges/<card> link —
      // navigate to it instead of treating it as a player/package code.
      const challengePath = (() => {
        try {
          const url = new URL(scannedUrl);
          return url.origin === window.location.origin ? url.pathname : null;
        } catch {
          return scannedUrl;
        }
      })();
      if (challengePath?.startsWith("/challenges/")) {
        window.location.assign(challengePath);
        return;
      }
      let code = scannedUrl;
      try {
        code = new URL(scannedUrl).searchParams.get("id") ?? "";
      } catch {
        console.warn("Invalid QR code scanned (trying it anyway):", scannedUrl);
      }
      submitScan(code);
    };
  }, [submitScan]);

  const stopScanner = useCallback(() => {
    const scanner = scannerRef.current;
    const startup = startupRef.current;
    const previousStop = stopTaskRef.current;
    scannerRef.current = null;
    startupRef.current = null;
    const stopTask = (async () => {
      await previousStop;
      if (!scanner) return;
      await startup?.catch(() => {});
      try {
        await scanner.stop();
      } catch {
        // It may already be stopped after detecting a code.
      }
      try {
        scanner.clear();
      } catch {
        // The reader may have been removed during navigation.
      }
    })();
    stopTaskRef.current = stopTask;
    return stopTask;
  }, []);

  const startScanner = useCallback(async () => {
    const scanSession = ++scanSessionRef.current;
    await stopScanner();
    if (
      !mountedRef.current ||
      scanSession !== scanSessionRef.current
    ) return;
    processingRef.current = false;
    lastScanRef.current = null;
    setCameraError("");

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } =
        await import("html5-qrcode");
      if (
        !mountedRef.current ||
        scanSession !== scanSessionRef.current
      ) return;
      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;
      const startup = scanner.start(
        { facingMode: facingRef.current },
        { fps: 10 },
        (decodedText) => {
          if (
            !mountedRef.current ||
            scanSession !== scanSessionRef.current ||
            processingRef.current
          ) return;
          const now = Date.now();
          if (lastScanRef.current?.code === decodedText && now - lastScanRef.current.at < 3000) return;
          lastScanRef.current = { code: decodedText, at: now };
          processingRef.current = true;
          submitCodeRef.current(decodedText);
        },
        () => {
          // Frame-level misses are expected while the camera is scanning.
        },
      );
      startupRef.current = startup;
      await startup;
    } catch (error) {
      if (
        !mountedRef.current ||
        scanSession !== scanSessionRef.current
      ) return;
      await stopScanner();
      if (!mountedRef.current || scanSession !== scanSessionRef.current) return;
      setCameraError(
        error instanceof Error
          ? error.message
          : "Could not open the camera. Check camera permissions.",
      );
    }
  }, [stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    const startupFrame = requestAnimationFrame(() => void startScanner());
    return () => {
      cancelAnimationFrame(startupFrame);
      mountedRef.current = false;
      scanSessionRef.current += 1;
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  function flipCamera() {
    facingRef.current = facingRef.current === "environment" ? "user" : "environment";
    void startScanner();
  }

  function enterManualMode() {
    scan.reset();
    setManualMode(true);
    setShowCode(false);
    void stopScanner();
  }

  function enterShowCode() {
    scan.reset();
    setShowCode(true);
    void stopScanner();
  }

  function backToCamera() {
    setShowCode(false);
    setManualMode(false);
    void startScanner();
  }

  const isValidManualCode = /^[A-Z0-9]{5}$/.test(manualCode) ||
    /^[PC][A-Z0-9]{5}$/.test(manualCode);

  function submitManualCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!isValidManualCode || processingRef.current) return;
    processingRef.current = true;
    scan.mutate(manualCode);
  }

  return (
    <Modal
      title="Scan QR code"
      onClose={manualMode ? undefined : onClose}
      aboveClose={
        !manualMode && !showCode && (
          <Button
            theme="secondary"
            onClick={flipCamera}
            disabled={scan.isPending}
            ariaLabel="flip camera"
          >
            <FlipCameraIcon className="h-5 w-5" />
          </Button>
        )
      }
      actions={
        !manualMode && !showCode && (
          <Button theme="secondary" onClick={enterShowCode}>
            show my code
          </Button>
        )
      }
      secondaryActions={
        manualMode ? undefined : showCode ? (
          <Button theme="secondary" onClick={backToCamera}>
            back
          </Button>
        ) : (
          <Button theme="secondary" onClick={enterManualMode}>
            enter code
          </Button>
        )
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {showCode ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
            <p>Show this to players if they can't scan your lanyard code:</p>
            <QRForPlayer playerId={playerId} size={220} isLink={false} />
            <p className="text-6xl tracking-widest">{playerId}</p>
          </div>
        ) : manualMode ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
            <p>
              Can&rsquo;t scan the QR code?
            </p>
            <p>
              Just type the 5- or 6-character code
              here:
            </p>
            <form onSubmit={submitManualCode}>
              <label className="block">
                <span className="sr-only">ID</span>
                <input
                  autoFocus
                  value={manualCode}
                  minLength={5}
                  maxLength={6}
                  pattern="([a-zA-Z0-9]{5}|[pPcC][a-zA-Z0-9]{5})"
                  onChange={(event) => setManualCode(event.target.value.toUpperCase())}
                  className="w-full rounded border border-rose-200 p-2 uppercase"
                />
              </label>
              <div className="flex justify-between">
                <Button theme="secondary" onClick={backToCamera}>
                  back
                </Button>
                <Button
                  type="submit"
                  disabled={scan.isPending || !isValidManualCode}
                >
                  {scan.isPending ? "processing…" : "submit"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
            <div
              id={readerId}
              className="h-full w-full [&_video]:h-full! [&_video]:w-full! [&_video]:object-contain"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="h-48 w-48 rounded-xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
            </div>
          </div>
        )}

        {(cameraError || scan.error) && (
          <p role="alert" className="shrink-0 text-center text-red-700">
            {cameraError || scan.error?.message}
          </p>
        )}
        {!manualMode && cameraError && (
          <div className="shrink-0 text-center">
            <Button onClick={() => void startScanner()} disabled={scan.isPending}>
              retry camera
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
