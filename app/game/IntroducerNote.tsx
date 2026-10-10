export default function IntroducerNote({
  player,
}: {
  player: { name: string | null; profilePictureUrl: string };
}) {
  return (
    <div className="flex items-center gap-3 text-left text-base">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={player.profilePictureUrl}
        alt={player.name || "Your previous connection"}
        className="aspect-square w-16 shrink-0 rounded-full object-cover"
      />
      <p>
        They are connected to <b>{player.name || "your last connection"}</b>,
        so you can ask them for an introduction.
      </p>
    </div>
  );
}
