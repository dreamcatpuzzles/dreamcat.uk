import { cn } from "@/src/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function Navbar({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const lastKnownScrollPosition = useRef(0);
    const ticking = useRef<boolean>(false);
    function checkShowNavbar(scrollPos: number) {
        if (lastKnownScrollPosition.current > scrollPos) {
            setHidden(false);
        } else {
            setHidden(true);
        }
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

    return (<div
        role="navigation"
        className={cn(
            hidden ? "top--full" : "top-0",
            "md:top-0 sticky z-1 bg-midnight py-4 border-b-8 border-grape",
        )}
    >{children}</div>)

}
