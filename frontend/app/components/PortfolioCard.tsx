import Image from 'next/image'
import Link from 'next/link'

export default function PortfolioCard({ href, imageSrc, imageAlt, title, description }: { href: string; imageSrc: string; imageAlt: string; title: string; description: string }) {
  return (
    <div className="max-w-[300px] flex flex-col text-center">
      <Link href={href} className="group">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={300}
          height={300}
          className="group-hover:brightness-140 transition"
        />
        <h3 className="mt-4 mb-2 font-bold text-accent-400 underline group-hover:text-pale group-hover:text-shadow-glow">{title}</h3>
      </Link>
      <p className="italic text-pale transition">
        {description}
      </p>
    </div>
  )
}
