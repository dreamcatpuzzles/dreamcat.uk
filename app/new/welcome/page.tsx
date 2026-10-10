"use client";

import { useQuery } from "@tanstack/react-query";
import { apiJson, queryKeys } from "@/app/api";
import { REQUIRED_CONNECTIONS } from "@/app/constants";
import GuideSteps from "@/app/GuideSteps";
import SignupGate from "@/app/SignupGate";
import Duck from "@/app/Duck";

interface SessionPlayer {
    id: string;
    name: string;
}

function WelcomeHeading() {
    const playerQuery = useQuery({
        queryKey: queryKeys.session,
        queryFn: ({ signal }) =>
            apiJson<SessionPlayer>(
                "/api/session",
                { signal },
                "Could not load session",
            ),
        retry: false,
    });
    const playerName = playerQuery.data?.name;

    return (
        <h1 className="text-3xl text-center py-4">
            Welcome{playerName ? `, ${playerName}` : ""}!
        </h1>
    );
}

export default function WelcomePage() {
    return (
        <SignupGate>
        <GuideSteps
            basePath="/new/welcome"
            doneHref="/game"
            steps={[
                <>
                    <Duck key={0} frameLimit={10}/>
                    <WelcomeHeading />
                    <p className="pb-4">It&apos;s great to have you on board.</p>
                    <p className="pb-4">Slip your new ID card into your lanyard.</p>
                    <p className="pb-4">Now you're an official Duck Delivery Consultant!</p>
                </>,
                <>
                    <Duck key={1}/>
                    <p className="pb-4">Oh but wait! It doesn&apos;t look like you&apos;ve got much of a <strong>postal delivery network</strong> yet.</p>
                    <p className="pb-4">That won&apos;t do at all, how can you possibly deliver any post if you don&apos;t know who to deliver it to??</p>
                </>,
                <>
                    <Duck key={2}/>
                    <p className="pb-4">Don&apos;t worry - I can introduce you to some other great people to connect with. I reckon <strong>{REQUIRED_CONNECTIONS} connections</strong> should be enough to get you going.</p>
                    <p className="pb-4">I&apos;m sure you&apos;ll have no problem finding them in the crowd - after all, you&apos;ll have their <strong>self portrait</strong> to go on.</p>
                    <p className="pb-4">They will also get your self-portrait, so they&apos;ll be looking for you too!</p>
                </>,
                <>
                    <Duck key={3}/>
                    <p className="pb-4">Once you&apos;ve found each other, one of you needs to <strong>scan the other&apos;s QR code to form a connection.</strong></p>
                    <p className="pb-4">These initial connections you form will be an important part of your delivery network, so make sure to get acquainted before going on your merry way!</p>
                </>,
                <>
                    <Duck key={4}/>
                    <p className="pb-4">If you want a break or need to leave, you can <b>pause</b> the game via the <b>settings</b> menu.</p>
                    <p className="pb-4">This will temporarily take you out of the game and will stop other players looking for you!</p>
                </>,
                <>
                    <Duck key={5} frameLimit={10}/>
                    <p className="pb-4"><strong>Go get networking!</strong> I&apos;ll be back once you&apos;re ready for some delivery duties!</p>
                </>,
            ]}
        />
        </SignupGate>
    );
}
