import Image from "next/image";
import Row from "./Row";
import Link from "next/link";
import Navbar from "./Navbar";
import SectionTitle from "./SectionTitle";

function GamePreview({ href, image, imageAlt, name, description }:
  { href: string, image: string, imageAlt: string, name: string, description: string }) {
  return (
    <div>
      <Link href={href}>
        <Image src={image} alt={imageAlt} width={300} height={300} />
        <h3>{name}</h3>
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
      <GamePreview href="/lucid-labs" image="lucid-labs.png" imageAlt="Lucid Labs logo, concentric multicoloured circles" name="Lucid Labs (2025)" description="'Lucidation protocol online. System activates in three... two... one...'" />
    </Row>

  </>
}
