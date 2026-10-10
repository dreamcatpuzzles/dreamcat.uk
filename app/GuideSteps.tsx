"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LinkButton } from "@/app/Button";

const navButtonClass = "absolute bottom-4 text-2xl";

interface GuideStepsProps {
    basePath: string;
    doneHref: string;
    steps: ReactNode[];
}

function GuideStepsContent({ basePath, doneHref, steps }: GuideStepsProps) {
    const router = useRouter();
    const stepParam = Number(useSearchParams().get("step"));
    const step = Number.isInteger(stepParam) && stepParam >= 1 && stepParam <= steps.length
        ? stepParam
        : 1;

    return (
        <main className="container mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-4 pb-20 text-center">
            {steps[step - 1]}
            {step > 1 && (
                <LinkButton
                    theme="secondary"
                    extraClassName="absolute bottom-4 text-2xl left-4"
                    href={`${basePath}?step=${step - 1}`}
                >
                    ← back
                </LinkButton>
            )}
            {step < steps.length ? (
                <LinkButton
                    extraClassName="absolute bottom-4 text-2xl right-4"
                    href={`${basePath}/?step=${step + 1}`}
                >
                    next →
                </LinkButton>
            ) : (
                <LinkButton
                    extraClassName="absolute bottom-4 text-2xl right-4"
                    href={doneHref}
                >
                    let&apos;s go! →
                </LinkButton>
            )}
        </main>
    );
}

export default function GuideSteps(props: GuideStepsProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GuideStepsContent {...props} />
        </Suspense>
    );
}
