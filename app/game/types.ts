interface ConnectionMission {
  id: string;
  name: string | null;
  profilePictureUrl: string;
  hintLevel: number;
  hintDelaySeconds: number;
}

type ChallengeType = "captcha" | "surprise" | "card" | "art" | "toastcard";

interface ChallengeMission {
  id: string;
  card: string | null;
  name: string | null;
  type: ChallengeType | null;
  solved: boolean;
  isDeliverer: boolean;
  location: string;
  proofText: string | null;
  proofSubmitted: boolean;
  proofImageUrl: string | null;
  otherPlayer: NetworkPlayer;
}

interface PackageMission {
  id: string;
  name: string;
  type: "duck" | "direct";
  recipient: string | null;
  deliveryLength: number;
  status: "in_progress" | "awaiting_proof";
  proofSubmitted: boolean;
  proofImageUrl: string | null;
  journey: { id: string; name: string; profilePictureUrl: string }[];
  nextTargetProfilePictureUrl: string | null;
  nextTargetName: string | null;
  challenge: ChallengeMission | null;
}

interface ChallengeDetail {
  id: string;
  type: ChallengeType | null;
  name: string | null;
  location: string;
  accessory: string | null;
  status: string;
  solved: boolean;
  isDeliverer: boolean;
  proofSubmitted: boolean;
  proofImageUrl: string | null;
  proofText: string | null;
  theme: string | null;
  grid: { rows: number; cols: number } | null;
  otherPlayer: NetworkPlayer;
}

interface InboxResponse {
  connections: ConnectionMission[];
  packages: PackageMission[];
  challenges: ChallengeMission[];
  canReceivePackage: boolean;
}

interface NetworkPlayer {
  id: string;
  name?: string;
  profilePictureUrl: string;
  paused?: boolean;
  pauseReason?: "manual" | "auto" | null;
}

interface NetworkConnection {
  id: string;
  status: "planned" | "confirmed";
  greeted: boolean;
  kind: "networking" | "delivery";
  player: NetworkPlayer;
}

interface NetworkResponse {
  connections: NetworkConnection[];
  peerConnections: { from: string; to: string }[];
  completedDeliveries: number;
  leaderboard: { id: string; name: string; connections: number }[];
  player: NetworkPlayer;
}

type GameTab = "inbox" | "network" | "settings";

export type {
  GameTab,
  InboxResponse,
  ChallengeDetail,
  ChallengeMission,
  ConnectionMission,
  PackageMission,
  NetworkConnection,
  NetworkPlayer,
  NetworkResponse,
};
