import Link from "next/link";

export default function InlineLink({href, children, openInNewTab}: {href: string; children: React.ReactNode; openInNewTab?: boolean}) {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className="underline text-accent-500 hover:text-accent-700"
    >
      {children}
    </Link>
  )
}
