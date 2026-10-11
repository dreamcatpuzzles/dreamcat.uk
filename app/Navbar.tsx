'use client';

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import Link from "./Link";

function NavbarLi({ children }: { children: ReactNode }) {
    return <li className="inline text-center not-last:after:content-['¤'] not-last:after:p-2">{children}</li>
}

export default function Navbar() {
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
        console.log("Mounted navbar")
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
        <div role="navigation" className={cn(hidden ? "top--full" : "top-0", "sticky z-1 bg-midnight py-4 border-b-8 border-grape md:top-0")}>
            <ul className="text-center">
                <NavbarLi><Link className="hover:underline" href="/#portfolio">Our work</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="/events">Events</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#commissions">Commissions</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#team">Meet the team</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="https://blog.dreamcat.uk">Blog</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#contact">Contact us</Link></NavbarLi>
            </ul>
        </div>

    )
}
