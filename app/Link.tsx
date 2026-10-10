import { ReactNode } from "react";
import NextLink from "next/link";

export default function Link({ href, children, className }: { href: string, children: ReactNode, className?: string }) {
    if (href.startsWith("http")) {
        return <NextLink href={href} target="_blank" rel="noopener noreferrer" className={className}>
            { children }
        </NextLink>
    }
    return <NextLink href={href} className={className}>
        { children }
    </NextLink>
}
