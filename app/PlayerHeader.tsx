"use client";

import { useQuery } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";
import DuckIcon from "@/app/DuckIcon";

interface Player {
  id: string;
  name: string;
  profilePictureUrl: string;
}

interface PlayerHeaderProps {
  stats?: {
    connections: number;
    completedDeliveries: number;
  };
}

export default function PlayerHeader({
  stats,
}: PlayerHeaderProps) {
  const playerQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) =>
      apiJson<Player>(
        "/api/session",
        { signal },
        "Could not load session",
      ),
    retry: false,
  });

  if (playerQuery.isPending) {
    return <header className="min-h-16 bg-rose-500 px-4 py-2 text-white" />;
  }

  if (!playerQuery.data) {
    return (
      <header className="bg-rose-500 px-4 py-2 text-white">Not signed in</header>
    );
  }

  return (
    <header className="flex items-center gap-3 bg-rose-500 px-4 py-2 text-white">
      {/* next/image's default optimizer is unavailable with static export. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={playerQuery.data.profilePictureUrl}
        alt={`${playerQuery.data.name}'s profile`}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="text-xl leading-tight break-words">{playerQuery.data.name}</p>
      </div>
      {stats && (
        <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span role="img" aria-label={`${stats.connections} connections`} className="flex items-center gap-1">
            {stats.connections}x
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/person_icon.svg" alt="" aria-hidden="true" className="h-5 w-5 invert" />
          </span>
          <span role="img" aria-label={`${stats.completedDeliveries} completed deliveries`} className="flex items-center gap-1">
            {stats.completedDeliveries}x
            <DuckIcon className="h-5 w-5 invert" />
          </span>
        </div>
      )}
    </header>
  );
}
