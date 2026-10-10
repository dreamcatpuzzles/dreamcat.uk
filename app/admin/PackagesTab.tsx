"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import QRCode from "react-qr-code";
import { apiJson, apiVoid, queryKeys } from "@/app/api";
import PackageExportTab from "@/app/admin/PackageExportTab";
import PackageScanTab from "@/app/admin/PackageScanTab";
import type { Package } from "@/app/admin/types";

interface PackagesTabProps {
  packages: Package[];
}

const PACKAGE_SUBTABS = ["list", "scan", "export / import"] as const;
type PackageSubtab = (typeof PACKAGE_SUBTABS)[number];

type PackageType = "duck" | "direct";

const inputClass =
  "w-full rounded border border-gray-600 bg-gray-700 p-2 text-gray-100";

function packageQrUrl(id: string) {
  // The admin page is only interactive client-side, so window exists here.
  return `${window.location.origin}/package/?id=${encodeURIComponent(id)}`;
}

interface RowDraft {
  id: string;
  name: string;
  type: PackageType;
  recipient: string;
}

function toRow(pkg: Package): RowDraft {
  return {
    id: pkg.id,
    name: pkg.name,
    type: pkg.type,
    recipient: pkg.recipient ?? "",
  };
}

function PackageList({ packages }: PackagesTabProps) {
  const queryClient = useQueryClient();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<PackageType>("duck");
  const [recipient, setRecipient] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<RowDraft>>>({});
  const [showQrs, setShowQrs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const refreshPackages = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.packages }),
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveries }),
      queryClient.invalidateQueries({ queryKey: queryKeys.game.all }),
    ]);
  };

  const createPackage = useMutation({
    mutationFn: () =>
      apiJson<Package>("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name,
          type,
          recipient: type === "direct" ? recipient : null,
        }),
      }),
    onSuccess: () => {
      setId("");
      setName("");
      setType("duck");
      setRecipient("");
      refreshPackages();
    },
  });

  const deletePackage = useMutation({
    mutationFn: (packageId: string) =>
      apiVoid(
        `/api/admin/packages/${encodeURIComponent(packageId)}`,
        { method: "DELETE" },
        "Could not delete package",
      ),
    onSuccess: (_data, packageId) => {
      setEdits((current) => {
        const next = { ...current };
        delete next[packageId];
        return next;
      });
      refreshPackages();
    },
  });

  const rows = packages.map((pkg) => ({
    originalId: pkg.id,
    ...toRow(pkg),
    ...edits[pkg.id],
  }));

  const dirtyRows = rows.filter((row) => {
    const pkg = packages.find((item) => item.id === row.originalId);
    return (
      pkg &&
      (row.id !== pkg.id ||
        row.name !== pkg.name ||
        row.type !== pkg.type ||
        row.recipient !== (pkg.recipient ?? ""))
    );
  });

  const updateRow = (originalId: string, patch: Partial<RowDraft>) => {
    setEdits((current) => ({
      ...current,
      [originalId]: { ...current[originalId], ...patch },
    }));
    setSaveError("");
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await Promise.all(
        dirtyRows.map((row) =>
          apiJson<Package>(
            `/api/admin/packages/${encodeURIComponent(row.originalId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: row.id,
                name: row.name,
                type: row.type,
                recipient: row.recipient,
              }),
            },
          ),
        ),
      );
      setEdits({});
      refreshPackages();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save packages",
      );
    } finally {
      setSaving(false);
    }
  };

  function confirmDelete(row: RowDraft & { originalId: string }) {
    if (
      window.confirm(
        `Delete ${row.name || row.id} (${row.originalId})? Its active delivery will also be deleted.`,
      )
    ) {
      deletePackage.mutate(row.originalId);
    }
  }

  return (
    <>
      <section className="mx-auto mb-8 max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
        <h2 className="mb-4 text-2xl">Create package</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block">ID (P + 5 characters)</span>
            <input
              value={id}
              maxLength={6}
              onChange={(event) =>
                setId(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
              }
              className={`${inputClass} uppercase`}
            />
          </label>
          <label>
            <span className="mb-1 block">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as PackageType)}
              className={inputClass}
            >
              <option value="duck">normal duck</option>
              <option value="direct">direct delivery</option>
            </select>
          </label>
          {type === "direct" && (
            <label>
              <span className="mb-1 block">Recipient name</span>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className={inputClass}
              />
            </label>
          )}
        </div>
        <button
          type="button"
          disabled={createPackage.isPending || !/^P[A-Z0-9]{5}$/.test(id) || !name.trim()}
          onClick={() => createPackage.mutate()}
          className="mt-4 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createPackage.isPending ? "Creating…" : "Create package"}
        </button>
        {createPackage.error && (
          <p className="mt-3 text-red-300">{createPackage.error.message}</p>
        )}
      </section>

      {packages.length === 0 && (
        <p className="text-center">No packages yet.</p>
      )}
      {packages.length > 0 && (
        <section className="mx-auto max-w-5xl rounded-xl bg-gray-800 p-5 pb-28 shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  {showQrs && <th className="p-2">QR</th>}
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Recipient</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.originalId} className="border-b border-gray-700">
                    {showQrs && (
                      <td className="p-2">
                        <div className="w-fit bg-white p-1">
                          <QRCode value={packageQrUrl(row.id)} size={64} />
                        </div>
                      </td>
                    )}
                    <td className="p-2">
                      <input
                        value={row.id}
                        maxLength={6}
                        onChange={(event) =>
                          updateRow(row.originalId, {
                            id: event.target.value
                              .replace(/[^a-zA-Z0-9]/g, "")
                              .toUpperCase(),
                          })
                        }
                        className={`${inputClass} w-24 font-mono uppercase`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(event) =>
                          updateRow(row.originalId, {
                            name: event.target.value,
                          })
                        }
                        placeholder="Name"
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.type}
                        onChange={(event) =>
                          updateRow(row.originalId, {
                            type: event.target.value as PackageType,
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
                            updateRow(row.originalId, {
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
                        onClick={() => confirmDelete(row)}
                        className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50"
                      >
                        Delete
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
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-700 bg-gray-900/95 p-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <span className="text-sm text-gray-300">
            {dirtyRows.length > 0
              ? `${dirtyRows.length} unsaved change${dirtyRows.length === 1 ? "" : "s"}`
              : "No unsaved changes"}
          </span>
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={saving || dirtyRows.length === 0}
            className="rounded bg-rose-500 px-5 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEdits({});
              setSaveError("");
            }}
            disabled={dirtyRows.length === 0}
            className="rounded bg-gray-600 px-5 py-2 text-white disabled:opacity-50"
          >
            revert
          </button>
          <button
            type="button"
            onClick={() => setShowQrs((current) => !current)}
            className="rounded bg-gray-600 px-5 py-2 text-white"
          >
            {showQrs ? "hide QR codes" : "show QR codes"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function PackagesTab({ packages }: PackagesTabProps) {
  const [subtab, setSubtab] = useState<PackageSubtab>("list");

  return (
    <>
      <div className="mb-6 flex justify-center gap-2" role="tablist">
        {PACKAGE_SUBTABS.map((subtabName) => (
          <button
            key={subtabName}
            type="button"
            role="tab"
            aria-selected={subtab === subtabName}
            className={`rounded px-5 py-2 capitalize ${
              subtab === subtabName
                ? "bg-rose-500 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
            onClick={() => setSubtab(subtabName)}
          >
            {subtabName}
          </button>
        ))}
      </div>
      {subtab === "list" && <PackageList packages={packages} />}
      {subtab === "scan" && <PackageScanTab />}
      {subtab === "export / import" && <PackageExportTab packages={packages} />}
    </>
  );
}
