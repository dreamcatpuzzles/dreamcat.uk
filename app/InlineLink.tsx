import { cn } from "./cn";
import Link from "./Link";

const inlineLinkStyles = "text-salmon font-bold hover:underline group-hover:underline";

export default function InlineLink({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) {
    return <Link href={href} className={cn(inlineLinkStyles, className)}>
        {children}
    </Link>
}

export { inlineLinkStyles };
