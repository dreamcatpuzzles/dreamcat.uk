interface ApiErrorBody {
  error?: string;
}

async function apiJson<T>(
  input: string,
  init?: RequestInit,
  fallbackMessage = "Request failed",
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response
    .json()
    .catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error ?? fallbackMessage);
  }
  return body;
}

async function apiVoid(
  input: string,
  init?: RequestInit,
  fallbackMessage = "Request failed",
): Promise<void> {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(fallbackMessage);
}

const queryKeys = {
  admin: {
    challenges: ["admin", "challenges"] as const,
    connections: ["admin", "connections"] as const,
    deliveries: ["admin", "deliveries"] as const,
    feedback: ["admin", "feedback"] as const,
    packages: ["admin", "packages"] as const,
    players: ["admin", "players"] as const,
    puzzles: ["admin", "puzzles"] as const,
    session: ["admin", "session"] as const,
    settings: ["admin", "settings"] as const,
    stats: ["admin", "stats"] as const,
    uploads: ["admin", "uploads"] as const,
  },
  publicGraph: ["public", "graph"] as const,
  config: ["config"] as const,
  game: {
    all: ["game"] as const,
    inbox: ["game", "inbox"] as const,
    network: ["game", "network"] as const,
    challenge: (id: string) => ["game", "challenges", id] as const,
  },
  session: ["session"] as const,
};

export { apiJson, apiVoid, queryKeys };
