"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const GAME_OVER_KEY = "game-over";

export default function GameOverRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/wrapped" && window.localStorage.getItem(GAME_OVER_KEY)) {
      router.replace("/wrapped");
    }
  }, [pathname, router]);

  return null;
}
