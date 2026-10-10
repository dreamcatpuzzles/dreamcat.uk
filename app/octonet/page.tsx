import { Metadata } from "next";
import Image from "next/image";
import { dinos, event_cafe, octonet, phonebooth } from "../images";
import InlineLink from "../InlineLink";
import Navbar from "../Navbar";
import Row from "../Row";
import SectionTitle from "../SectionTitle";

export const metadata: Metadata = {
    title: "OCTONET | Dreamcat",
    description: "Solve the puzzle. Untangle the Web."
}

export default function OctonetPage() {
    return (<>
        <Navbar />
        <div className="bg-black flex flex-col items-center py-8">
            <Image src={octonet} alt="Logo of sleeping cat" height={200} />
            <h1 className="font-bold text-5xl pb-4">OCTONET</h1>
            <p className="font-bold text-3xl">A Dreamcat puzzlehunt</p>
        </div>
        <Row inverted>
            <p className="font-bold text-xl text-center">Welcome to Polywork, contractors!</p>
            <p> For too long, the internet has suffered from a fragmented and decentralized make up.</p>
            <p>Consumer confusion is at an all time high and mindless convenience at an all time low.</p>
            <p>Here at Polybius we dare to dream of a more unified, streamlined future, in which all of mankind will communicate through one, convenient, purpose built channel.</p>
            <p>And that channel will be OCTONET.</p>
            <Image src={event_cafe} alt="Several people crowd around a circular board reading Polywork Cafeteria with lights. A woman holds a piece of card up to the board" />
        </Row>
        <Row>
            <p> Originally built for <InlineLink href="https://www.emfcamp.org/">Electromagnetic Field Festival 2022</InlineLink>, OCTONET is a puzzlehunt that tasks players with uncovering a vast corporate conspiracy.</p>
            <p>Explore, solve puzzles and reveal the truth. What is OCTONET? Why are they having a hackday? Can you stop it before it's too late?</p>
            <p>And does the hackday have nice beer and pizza?</p>
            <Image src={dinos} alt="Close up of a game board with hexagonal dinosaur bone pieces" />
        </Row>
        <Row>
            <SectionTitle>Testimonials</SectionTitle>
            <p>"...absolutely magical. You're all lovely and creative people, and have been the highlight of my festival. Thank you from the bottom of my heart."</p>
            <p>— From Twitter</p>
            <p>"The puzzlehunt was amazing - I stumbled across the secret door on Friday night and for the whole of Saturday was irrevocably obsessed"</p>
            <p>— From Twitter</p>
        </Row>

        <Row inverted>
            <SectionTitle>Stay in the loop</SectionTitle>
            <p>If you missed us at EMF, sign up to our <InlineLink href="https://buttondown.email/DreamcatPuzzles">newsletter</InlineLink> and we'll let you know when we next run it - or <InlineLink href="/#contact">get in touch</InlineLink> to organise a private event!</p>
            <Image src={phonebooth} alt="People crowd into a red phone box" className="object-cover h-100" />
        </Row>
    </>
    )
}