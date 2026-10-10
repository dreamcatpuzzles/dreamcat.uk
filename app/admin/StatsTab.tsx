"use client";

import { useQuery } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";
import type { DurationStatsRow, StatsResponse } from "@/app/admin/types";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const total = Math.round(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function StatsTable({ rows }: { rows: DurationStatsRow[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-600">
          <th className="py-2 pr-4 font-normal"></th>
          <th className="py-2 pr-4 font-normal">players</th>
          <th className="py-2 pr-4 font-normal">avg</th>
          <th className="py-2 pr-4 font-normal">p90</th>
          <th className="py-2 pr-4 font-normal">min</th>
          <th className="py-2 font-normal">max</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-700">
            <th className="py-2 pr-4 font-normal">{row.label}</th>
            <td className="py-2 pr-4">{row.count}</td>
            <td className="py-2 pr-4">{formatDuration(row.averageSeconds)}</td>
            <td className="py-2 pr-4">{formatDuration(row.p90Seconds)}</td>
            <td className="py-2 pr-4">{formatDuration(row.minSeconds)}</td>
            <td className="py-2">{formatDuration(row.maxSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatsTab() {
  const stats = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: ({ signal }) =>
      apiJson<StatsResponse>("/api/admin/stats", { signal }),
  });

  if (stats.isPending) {
    return <p className="text-center">Loading…</p>;
  }
  if (stats.isError) {
    return <p className="text-center text-red-300">Could not load stats.</p>;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-xl bg-gray-800 p-5 shadow">
      <p className="text-2xl">WARNING: Untested, likely dodgy! Sorrryyyy</p>
      <p className="text-2xl">Players: {stats.data.playerCount}</p>
      <div>
        <h2 className="mb-3 text-2xl">Connections</h2>
        <StatsTable rows={stats.data.connections} />
      </div>
      <div>
        <h2 className="mb-3 text-2xl">Deliveries</h2>
        <StatsTable rows={stats.data.deliveries} />
      </div>
    </section>
  );
}
