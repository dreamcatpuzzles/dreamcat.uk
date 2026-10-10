import Image from "next/image";
import Row from "./Row";
import Link from "next/link";
import Navbar from "./Navbar";
import SectionTitle from "./SectionTitle";
import { inlineLinkStyles } from "./InlineLink";
import { cn } from "./cn";

function GamePreview({ href, image, imageAlt, name, description }:
  { href: string, image: string, imageAlt: string, name: string, description: string }) {
  return (
    <div className="max-w-[300px]">
      <Link href={href} className="group">
        <Image src={image} alt={imageAlt} width={300} height={300} className="h-[300px] object-cover group-hover:brightness-125" />
        <h3 className={cn(inlineLinkStyles)}>{name}</h3>
      </Link>
      <p>{description}</p>
    </div>
  )
}

export default function Home() {
  return <><div className="container text-center flex flex-col items-center">
    <Image src="logo.png" alt="Sleeping cat logo" unoptimized width={200} height={200} className="mt-4" />
    <h1 className="text-4xl py-4 font-bold">Hi! We're Dreamcat.</h1>
  </div>
    <Row inverted>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col items-center w-full">
          <p className="font-bold pb-4">
            We make interactive puzzle experiences that uniquely blend escape rooms, treasure hunts and video games.
          </p>
          <p>Intrigued? Then we're going to get along very nicely.</p>
        </div>
        <div>
          <Link href="/"><Image unoptimized src="instagram.png" width={45} height={45} alt="Instagram" /></Link>
          <br />
          <Link href="/"><Image unoptimized src="mastodon.png" width={45} height={45} alt="Mastodon" /></Link>
          <br />
          <Link href="/"><Image unoptimized src="Bluesky_Logo.svg" width={45} height={45} alt="Bluesky" /></Link>
        </div>
      </div>
    </Row>

    <Navbar />

    <Row>
      <SectionTitle>Our games</SectionTitle>
      <div className="flex flex-wrap justify-between">
        <GamePreview href="/lucid-labs" image="lucid-labs.png" imageAlt="Lucid Labs logo, concentric multicoloured circles" name="Lucid Labs (2025)" description="'Lucidation protocol online. System activates in three... two... one...'" />
        <GamePreview href="/who-killed-clippy" image="clippy-book.png" imageAlt="Pixel art book with question mark cover" name="Who Killed Clippy? (2024)" description="Hello! It looks like you're trying to solve my murder..." />
        <GamePreview href="/octonet" image="octonet.jpg" imageAlt="Geometric octopus logo with text: OCTONET. The web. Untangled." name="OCTONET (2022)" description="Untangle a corporate conspiracy." />
        <GamePreview href="/dreamcatcher" image="dreamcatcher.jpg" imageAlt="Abstract geometric pattern with circles and squares, reminiscent of a circuit board" name="Dreamcatcher (2018)" description="The Machine thinks. But it needs dreams." />
      </div>


      <SectionTitle>Our collaborations</SectionTitle>
      <div className="flex flex-wrap justify-between">
        <GamePreview href="https://www.thekeyofdreams.co.uk" image="key-of-dreams.jpeg" imageAlt="Ominous tree lit from behind by warm light" name="The Key of Dreams (2024-)" description="A theatre experience inspired by classic works of gothic and cosmic horror."/>
        <GamePreview href="https://www.locksmithsdream.com/" image="locksmiths-dream.png" imageAlt="Disorienting view up a square spiral staircase... or is it down?" name="The Locksmith's Dream (2022-23)" description="Puzzle design for an immersive experience like no other."/>
        <GamePreview href="https://audioboom.com/posts/7921770-the-wishing-fish-clock" image="town-that-knew-too-much.jpg" imageAlt="Man in spy hat and trenchcoat looks furtively through a filing cabinet. On the drawer is a golden hare" name="The Town That Knew Too Much" description="A secret message hidden in a podcast about the 1979 book Masquerade." />
      </div>
    </Row>

  </>
}
