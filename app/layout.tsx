import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import InlineLink from "./InlineLink";
import { terpeca_2025 } from "./images";
import Image from "next/image";
import Row from "./Row";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "Dreamcat: Home",
  description: "We make cool stuff. Nice of you to visit!",
};

function Footer() {
  return (
    <Row inverted>
      <div className="flex flex-col items-center">
        <div className="pb-2">
          <InlineLink href="https://mastodon.me.uk/@dreamcat">Mastodon</InlineLink>
          {" "}| <InlineLink href="https://bsky.app/profile/dreamcatpuzzles.bsky.social">Bluesky</InlineLink>
          {" "}| <InlineLink href="https://www.linkedin.com/company/dreamcat-puzzles">LinkedIn</InlineLink>
          {" "}| <InlineLink href="https://www.instagram.com/dreamcat.puzzles">Instagram</InlineLink>
          {" "}| <InlineLink href="https://buttondown.email/DreamcatPuzzles">Newsletter</InlineLink>
        </div>
        <Image src={terpeca_2025} alt="Top Escape Rooms Project Enthusiasts' Choice Awards (TERPECA) 2025 Nominee badge" height={200} className="text-center" />
      </div>
    </Row>
  )
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
