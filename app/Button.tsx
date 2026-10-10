import Link from "next/link";

type ButtonTheme = "primary" | "secondary";

function standardClassNames(theme: ButtonTheme) {
    return `inline-flex cursor-pointer items-center justify-center gap-2 lowercase mt-2 rounded border px-4 py-2 ${theme === "secondary"
        ? "border border-rose-500 bg-amber-100 hover:bg-amber-200 text-gray-900"
        : "bg-rose-500 text-gray-50 hover:bg-rose-600"
        } disabled:opacity-50`;
}

function Button({ children, onClick, disabled, type = "button", theme = "primary", className = "", ariaLabel }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; theme?: ButtonTheme, type?: "button" | "submit" | "reset", className?: string, ariaLabel?: string }) {
    return (
        <button
            className={`${standardClassNames(theme)} ${className}`}
            onClick={onClick}
            disabled={disabled}
            type={type}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

function LabelButton({ children, onClick, disabled, theme = "primary" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; theme?: ButtonTheme }) {
    return (
        <label
            className={standardClassNames(theme)}
            onClick={onClick}
        >
            {children}
        </label>
    );
}

function LinkButton({ children, href, theme = "primary", extraClassName }: { children: React.ReactNode; href: string; theme?: ButtonTheme, extraClassName?: string }) {
    return (
        <Link href={href} className={`${standardClassNames(theme)} ${extraClassName}`}>
            {children}
        </Link>
    );
}

export { Button, LabelButton, LinkButton };
