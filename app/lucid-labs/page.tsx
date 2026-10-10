import { Metadata } from "next";
import Navbar from "../Navbar";
import Image from "next/image";
import { lucid_labs, reaction, terpeca_2025 } from "../images";
import Row from "../Row";
import Link from "../Link";
import InlineLink from "../InlineLink";
import SectionTitle from "../SectionTitle";

export const metadata: Metadata = {
    title: "Lucid Labs | Dreamcat",
    description: "Unlock the potential of your dreams"
}

export default function LucidLabsPage() {
    return <>
        <Navbar />
        <div className="bg-black">
            <Image src={lucid_labs} alt="Lucid Labs logo, concentric circles" />
            <h1>Lucid Labs</h1>
            <p>A Dreamcat experience</p>
        </div>
        <Row inverted>
            <p className="font-bold font-xl">Here at Lucid Labs, we believe in the power of dreams. With our very* safe and mostly** tested procedure, you are almost guaranteed to enter into a state of lucid dreaming and explore your own subconscious.</p>
            <p className="font-bold font-xl">What could go wrong?</p>
            <Link href="https://terpeca.com/2025/"><Image src={terpeca_2025} alt="Top Escape Rooms Project Enthusiasts' Choice Awards (TERPECA) 2025 Nominee badge" height={300} /></Link>
            <Link href="https://roomescapeartist.com/2026/01/24/congratulations-2026-reaction-award-winners/"><Image src={reaction} alt="REAction Award for Inspiration to Action from Room Escape Artist" height={300} /></Link>
            <p>*T&Cs may vary.</p>
            <p>**In domestic animals.</p>
        </Row>
        <Row>
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "56.25%",
                        height: 0,
                        overflow: "hidden",
                    }}
                >
                    <iframe
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                        }}
                        src="https://www.youtube.com/embed/kzqZlY88Do0?si=T5lCfpEIg8EWVHha"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                </div>
            </div>
            <p>A pop-up immersive puzzle experience run during Summer 2025 in Kentish Town, North London.</p>
        </Row>
        <div className="mb-8 bg-[url(/lucid-labs-wall.jpg)] bg-cover bg-center">
            <div className="bg-black/80 py-8">
                <div className="container">
                    <p>Lucid Labs is the Dreamcat team's first proper escape room! Explore, solve puzzles, and discover the unexpected...</p>
                    <ul className="list-disc list-inside">
                        <li>Difficulty: 3/5</li>
                        <li>Duration: 2-3 hours</li>
                        <li>Team size: 3-4</li>
                        <li>Age: 3+</li>
                    </ul>
                    <p><InlineLink href="https://morty.app/attraction/62738/lucid-labs">We're on Morty!</InlineLink></p>
                </div>
            </div>
        </div>

        <Row>
            <SectionTitle>Stay in the loop</SectionTitle>
            <p>If you missed your chance to play Lucid Labs, sign up to our <InlineLink href="https://buttondown.email/DreamcatPuzzles">newsletter</InlineLink> to be the first to hear about the next Dreamcat experience!</p>
        </Row>
    </>
}
