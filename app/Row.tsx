import { ReactNode } from "react";
import { cn } from "./cn";

export default function Row({ children, inverted = false, className }: { children: ReactNode, inverted?: boolean, className?: string }) {
    const colours = inverted ? "border-salmon bg-pale text-midnight" : "border-grape bg-midnight text-pale";
    return <div className={cn("mb-8 py-8 border-b-12", colours, className)}>
        <div className="container">
            {children}
        </div>
    </div>
}
