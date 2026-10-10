"use client";

import Link from "next/link";
import InlineLink from "../InlineLink";
import SignupGate from "../SignupGate";

export default function InstructionsPage() {
    return (
        <SignupGate>
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
            <InlineLink href="/" size="2xl">
                ← back
            </InlineLink>
            <img src="/duck_drawing.png" alt="A duck drawing a picture" className="w-32" />
            <h1 className="text-3xl text-center py-4">Let&apos;s get started</h1>
            <p className="pb-4">Draw a self-portrait of yourself on one of the provided slips of paper.</p>
            <p className="pb-4">This image will be used by others to identify you, so:</p>
            <ul className="list-disc list-inside pb-4">
                <li>Try to make it look like you do today, including colour of clothing</li>
                <li>Use your selfie camera to make sure it's a good likeness</li>
                <li>Do not write your name on the photo</li>
            </ul>
            <p className="pb-4">If you&apos;re having problems let Michael or Sarah know.</p>
            <Link href="/new/upload-photo" className="bg-rose-500 text-white py-2 px-4 rounded hover:bg-rose-600">
                i&apos;m done drawing!
            </Link>
        </div>
        </SignupGate>
    );
}
