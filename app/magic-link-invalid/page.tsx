"use client";

import InlineLink from "../InlineLink";

export default function MagicLinkInvalidPage() {
    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
            <InlineLink href="/" size="2xl">
                ← back
            </InlineLink>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/duck_drawing.png" alt="A duck drawing a picture" className="w-32" />
            <h1 className="text-3xl text-center py-4">This magic link doesn&apos;t work</h1>
            <p className="pb-4">It may have expired — ask an organiser to make you a new one.</p>
        </div>
    );
}
