"use client";

import Duck from "@/app/Duck";
import GuideSteps from "@/app/GuideSteps";
import SignupGate from "@/app/SignupGate";

export default function DeliveryGuidePage() {
    return (
        <SignupGate>
        <GuideSteps
            basePath="/new/deliveries"
            doneHref="/game"
            steps={[
                <>
                    <Duck key={1} frameLimit={10}></Duck>
                    <h1 className="text-3xl text-center py-4">Great job!</h1>
                    <p className="pb-4">Now you&apos;ve built up your network, it&apos;s time to deliver some ducks!</p>
                </>,
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/duck_parcel.png" alt="A duck holding a parcel" className="w-32" />
                    <p className="pb-4">Head to your local Post Office and the postmaster will give you a package.</p>
                    <p className="pb-4">Scan the package&apos;s QR code to begin your delivery.</p>
                </>,
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/letters.png" alt="A stack of letters" className="w-32" />
                    <p className="pb-4">Our highly technological delivery system has pre-planned a route for your package to take.</p>
                    <p className="pb-4">It will need to stop off at several people on its way to the ultimate destination.</p>
                    <p className="pb-4"><strong>Hold on to the package throughout the journey</strong>, don&apos;t give it away!</p>
                </>,
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/duck_photo.png" alt="A duck taking a selfie" className="w-32" />
                    <p className="pb-4">Once you&apos;ve found the first person and scanned their QR code, the system will then reveal who to take the package to next.</p>
                    <p className="pb-4">It might not be someone you&apos;ve met... but hopefully your new friend will be able to help introduce you!</p>
                </>,
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/duck_photo.png" alt="A duck taking a selfie" className="w-32" />
                    <p className="pb-4">Finally, you&apos;ll be asked to take some <b>photos</b> for your <b>proof of delivery</b>.</p>
                    <p className="pb-4">This photos will show on the screens around the venue, so please don&apos;t take photos of people without consent!</p>
                </>,
                <>
                    <Duck key={2} frameLimit={5}></Duck>
                    <p className="pb-4">That&apos;s it! Good luck, and happy delivering!</p>
                </>,
            ]}
        />
        </SignupGate>
    );
}
