"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import DuckIcon from "@/app/DuckIcon";

interface Stop {
  id: string;
  name?: string;
  profilePictureUrl: string;
}

interface DeliveryRouteProps {
  journey: Stop[];
  deliveryLength: number;
  completedStops?: number;
  nextTargetProfilePictureUrl?: string | null;
}

export default function DeliveryRoute({ journey, deliveryLength, completedStops = journey.length, nextTargetProfilePictureUrl }: DeliveryRouteProps) {
  const stops: (Stop | null)[] = [
    ...journey,
    ...Array.from({ length: Math.max(0, deliveryLength + 1 - journey.length) }, () => null),
  ];
  const inProgress = completedStops > 0 && completedStops < stops.length;

  // Keep the floating duck centred in the strip — it sits on the connector
  // inside the next target's li. The browser clamps the scroll near the ends.
  // Stays manually scrollable.
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  useLayoutEffect(() => {
    const container = scrollRef.current;
    const list = container?.firstElementChild;
    const anchor = list?.children[Math.min(completedStops, stops.length - 1)];
    if (!container || !list || !anchor) return;
    const connector = anchor.firstElementChild ?? anchor;
    const listLeft = list.getBoundingClientRect().left;
    const connectorRect = connector.getBoundingClientRect();
    const duckCentre = connectorRect.left + connectorRect.width / 2 - listLeft;
    container.scrollTo({
      left: duckCentre - container.clientWidth / 2,
      behavior: hasScrolled.current ? "smooth" : "auto",
    });
    hasScrolled.current = true;
  }, [completedStops, stops.length]);

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <ol
        aria-label="Delivery route"
        className={`mx-auto flex w-fit items-start pb-2 ${inProgress ? "pt-5" : "pt-2"}`}
      >
      {stops.map((stop, index) => {
        const completed = index < completedStops;
        const label = index === 0 ? "Start" : completed ? "Visited" : "Planned";
        const isNextTarget = index === completedStops;
        const pictureUrl = stop?.profilePictureUrl ||
          (isNextTarget ? nextTargetProfilePictureUrl : null) || null;
        const description = stop
          ? `${label}: ${stop.name ?? stop.id}`
          : pictureUrl ? "Next target" : `Step ${index}: destination unknown`;
        return (
          <li key={stop?.id ?? `unknown-${index}`} className="flex shrink-0 items-start">
            {index > 0 && (
              <span aria-hidden="true" className="relative mt-[18px] h-1 w-5 bg-rose-300 sm:mt-[22px] sm:w-8">
                {isNextTarget && (
                  <DuckIcon className="absolute bottom-1 left-1/2 h-7 w-7 -translate-x-1/2 animate-duck-bob text-rose-700 motion-reduce:animate-none" />
                )}
              </span>
            )}
            <span className="flex w-14 flex-col items-center gap-1 sm:w-16">
              {pictureUrl ? (
                <Image
                  unoptimized
                  width={48}
                  height={48}
                  src={pictureUrl}
                  alt={description}
                  title={description}
                  className={`h-10 w-10 rounded-full border-2 object-cover sm:h-12 sm:w-12 ${completed ? "border-green-500" : "border-dashed border-rose-300"}`}
                />
              ) : (
                <span
                  aria-label={description}
                  title={stop ? description : "Destination unknown"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-rose-300 bg-rose-50 font-bold text-rose-700 sm:h-12 sm:w-12"
                >
                  ?
                </span>
              )}
              {completed && stop?.name && (
                <span className="w-full truncate text-center text-sm leading-tight">
                  {stop.name}
                </span>
              )}
            </span>
          </li>
        );
      })}
      </ol>
    </div>
  );
}
