import Link from "next/link";

export default function InlineLink({ href, children, size }: { href: string, children: React.ReactNode, size?: string }) {
    if (href.startsWith("https://")) {
        return <Link href={href} className={`absolute top-4 left-4 text-rose-500 hover:underline ${size ? `text-${size}` : ''}`} target="_blank" rel="noopener noreferrer">
            {children}
        </Link>
    }
    return <Link href={href} className={`absolute top-4 left-4 text-rose-500 hover:underline ${size ? `text-${size}` : ''}`}>
        {children}
    </Link>

}
