"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, apiVoid, queryKeys } from "@/app/api";
import type { Package } from "@/app/admin/types";

const readerId = "admin-package-qr-reader";

interface ScannedRow {
  id: string;
  name: string;
  type: "duck" | "direct";
  recipient: string;
}

const inputClass =
  "w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100";

export default function PackageScanTab() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ScannedRow[]>([]);
  const [cameraError, setCameraError] = useState("");
  const [notice, setNotice] = useState("");
  const [bulkType, setBulkType] = useState<"duck" | "direct">("duck");
  const [bulkRecipient, setBulkRecipient] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const busyRef = useRef(false);

  const refreshPackages = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages });
  }, [queryClient]);

  const registerCode = useCallback(
    async (scannedText: string) => {
      let code = scannedText.trim();
      try {
        code = new URL(scannedText).searchParams.get("id") ?? code;
      } catch {
        // Not a URL — treat the raw text as the package ID.
      }
      code = code.toUpperCase();
      if (!/^P[A-Z0-9]{5}$/.test(code)) {
        setNotice(`"${scannedText.slice(0, 40)}" is not a package QR code`);
        return;
      }
      if (seenIdsRef.current.has(code)) {
        setNotice(`${code} is already in this batch`);
        return;
      }
      seenIdsRef.current.add(code);
      try {
        const response = await fetch("/api/admin/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: code }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          package?: Package | null;
        } & Partial<Package>;
        if (!response.ok) {
          const existing = data.package;
          if (response.status === 409 && existing) {
            setRows((current) =>
              current.some((row) => row.id === existing.id)
                ? current
                : [
                    ...current,
                    {
                      id: existing.id,
                      name: existing.name,
                      type: existing.type,
                      recipient: existing.recipient ?? "",
                    },
                  ],
            );
            setNotice(`${existing.id} already exists — added it to the table`);
            refreshPackages();
            return;
          }
          throw new Error(data.error ?? `Could not create ${code}`);
        }
        const created = data as Package;
        setRows((current) => [
          ...current,
          {
            id: created.id,
            name: created.name,
            type: created.type,
            recipient: created.recipient ?? "",
          },
        ]);
        setNotice(`Added ${created.id}`);
        refreshPackages();
      } catch (error) {
        seenIdsRef.current.delete(code);
        setNotice(
          error instanceof Error ? error.message : `Could not create ${code}`,
        );
      } finally {
        busyRef.current = false;
      }
    },
    [refreshPackages],
  );
  const registerCodeRef = useRef(registerCode);
  useEffect(() => {
    registerCodeRef.current = registerCode;
  }, [registerCode]);

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );
        if (cancelled) return;
        scanner = new Html5Qrcode(readerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10 },
          (decodedText) => {
            if (cancelled || busyRef.current) return;
            const now = Date.now();
            if (
              lastScanRef.current?.code === decodedText &&
              now - lastScanRef.current.at < 3000
            )
              return;
            lastScanRef.current = { code: decodedText, at: now };
            busyRef.current = true;
            void registerCodeRef.current(decodedText);
          },
          () => {},
        );
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error instanceof Error
              ? error.message
              : "Could not access the camera",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      void (async () => {
        try {
          await active?.stop();
          active?.clear();
        } catch {
          // The scanner may already have stopped.
        }
      })();
    };
  }, []);

  const updateRow = (id: string, patch: Partial<ScannedRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const deletePackage = useMutation({
    mutationFn: (id: string) =>
      apiVoid(
        `/api/admin/packages/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        "Could not delete package",
      ),
    onSuccess: (_data, id) => {
      seenIdsRef.current.delete(id);
      setRows((current) => current.filter((row) => row.id !== id));
      refreshPackages();
    },
  });

  const applyBulkSet = () => {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        type: bulkType,
        recipient: bulkType === "direct" ? bulkRecipient : "",
      })),
    );
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await Promise.all(
        rows.map((row) =>
          apiJson<Package>(
            `/api/admin/packages/${encodeURIComponent(row.id)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: row.name,
                type: row.type,
                recipient: row.recipient,
              }),
            },
          ),
        ),
      );
      refreshPackages();
      setNotice("Saved!");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save packages",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="mx-auto mb-6 max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
        <h2 className="mb-4 text-2xl">Scan packages</h2>
        <div id={readerId} className="mx-auto w-full max-w-sm overflow-hidden rounded-lg" />
        {cameraError && <p className="mt-3 text-red-300">{cameraError}</p>}
        {notice && <p className="mt-3 text-gray-200">{notice}</p>}
      </section>

      {rows.length > 0 && (
        <section className="mx-auto max-w-4xl rounded-xl bg-gray-800 p-5 shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Recipient</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-600 text-gray-300">
                  <td className="p-2 align-middle">bulk set</td>
                  <td className="p-2"></td>
                  <td className="p-2">
                    <select
                      value={bulkType}
                      onChange={(event) =>
                        setBulkType(event.target.value as "duck" | "direct")
                      }
                      className={inputClass}
                    >
                      <option value="duck">normal duck</option>
                      <option value="direct">direct delivery</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {bulkType === "direct" && (
                      <input
                        value={bulkRecipient}
                        onChange={(event) =>
                          setBulkRecipient(event.target.value)
                        }
                        placeholder="Recipient name"
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={applyBulkSet}
                      className="rounded bg-gray-600 px-3 py-1 text-white"
                    >
                      apply to all
                    </button>
                  </td>
                </tr>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-700">
                    <td className="p-2 align-middle font-mono">{row.id}</td>
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(event) =>
                          updateRow(row.id, { name: event.target.value })
                        }
                        placeholder="Name"
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.type}
                        onChange={(event) =>
                          updateRow(row.id, {
                            type: event.target.value as "duck" | "direct",
                          })
                        }
                        className={inputClass}
                      >
                        <option value="duck">normal duck</option>
                        <option value="direct">direct delivery</option>
                      </select>
                    </td>
                    <td className="p-2">
                      {row.type === "direct" && (
                        <input
                          value={row.recipient}
                          onChange={(event) =>
                            updateRow(row.id, {
                              recipient: event.target.value,
                            })
                          }
                          placeholder="Recipient name"
                          className={inputClass}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        disabled={deletePackage.isPending}
                        onClick={() => deletePackage.mutate(row.id)}
                        className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50"
                      >
                        remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {saveError && <p className="mt-3 text-red-300">{saveError}</p>}
          {deletePackage.error && (
            <p className="mt-3 text-red-300">{deletePackage.error.message}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={saving}
              className="rounded bg-rose-500 px-5 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                seenIdsRef.current.clear();
                setNotice("");
                setSaveError("");
              }}
              className="rounded bg-gray-600 px-5 py-2 text-white"
            >
              new batch
            </button>
          </div>
        </section>
      )}
    </>
  );
}
