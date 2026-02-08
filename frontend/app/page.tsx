import {Suspense} from 'react'
import Link from 'next/link'
import {PortableText} from '@portabletext/react'

import {AllPosts} from '@/app/components/Posts'
import {settingsQuery} from '@/sanity/lib/queries'
import {sanityFetch} from '@/sanity/lib/live'
import Image from 'next/image'
import {dataAttr} from '@/sanity/lib/utils'

function ListSeparator() {
  return <span className="px-4">¤</span>
}

export default async function Page() {
  const {data: settings} = await sanityFetch({
    query: settingsQuery,
  })

  return (
    <>
      <div className="flex flex-col items-center text-center gap-4 py-4 bg-primary">
        <Link href="/">
          <div className="bg-[url(/images/dreamcat.gif)] bg-no-repeat w-[200px] h-[200px] bg-[length:200px_200px]"></div>
        </Link>
        <h1 className="text-4xl font-bold text-pale">Hi! We&apos;re Dreamcat.</h1>
      </div>
      <div className="bg-pale border-b-accent-400 border-b-12">
        <div className="container py-4 flex flex-row justify-between items-center">
          <div>
            {settings?.description && (
              <div
                data-sanity={dataAttr({
                  id: settings._id,
                  type: 'settings',
                  path: 'description',
                }).toString()}
              >
                <PortableText value={settings.description} />
              </div>
            )}
            <p>Intrigued? Then we&apos;re going to get along very nicely.</p>
          </div>
          <div className="">
            <Link
              href="https://twitter.com/DreamcatPuzzles"
              className="py-8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/images/twitter.webp" alt="Twitter" width="45" height="45" />
            </Link>
            <Link
              href="https://www.instagram.com/dreamcat.puzzles/"
              className="py-8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/images/instagram.png" alt="Instagram" width="45" height="45" />
            </Link>
            <Link
              href="https://mastodon.me.uk/@dreamcat"
              className="py-8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/images/mastodon.png" alt="Mastodon" width="45" height="45" />
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-primary border-b-12 border-secondary" id="navbar" role="navigation">
        <div className="container">
            <ul className="p-4 flex flex-row justify-center items-center text-pale">
            <li>
              <Link href="#portfolio">Our work</Link><ListSeparator />
            </li>
            <li>
              <Link href="/event-hire">Events</Link><ListSeparator />
            </li>
            <li>
              <Link href="#commissions">Commissions</Link><ListSeparator />
            </li>
            <li>
              <Link href="#team">Meet the team</Link><ListSeparator />
            </li>
            <li>
              <Link href="https://blog.dreamcat.uk">Blog</Link><ListSeparator />
            </li>
            <li>
              <Link href="#contact">Contact us</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="row">
        <div className="container">
          <h2 id="portfolio">Our games</h2>
          <div className="portfolio">
            <div className="portfolio-item portfolio-placeholder"></div>
            <div className="portfolio-item">
              <Link href="/lucid-labs">
                <Image
                  src="/images/lucid-labs.png"
                  alt="Lucid Labs logo, concentric multicoloured circles"
                  width={300}
                  height={300}
                />
                <h3>Lucid Labs (2025)</h3>
              </Link>
              <i>
                &ldquo;Lucidation protocol online. System activates in three... two... one...&rdquo;
              </i>
            </div>
            <div className="portfolio-item portfolio-placeholder"></div>
            <div className="portfolio-item">
              <Link href="/wizard-of-os">
                <Image
                  src="/images/book.png"
                  alt="Pixel art book with question mark cover"
                  width={300}
                  height={300}
                />
                <h3>The Wizard of OS (2024)</h3>
              </Link>
              <i>
                &ldquo;Hello! It looks like you&apos;re trying
                <br />
                to solve my murder...&rdquo;
              </i>
            </div>
            <div className="portfolio-item">
              <Link href="/octonet">
                <Image src="/images/octonet.jpg" alt="OCTONET" width={300} height={300} />
                <h3>OCTONET (2022)</h3>
              </Link>
              <i>Untangle a corporate conspiracy.</i>
            </div>
            <div className="portfolio-item">
              <Link href="/dreamcatcher">
                <Image src="/images/dreamcatcher.jpg" alt="Dreamcatcher" width={300} height={300} />
                <h3>Dreamcatcher (2018)</h3>
              </Link>
              <i>The Machine thinks. But it needs dreams.</i>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="container">
          <h2 id="collaborations">Our collaborations</h2>
          <div className="portfolio">
            <div className="portfolio-item">
              <Link href="https://www.thekeyofdreams.co.uk" target="_blank" rel="noreferrer">
                <Image
                  src="/images/key-of-dreams.jpeg"
                  alt="Key of Dreams"
                  width={300}
                  height={300}
                />
                <h3>The Key of Dreams (2024-)</h3>
              </Link>
              <span>
                A theatre experience inspired by classic works of gothic and cosmic horror.
              </span>
            </div>
            <div className="portfolio-item">
              <Link href="https://locksmithsdream.com" target="_blank" rel="noreferrer">
                <Image
                  src="/images/locksmiths-dream.png"
                  alt="Dreamcatcher"
                  width={300}
                  height={300}
                />
                <h3>The Locksmith&apos;s Dream (2022-)</h3>
              </Link>
              <span>Puzzle design for an immersive theatre experience like no other.</span>
            </div>
            <div className="portfolio-item">
              <Link
                href="https://audioboom.com/posts/7921770-the-wishing-fish-clock"
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src="/images/town-that-knew-too-much.jpg"
                  alt="Wishing Fish Clock"
                  width={300}
                  height={300}
                />
                <h3>The Town that Knew Too Much (2021)</h3>
              </Link>
              <span>A secret message hidden in a podcast about the 1979 book Masquerade.</span>
            </div>
          </div>
        </div>
      </div>
      <div className="row row-inverted">
        <div className="container">
          <h2 id="events">Events</h2>
          <p>
            Want your event to be memorable? We&apos;ll run one of our puzzlehunts to fit in with
            your event. <Link href="event-hire">Find out more!</Link>
          </p>
          <blockquote>
            <p>
              ...Everyone had a fantastic time and thoroughly enjoyed themselves. Would highly
              recommend.
            </p>
            <footer>&mdash; Yee, Risilience (Cambridge)</footer>
          </blockquote>
        </div>
        <div className="container hero">
          <Image src="/images/event_crowd.jpg" alt="Event crowd" width={300} height={300} />
        </div>
      </div>
      <div className="row">
        <div className="container">
          <h2 id="commissions">Commissions and Partnerships</h2>
          <p>
            We don&apos;t just work alone. We&apos;ll work with you to design an experience that
            will knock guests&apos; socks off.
          </p>
          <p>
            Our approach: understand your audience, figure out what they find fun, do our own
            reading and research, and turn all of that into a series of puzzles that integrate
            seamlessly with the rest of your experience.
          </p>
          <p>
            Not everybody is an expert at puzzles, so we always tailor experiences to complement the
            rest of the event, and ensure that they are fun for everyone in the audience, regardless
            of age or puzzling experience.
          </p>
          <p>
            To find out more about our design process, head over to{' '}
            <Link href="https://blog.dreamcat.uk" target="_blank" rel="noreferrer">
              our blog
            </Link>
            , and have a look at <Link href="#collaborations">our past collaborations</Link>.
          </p>
        </div>
        <div className="container hero">
          <Image src="/images/dinosboard.jpg" alt="Dinosaur board game" width={300} height={300} />
        </div>
        <div className="row row-inverted">
          <div className="container">
            <h2 id="team">Meet the team</h2>
            <div className="portfolio">
              <div className="portfolio-item">
                <Image
                  src="/images/sarah.jpg"
                  alt="Headshot of Sarah Binney"
                  width={300}
                  height={300}
                />
                <h3>Sarah Binney</h3>
                <i>Chief Paperclip Duplicator</i>
                <p>
                  As a child, Sarah used to spend hours on end watching the clocks in John Lewis
                  while her mum got the shopping done.
                </p>
                <p>
                  Some time later, having completed her dissertation on the history of horology, she
                  moved on to electronic tinkering, creative writing and puzzle design.
                </p>
                <p>She still thinks clocks are pretty neat, though.</p>
              </div>
              <div className="portfolio-item">
                <Image
                  src="/images/michael.jpg"
                  alt="Headshot of Michael Kearns"
                  width={300}
                  height={300}
                />
                <h3>Michael Kearns</h3>
                <i>Director of Paperclip Counting</i>
                <p>
                  Since a young age Michael has been fascinated by puzzles, scribbling sprawling
                  mazes on paper (and sometimes the walls).
                </p>
                <p>
                  He has since learnt to code, and keeps himself occupied building experiences —
                  digital and physical — for people to enjoy.
                </p>
              </div>
              <div className="portfolio-item">
                <Image
                  src="/images/catalin.jpg"
                  alt="Headshot of Catalin Ursachi"
                  width={300}
                  height={300}
                />
                <h3>Catalin Ursachi</h3>
                <i>Principal Paperclip De-duplicator</i>
                <p>
                  Always fascinated by science, history, logic, and more generally anything which
                  makes the world tick, Catalin started off with a degree in physics and a
                  smattering of philosophy.
                </p>
                <p>
                  He then proceeded to channel his curiosity into the more practical pursuits of
                  software engineering, project management, and puzzle design.
                </p>
              </div>
              <div className="portfolio-item">
                <Image src="/images/ben.jpg" alt="Headshot of Ben Below" width={300} height={300} />
                <h3>Ben Below</h3>
                <i>Head of Multiplayer Solitaire</i>
              </div>
              <div className="portfolio-item">
                <Image
                  src="/images/harry.jpg"
                  alt="Headshot of Harry Cummings"
                  width={300}
                  height={300}
                />
                <h3>Harry Cummings</h3>
                <i>Non-Denominational Nerd</i>
              </div>
              <div className="portfolio-item">
                <Image
                  src="/images/wendi.jpg"
                  alt="Headshot of Wendi Fan"
                  width={300}
                  height={300}
                />
                <h3>Wendi Fan</h3>
                <i>Resident Hobby Hoarder & Maker without Borders</i>
              </div>
            </div>
          </div>
          <div className="container hero">
            <Image src="/images/event_cafe.jpg" alt="Event cafe" width={300} height={300} />
          </div>
        </div>
        <div className="row">
          <div className="container">
            <h2 id="contact">Get in touch</h2>
            <p>
              Interested in what we do? Drop us a line at
              <Link href="mailto:hi@dreamcat.uk">hi@dreamcat.uk</Link>, we love to talk about
              puzzles!
            </p>
          </div>
          <div className="container hero">
            <Image src="/images/dreamcatchers.jpg" alt="Dreamcatchers" width={300} height={300} />
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="container">
            <aside className="py-12 sm:py-20">
              <Suspense>{await AllPosts()}</Suspense>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
