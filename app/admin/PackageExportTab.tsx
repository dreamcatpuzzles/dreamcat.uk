"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import type { Package } from "@/app/admin/types";

interface ImportResult {
  created: Package[];
  skipped: { id: string; reason: string }[];
}

const textAreaClass =
  "w-full rounded border border-gray-600 bg-gray-700 p-2 font-mono text-sm text-gray-100";

export default function PackageExportTab({ packages }: { packages: Package[] }) {
  const queryClient = useQueryClient();
  const [importText, setImportText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const importPackages = useMutation({
    mutationFn: (text: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("That isn't valid JSON");
      }
      if (!Array.isArray(parsed)) {
        throw new Error("The JSON must be an array of packages");
      }
      return apiJson<ImportResult>("/api/admin/packages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: parsed }),
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setImportText("");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.packages,
      });
    },
  });

  const exportJson = JSON.stringify(
    packages.map(({ id, name, type, recipient }) => ({
      id,
      name,
      type,
      recipient,
    })),
    null,
    2,
  );

  return (
    <>
      <section className="mx-auto mb-6 max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
        <h2 className="mb-4 text-2xl">Package IDs</h2>
        <textarea
          readOnly
          value={packages.map((item) => item.id).join("\n")}
          rows={8}
          className={textAreaClass}
        />
      </section>

      <section className="mx-auto mb-6 max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
        <h2 className="mb-4 text-2xl">Packages JSON</h2>
        <textarea
          readOnly
          value={exportJson}
          rows={12}
          className={textAreaClass}
        />
      </section>

      <section className="mx-auto max-w-2xl rounded-xl bg-gray-800 p-5 shadow">
        <h2 className="mb-4 text-2xl">Import</h2>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          rows={10}
          placeholder='[{"id":"P12345","name":"duck","type":"duck","recipient":null}]'
          className={textAreaClass}
        />
        <button
          type="button"
          disabled={importPackages.isPending || !importText.trim()}
          onClick={() => {
            setResult(null);
            importPackages.mutate(importText);
          }}
          className="mt-4 rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {importPackages.isPending ? "Importing…" : "Import"}
        </button>
        {importPackages.error && (
          <p className="mt-3 text-red-300">{importPackages.error.message}</p>
        )}
        {result && (
          <div className="mt-4">
            <p>
              Imported {result.created.length} package
              {result.created.length === 1 ? "" : "s"}.
            </p>
            {result.skipped.length > 0 && (
              <div className="mt-2">
                <p className="text-yellow-300">
                  {result.skipped.length} package
                  {result.skipped.length === 1 ? " was" : "s were"} skipped:
                </p>
                <ul className="mt-1 list-inside list-disc text-yellow-200">
                  {result.skipped.map((item, index) => (
                    <li key={`${item.id}-${index}`}>
                      {item.id} — {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
