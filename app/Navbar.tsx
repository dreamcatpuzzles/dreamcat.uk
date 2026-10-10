import Link from "./Link";
import { ReactNode } from "react";

function NavbarLi({ children }: { children: ReactNode }) {
    return <li className="inline text-center not-last:after:content-['¤'] not-last:after:p-2">{children}</li>
}

export default function Navbar() {
    return (
        <div role="navigation" className="sticky top-0 bg-midnight py-4 border-b-8 border-grape">
            <ul className="text-center">
                <NavbarLi><Link className="hover:underline" href="/#portfolio">Our work</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="/event-hire">Events</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#commissions">Commissions</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#team">Meet the team</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="https://blog.dreamcat.uk">Blog</Link></NavbarLi>
                <NavbarLi><Link className="hover:underline" href="#contact">Contact us</Link></NavbarLi>
            </ul>
        </div>

    )
}
