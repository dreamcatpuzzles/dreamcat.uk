import Link from "next/link";

export default function InlineLink({ href, children, size }: { href: string, children: React.ReactNode, size?: string }) {
    if (href.startsWith("https://")) {
        return <Link href={href} className={`text-berry hover:underline ${size ? `text-${size}` : ''}`} target="_blank" rel="noopener noreferrer">
            {children}
        </Link>
    }
    return <Link href={href} className={`text-berry hover:underline ${size ? `text-${size}` : ''}`}>
        {children}
    </Link>
}

const inlineLinkStyles = "text-salmon font-bold group-hover:underline";

export { inlineLinkStyles };
