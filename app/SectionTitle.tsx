import { ReactNode } from "react";
import { cn } from "./cn";

export default function SectionTitle({ children, className }: { children: ReactNode, inverted?: boolean, className?: string }) {
    return <h2 className={cn("font-bold text-2xl border-b-2 w-full pb-2 mb-4", className)}>
        {children}
    </h2>
}
