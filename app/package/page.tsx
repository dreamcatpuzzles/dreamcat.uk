"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { apiJson, queryKeys } from "@/app/api";
import type { ScanResponse } from "@/app/game/ScanModal";

function PackageContent() {
  const packageId = useSearchParams().get("id");
  const router = useRouter();
  const queryClient = useQueryClient();
  const scan = useMutation({
    mutationFn: (id: string) =>
      apiJson<ScanResponse>(
        "/api/scan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        },
        "Could not scan this package",
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    },
  });
  const { mutate } = scan;

  // StrictMode remounts effects in dev, which would scan the same code twice.
  const scannedRef = useRef<string | null>(null);
  useEffect(() => {
    if (packageId && scannedRef.current !== packageId) {
      scannedRef.current = packageId;
      mutate(packageId);
    }
  }, [mutate, packageId]);

  useEffect(() => {
    if (scan.failureReason?.message === "Not signed in") {
      router.replace("/");
    }
  }, [scan.failureReason, router]);

  const data = scan.data;
  const packageName = data?.packageName || "a duck";
  let message = "Scanning package…";
  if (data?.alreadyOwn) {
    message =
      data.deliveryStatus === "confirmed"
        ? `You already delivered ${packageName}!`
        : `You're already delivering ${packageName}!`;
  } else if (data) {
    message =
      data.packageType === "direct"
        ? "This is a special delivery!"
        : `You've picked up ${packageName}!`;
  } else if (scan.isError) {
    message = scan.error.message;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center p-6 text-center">
      <h1 className="text-2xl">{packageId ? message : "Package not found."}</h1>
      {data?.packageType === "direct" && (
        <p className="mt-4 text-xl">
          Take this package to {data.recipient ?? "the recipient"}, take a
          proof of delivery, and then return to the post office.
        </p>
      )}

      <Link
        href="/game"
        className="mt-8 rounded-xl bg-rose-500 px-6 py-3 text-xl text-white"
      >
        Back to inbox
      </Link>
    </main>
  );
}

export default function PackagePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackageContent />
    </Suspense>
  );
}
