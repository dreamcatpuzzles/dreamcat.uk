import Link from "next/link";

export default function Navbar() {
    return (
        <div role="navigation">
            <ul className="navbar-links">
                <li><Link href="/#portfolio">Our work</Link></li>
                <li><Link href="/event-hire">Events</Link></li>
                <li><Link href="#commissions">Commissions</Link></li>
                <li><Link href="#team">Meet the team</Link></li>
                <li><Link href="https://blog.dreamcat.uk">Blog</Link></li>
                <li><Link href="#contact">Contact us</Link></li>
            </ul>
        </div>

    )
}
