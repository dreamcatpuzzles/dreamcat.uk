import { cn } from "@/src/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function Navbar({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const lastKnownScrollPosition = useRef(0);
    const ticking = useRef<boolean>(false);
    function checkShowNavbar(scrollPos: number) {
        if (lastKnownScrollPosition.current > scrollPos) {
            setHidden(false);
        } else if (lastKnownScrollPosition.current < scrollPos) {
            setHidden(true);
        }
    }

    function closeMenu() {
        lastKnownScrollPosition.current = window.scrollY;
        setHidden(false);
        setMenuOpen(false);
    }

    useEffect(() => {
        document.addEventListener("scroll", () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    checkShowNavbar(window.scrollY);
                    ticking.current = false;
                    lastKnownScrollPosition.current = window.scrollY;
                });
                ticking.current = true;
            }
        });
    }, []);

    return (
        <nav
            className={cn(
                (hidden && !menuOpen) ? "top--full" : "top-0",
                "sticky z-1 bg-midnight py-4 border-b-8 border-grape",
            )}
            onClick={(event) => {
                if (menuOpen && event.target instanceof Element && event.target.closest("a")) {
                    closeMenu();
                }
            }}
        >
            <div
                className="group relative max-w-[950px] m-auto px-8"
                data-menu-open={menuOpen}
            >
                <button
                    type="button"
                    className="absolute right-8 top-0 p-1 cursor-pointer hover:opacity-75 sm:hidden"
                    aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={menuOpen}
                    aria-controls="primary-navigation"
                    onClick={() => {
                        if (menuOpen) {
                            closeMenu();
                        } else {
                            lastKnownScrollPosition.current = window.scrollY;
                            setMenuOpen(true);
                        }
                    }}
                >
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        {menuOpen ? (
                            <path d="M6 6l12 12M18 6L6 18" />
                        ) : (
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        )}
                    </svg>
                </button>
                {children}
            </div>
        </nav>
    );

}
