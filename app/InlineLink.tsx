import { cn } from "./cn";
import Link from "./Link";

const inlineLinkStyles = "text-salmon font-bold hover:underline group-hover:underline";

export default function InlineLink({ href, children, size }: { href: string, children: React.ReactNode, size?: string }) {
    return <Link href={href} className={cn(inlineLinkStyles, size ? `text-${size}` : '')}>
        {children}
    </Link>
}

export { inlineLinkStyles };
