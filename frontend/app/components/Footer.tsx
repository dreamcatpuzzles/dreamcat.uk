import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary-200">
      <div className="container relative">
        <div className="flex flex-row items-center pt-12 lg:flex-row gap-6 justify-center text-sm sm:text-base leading-6 tracking-tight">
          <Link href="https://twitter.com/DreamcatPuzzles" target="_blank" rel="noopener noreferrer">
            Twitter
          </Link>
          |
          <Link
            href="https://www.instagram.com/dreamcat.puzzles"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </Link>
          |
          <Link href="https://mastodon.me.uk/@dreamcat" target="_blank" rel="noopener noreferrer">
            Mastodon
          </Link>
          |
          <Link
            href="https://buttondown.email/DreamcatPuzzles"
            target="_blank"
            rel="noopener noreferrer"
          >
            Newsletter
          </Link>
        </div>
        <div className="flex justify-center pb-10">
        <Link
            href="https://terpeca.com/2025/"
            target="_blank"
            rel="noopener noreferrer"
            ><Image
              src="/images/2025TERPECABadgeNominee.svg"
              alt="2025 TERPECA Award Nominee Badge"
              width={300}
              height={400}
              className="p-4"
          /></Link>
          </div>
      </div>
    </footer>
  )
}
