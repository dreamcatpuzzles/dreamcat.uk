import Image, { StaticImageData } from "next/image";
import Row from "./Row";
import Navbar from "./Navbar";
import Link from "./Link";
import SectionTitle from "./SectionTitle";
import InlineLink, { inlineLinkStyles } from "./InlineLink";
import { cn } from "./cn";
import { logo, instagram, mastodon, bluesky, lucid_labs, clippy_book, octonet, dreamcatcher, key_of_dreams, locksmiths_dream, ttktm, event_crowd, dinos, sarah, michael, catalin, benb, harry1 } from "./images";

function GamePreview({ href, image, imageAlt, name, description }:
  { href: string, image: string | StaticImageData, imageAlt: string, name: string, description: string }) {
  return (
    <div className="max-w-[300px]">
      <Link href={href} className="group">
        <Image src={image} alt={imageAlt} className="h-[300px] object-cover group-hover:brightness-125" />
        <h3 className={cn(inlineLinkStyles)}>{name}</h3>
      </Link>
      <p>{description}</p>
    </div>
  )
}

function PersonProfile({ image, name, title }: { image?: string | StaticImageData, name: string, title?: string }) {
  return (
    <div className="pb-4">
      <Image src={image || logo} alt={image ? `Portrait of ${name}` : "Placeholder portrait"} height={300} />
      <h3 className="font-bold text-center pt-4">{name}</h3>
      {title && <p className="text-center">{title}</p>}
    </div>

  )
}

export default function Home() {
  return <><div className="container text-center flex flex-col items-center">
    <Image src={logo} alt="Sleeping cat logo" unoptimized height={200} className="mt-4" />
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
          <Link href="https://www.instagram.com/dreamcat.puzzles/"><Image src={instagram} height={45} alt="Instagram" /></Link>
          <br />
          <Link href="https://mastodon.me.uk/@dreamcat"><Image src={mastodon} height={45} alt="Mastodon" /></Link>
          <br />
          <Link href="https://bsky.app/profile/dreamcatpuzzles.bsky.social"><Image src={bluesky} height={45} alt="Bluesky" /></Link>
        </div>
      </div>
    </Row>

    <Navbar />

    <Row>
      <SectionTitle>Our games</SectionTitle>
      <div className="flex flex-wrap justify-between">
        <GamePreview href="/lucid-labs" image={lucid_labs} imageAlt="Lucid Labs logo, concentric multicoloured circles" name="Lucid Labs (2025)" description="'Lucidation protocol online. System activates in three... two... one...'" />
        <GamePreview href="/who-killed-clippy" image={clippy_book} imageAlt="Pixel art book with question mark cover" name="Who Killed Clippy? (2024)" description="Hello! It looks like you're trying to solve my murder..." />
        <GamePreview href="/octonet" image={octonet} imageAlt="Geometric octopus logo with text: OCTONET. The web. Untangled." name="OCTONET (2022)" description="Untangle a corporate conspiracy." />
        <GamePreview href="/dreamcatcher" image={dreamcatcher} imageAlt="Abstract geometric pattern with circles and squares, reminiscent of a circuit board" name="Dreamcatcher (2018)" description="The Machine thinks. But it needs dreams." />
      </div>


      <SectionTitle>Our collaborations</SectionTitle>
      <div className="flex flex-wrap justify-between">
        <GamePreview href="https://www.thekeyofdreams.co.uk" image={key_of_dreams} imageAlt="Ominous tree lit from behind by warm light" name="The Key of Dreams (2024-)" description="A theatre experience inspired by classic works of gothic and cosmic horror." />
        <GamePreview href="https://www.locksmithsdream.com/" image={locksmiths_dream} imageAlt="Disorienting view up a square spiral staircase... or is it down?" name="The Locksmith's Dream (2022-23)" description="Puzzle design for an immersive experience like no other." />
        <GamePreview href="https://audioboom.com/posts/7921770-the-wishing-fish-clock" image={ttktm} imageAlt="Man in spy hat and trenchcoat looks furtively through a filing cabinet. On the drawer is a golden hare" name="The Town That Knew Too Much" description="A secret message hidden in a podcast about the 1979 book Masquerade." />
      </div>
    </Row>

    <Row inverted>
      <SectionTitle>Events</SectionTitle>
      <p> We can do one of our games at your wedding, party, corporate event, you name it. <InlineLink href="/events">Find out more!</InlineLink></p>
      <p>"Everyone had a fantastic time and thoroughly enjoyed themselves. Would highly recommend."</p>
      <p>— Yee, Risilience (Cambridge)</p>
      <Image src={event_crowd} alt="A crowd of people looking intently at a puzzle" className="h-[300px] w-full object-cover" />
    </Row>

    <Row>
      <SectionTitle>Commissions and Partnerships</SectionTitle>
      <p>We don't just work alone. We'll work with you to design an experience that will knock guests' socks off.</p>
      <p>Our approach: understand your audience, figure out what they find fun, do our own reading and research, and turn all of that into a series of puzzles that integrate seamlessly with the rest of your experience.</p>
      <p>Not everybody is an expert at puzzles, so we always tailor experiences to complement the rest of the event, and ensure that they are fun for everyone in the audience, regardless of age or puzzling experience.</p>
      <p>To find out more about our design process, head over to <InlineLink href="https://blog.dreamcat.uk/">our blog</InlineLink>.</p>
      <Image src={dinos} alt="Close up of a game board with hexagonal dinosaur bone pieces" className="h-[300px] w-full object-cover" />
    </Row>

    <Row inverted>
      <SectionTitle>Meet the team</SectionTitle>
      <div className="flex flex-wrap justify-between">
        <PersonProfile image={sarah} name="Sarah Binney" title="Chief Paperclip Duplicator"/>
        <PersonProfile image={michael} name="Michael Kearns" title="Director of Paperclip Counting"/>
        <PersonProfile image={catalin} name="Catalin Lafita-Ursachi" title="Principal Paperclip De-duplicator"/>
        <PersonProfile image={benb} name="Ben Below" title="Head of Multiplayer Solitaire"/>
        <PersonProfile image={harry1} name="Harry Cummings" title="Non-Denominational Nerd"/>
        <PersonProfile name="Alicia Lafita Ursachi"/>
        <PersonProfile name="Benjamin Fernandes" />
        <PersonProfile name="Caz Yang" />
        <PersonProfile name="Harry Best" />
        <PersonProfile name="Lewis Wakeland" />
        <PersonProfile name="Rin Shaw" />
        <PersonProfile name="Shiv Chandarana" />
        <PersonProfile name="Wai-Wai Ng" />
      </div>
    </Row>

    <Row>
      <SectionTitle>Get in touch</SectionTitle>
      <p>Interested in what we do? Drop us a line at <InlineLink href="mailto:hi@dreamcat.uk">hi@dreamcat.uk</InlineLink>, we love to talk about puzzles! </p>
    </Row>
  </>
}
