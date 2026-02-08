import Image from "next/image";

export default function HeadshotCard({ name, role, bio, imageSrc }: { name: string; role?: string; bio?: string; imageSrc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <Image src={imageSrc} alt={`${name}'s headshot`} width={300} height={300} className="h-[300px] object-cover" />
      <div className="max-w-[300px]">
        <h3 className="text-lg font-bold">{name}</h3>
        {role && <p className="italic">{role}</p>}
        {bio && <p>{bio}</p>}
      </div>
    </div>
  )
}
