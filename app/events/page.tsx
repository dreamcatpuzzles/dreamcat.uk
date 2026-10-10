import { crime_scene, defrag, logo, paint_toolbar, phones } from "@/app/images";
import InlineLink from "@/app/InlineLink";
import Navbar from "@/app/Navbar";
import Row from "@/app/Row";
import SectionTitle from "@/app/SectionTitle";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Events | Dreamcat",
    description: "Hire us for your event!"
}

export default function EventsPage() {
    return (<>
        <Navbar />
        <div className="flex flex-col items-center py-8">
            <Image src={logo} alt="Logo of sleeping cat" height={200} />
            <h1 className="font-bold text-5xl pb-4">Event hire</h1>
        </div>
        <Row inverted>
            <p className="font-bold text-xl text-center">Hire us to make your event a little bit more... mysterious.</p>
            <p className="text-center">Weddings, teambuilding, festivals and private parties.</p>
        </Row>
        <Row>
            <p> The Dreamcat team were amazing to work with, they listened to what we were looking for and worked hard to provide a great, fun team building puzzlehunt! Everyone had a fantastic time and thoroughly enjoyed themselves. <span className="font-bold">Would highly recommend.</span></p>
            <p>--Yee, Risilience (Cambridge)</p>
        </Row>

        <Row inverted>
          <SectionTitle id="contact">Get in touch</SectionTitle>
          <p>Contact us at <InlineLink href="mailto:hi@dreamcat.uk">hi@dreamcat.uk</InlineLink>to learn more or get a quote.</p>
        </Row>
    </>
    )
}