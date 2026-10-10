import type { GameTab } from "@/app/game/types";

interface GameNavigationProps {
  activeTab: GameTab;
  onSelect: (tab: GameTab) => void;
  onScan: () => void;
  scanDisabled: boolean;
}

const items: { id: GameTab | "scan"; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "scan", label: "Scan" },
  { id: "network", label: "Network" },
  { id: "settings", label: "Settings" },
];

export default function GameNavigation({
  activeTab,
  onSelect,
  onScan,
  scanDisabled,
}: GameNavigationProps) {
  return (
    <nav
      aria-label="Game navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rose-300 bg-white/95 px-4 py-3 shadow-[0_-4px_18px_rgba(0,0,0,0.12)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={scanDisabled && item.id === "scan"}
            aria-current={activeTab === item.id ? "page" : undefined}
            aria-haspopup={item.id === "scan" ? "dialog" : undefined}
            className={`rounded-xl px-2 py-3 text-base transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xl ${
              activeTab === item.id
                ? "bg-rose-500 text-white"
                : "text-rose-800 hover:bg-rose-100"
            }`}
            onClick={() => item.id === "scan" ? onScan() : onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
