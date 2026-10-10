'use client';
import { Button } from "@/app/Button";
import ScanModal, { ScanResponse } from "@/app/game/ScanModal";
import InlineLink from "@/app/InlineLink";
import SignupGate from "@/app/SignupGate";
import { useState } from "react";

export default function ScanCodePage() {
    const [showModal, setShowModal] = useState(false);
    function onCodeScanned(response: ScanResponse) {
        console.log("Scanned!");
        console.log(response);
    }
    return (
        <>
            <SignupGate>
                <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
                    <InlineLink href="/start" size="2xl">
                        ← back
                    </InlineLink>
                    <img src="/duck_photo.png" alt="A duck taking a photo" className="w-32" />
                    <h1 className="text-3xl text-center">Now scan your code</h1>
                    <Button onClick={() => setShowModal(true)}>
                        Scan
                    </Button>

                    {showModal &&
                        <ScanModal showShowMyCodeButton={false} onComplete={onCodeScanned} onClose={() => { setShowModal(false) }} playerId="/" />}
                </main>
            </SignupGate>
        </>)
}