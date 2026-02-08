import Image from 'next/image'
import Link from 'next/link'
import InlineLink from './InlineLink'

export default function Footer() {
  return (
    <footer className="bg-pale">
      <div className="container relative">
        <div className="flex flex-row items-center pt-12 lg:flex-row gap-6 justify-center text-sm sm:text-base leading-6 tracking-tight">
          <InlineLink
            href="https://twitter.com/DreamcatPuzzles"
            openInNewTab={true}
          >
            Twitter
          </InlineLink>
          |
          <InlineLink
            href="https://www.instagram.com/dreamcat.puzzles"
            openInNewTab={true}
          >
            Instagram
          </InlineLink>
          |
          <InlineLink
            href="https://mastodon.me.uk/@dreamcat"
            openInNewTab={true}
          >
            Mastodon
          </InlineLink>
          |
          <InlineLink
            href="https://buttondown.email/DreamcatPuzzles"
            openInNewTab={true}
          >
            Newsletter
          </InlineLink>
        </div>
        <div className="flex justify-center pb-10">
          <Link href="https://terpeca.com/2025/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/2025TERPECABadgeNominee.svg"
              alt="2025 TERPECA Award Nominee Badge"
              width={300}
              height={400}
              className="p-4"
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}
