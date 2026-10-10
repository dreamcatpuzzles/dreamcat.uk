import type { Metadata } from "next";
import { Gamja_Flower } from "next/font/google";
import AppQueryProvider from "@/app/QueryProvider";
import GameOverRedirect from "@/app/GameOverRedirect";
import "./globals.css";

const gamjaFlower = Gamja_Flower({
  variable: "--font-gamja-flower",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Special Ducklivery",
  description: "A game about bad art, and ducks",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${gamjaFlower.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppQueryProvider>
          <GameOverRedirect />
          {children}
        </AppQueryProvider>
      </body>
    </html>
  );
}
