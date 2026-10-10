import { Metadata } from "next";
import Row from "../Row";
import Image from "next/image";
import { crime_scene, defrag, logo, paint_toolbar, phones } from "../images";
import Navbar from "../Navbar";
import InlineLink from "../InlineLink";
import SectionTitle from "../SectionTitle";

export const metadata: Metadata = {
    title: "Who Killed Clippy? | Dreamcat",
    description: "It looks like you're trying to solve my murder. Would you like help?"
}

export default function WhoKilledClippyPage() {
    return (<>
        <Navbar />
        <div className="flex flex-col items-center py-8">
            <Image src={logo} alt="Logo of sleeping cat" height={200} />
            <h1 className="font-bold text-5xl pb-4">Who Killed Clippy?</h1>
            <p className="font-bold text-3xl">A Dreamcat puzzlehunt</p>
        </div>
        <Row inverted>
            <p className="font-bold text-xl text-center">It looks like you're trying to solve my murder. Would you like help?</p>
            <Image src={crime_scene} alt="Close up of a diorama of a murdered paperclip with googly eyes. Crime scene tape all around" />
        </Row>
        <Row>
            <p>A puzzlehunt launched at <InlineLink href="https://www.emfcamp.org/">Electromagnetic Field Festival 2024</InlineLink>.</p>
            <p>A murder most foul has been committed in the once serene land of OS. Can you defragment the clues, debug the chaos left in the murderer's path, and solve the mystery?</p>
            <Image src={defrag} alt="Woman solving a puzzle in the style of a Windows 98 UI, text says Defragmenting" />
        </Row>
        <Row inverted>
            <SectionTitle>More info</SectionTitle>
            <p>The Wizard of OS is made up of a number of puzzles scattered across a large area including a mobile escape room.</p>
            <ul className="list-disc list-inside">
                <li>Difficulty: 3/5</li>
                <li>Duration: 3-4 hours</li>
                <li>Team size: 3-6</li>
                <li>Age: 12+</li>
            </ul>
            <Image src={paint_toolbar} alt="Close up of a toolbar from MS Paint, but it's in real life - the buttons are glowing" />
        </Row>
        <Row>
            <SectionTitle>What people say...</SectionTitle>
            <center>
                <blockquote className="twitter-tweet">
                    <p lang="en" dir="ltr">
                        Highlight of
                        <a
                            href="https://twitter.com/hashtag/emf2024?src=hash&amp;ref_src=twsrc%5Etfw"
                        >#emf2024</a
                        >
                        was the Clippy&#39;s Murder Puzzle Hunt from
                        <a
                            href="https://twitter.com/DreamcatPuzzles?ref_src=twsrc%5Etfw"
                        >@DreamcatPuzzles</a
                        >
                        <br /><br />RIP Clippy, gone but not forgotten
                        <a href="https://t.co/JgeUn9lxl6"
                        >pic.twitter.com/JgeUn9lxl6</a
                        >
                    </p>
                    &mdash; Alison Clarke (@aaclarke4)
                    <a
                        href="https://twitter.com/aaclarke4/status/1797610280429764831?ref_src=twsrc%5Etfw"
                    >June 3, 2024</a
                    >
                </blockquote>
            </center>
            <script
                async
                src="https://platform.twitter.com/widgets.js"
                charset="utf-8"
            ></script>
            <center>
                <blockquote class="twitter-tweet" data-dnt="true">
                    <p lang="en" dir="ltr">
                        After the high concept, high execution of 2022,
                        wasn&#39;t sure how
                        <a
                            href="https://twitter.com/DreamcatPuzzles?ref_src=twsrc%5Etfw"
                        >@DreamcatPuzzles</a
                        >
                        could follow it up. Life finds a way. Clippy was
                        brilliant. Thank you.
                        <a
                            href="https://twitter.com/hashtag/emfcamp2024?src=hash&amp;ref_src=twsrc%5Etfw"
                        >#emfcamp2024</a
                        >
                        <a
                            href="https://twitter.com/emfcamp?ref_src=twsrc%5Etfw"
                        >@emfcamp</a
                        >
                        <a href="https://t.co/enva6SQo3I"
                        >pic.twitter.com/enva6SQo3I</a
                        >
                    </p>
                    &mdash; Toby (@hobytalpert)
                    <a
                        href="https://twitter.com/hobytalpert/status/1796966997042827590?ref_src=twsrc%5Etfw"
                    >June 1, 2024</a
                    >
                </blockquote>
            </center>
        </Row>

        <Row inverted>
            <SectionTitle>Stay in the loop</SectionTitle>
            <p>If you missed us at EMF, sign up to our <InlineLink href="https://buttondown.email/DreamcatPuzzles">newsletter</InlineLink> and we'll let you know when we next run it - or <InlineLink href="/#contact">get in touch</InlineLink> to organise a private event!</p>
            <Image src={phones} alt="Two old rotary dial phones with a cryptic poster of a network behind them" />
        </Row>
    </>
    )
}