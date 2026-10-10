interface Upload {
  Key?: string;
  LastModified?: string;
  presignedUrl?: string;
}

interface PlayerEvent {
  action: string;
  data: Record<string, unknown> | null;
  at: string;
}

interface Player {
  id: string;
  name: string;
  profilePictureUrl: string;
  paused?: boolean;
  pauseReason?: "manual" | "auto" | null;
  lastActivityAt?: string;
  inactiveSeconds?: number;
  recentEvents?: PlayerEvent[];
}

interface Package {
  id: string;
  name: string;
  type: "duck" | "direct";
  recipient: string | null;
}

interface DeliveryChallengePlayer {
  id: string;
  name: string;
  status: "open" | "completed" | "abandoned" | string;
  proofImageUrl: string | null;
}

interface DeliveryChallenge {
  name: string | null;
  players: [DeliveryChallengePlayer, DeliveryChallengePlayer];
}

interface Delivery {
  id: string;
  package: Package;
  owner: Pick<Player, "id" | "name">;
  nextTarget: Pick<Player, "id" | "name">;
  journey: string[];
  route: string[];
  deliveryLength: number;
  status: "in_progress" | "awaiting_proof" | "confirmed";
  proofPictureUrl: string | null;
  proofShown: boolean;
  challenge: DeliveryChallenge | null;
}

interface Connection {
  id: string;
  status: "planned" | "confirmed";
  createdAt: string;
  confirmedAt?: string | null;
  playerOne: Pick<Player, "id" | "name">;
  playerTwo: Pick<Player, "id" | "name">;
}

interface UploadResponse {
  filesWithPresignedUrls: Upload[];
}

interface PlayerResponse {
  players: Player[];
}

interface PlayerEventsResponse {
  events: PlayerEvent[];
}

interface ConnectionResponse {
  connections: Connection[];
}

interface PackageResponse {
  packages: Package[];
}

interface DeliveryResponse {
  deliveries: Delivery[];
}

interface AdminChallengePlayer {
  id: string;
  name: string;
  profilePictureUrl: string;
  status: "open" | "completed" | "abandoned";
  proofImageUrl: string | null;
}

interface AdminChallenge {
  id: string;
  type: string | null;
  name: string | null;
  location: string;
  accessory: string | null;
  players: [AdminChallengePlayer, AdminChallengePlayer];
}

interface ChallengeResponse {
  challenges: AdminChallenge[];
}

interface DurationStatsRow {
  label: string;
  count: number;
  averageSeconds: number | null;
  p90Seconds: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
}

interface StatsResponse {
  playerCount: number;
  connections: DurationStatsRow[];
  deliveries: DurationStatsRow[];
}

export type {
  AdminChallenge,
  AdminChallengePlayer,
  ChallengeResponse,
  Connection,
  ConnectionResponse,
  Delivery,
  DeliveryChallenge,
  DeliveryResponse,
  DurationStatsRow,
  Package,
  PackageResponse,
  Player,
  PlayerEvent,
  PlayerEventsResponse,
  PlayerResponse,
  StatsResponse,
  Upload,
  UploadResponse,
};
