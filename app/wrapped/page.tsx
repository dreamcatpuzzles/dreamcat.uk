"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiJson } from "@/app/api";
import { Button } from "@/app/Button";

interface LeaderboardRow {
  position: number;
  id: string;
  name: string;
  connections: number;
  deliveries: number;
  you: boolean;
}

interface WrappedData {
  name: string;
  profilePictureUrl: string;
  connectionCount: number;
  connectionPictures: string[];
  deliveriesCompleted: number;
  deliveryStops: number;
  challengesCompleted: number;
  leaderboard: LeaderboardRow[];
  photos: { imageUrl: string; otherPictureUrl: string | null }[];
}

const FINALE_DUCKS = [
  "/captcha/duck/duck.png",
  "/puzzled_duck.png",
  "/duck_parcel.png",
  "/duck_drawing.png",
  "/duck_mistake.png",
];

// Repeat a list until it fills the marquee so the loop never shows a gap.
function repeated<T>(items: T[], minimum: number): T[] {
  if (items.length === 0) return items;
  const output: T[] = [];
  while (output.length < minimum) output.push(...items);
  return output;
}

function Marquee({ pictures, reverse = false, imageClassName = "h-24 w-24 shrink-0 rounded-full object-cover" }: {
  pictures: string[];
  reverse?: boolean;
  imageClassName?: string;
}) {
  const items = repeated(pictures, 10);
  return (
    <div className="w-full overflow-hidden">
      <div className={`flex w-max gap-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {[...items, ...items].map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={index}
            src={url}
            alt=""
            className={imageClassName}
          />
        ))}
      </div>
    </div>
  );
}

function PhotoCarousel({ photos }: { photos: WrappedData["photos"] }) {
  const [index, setIndex] = useState(0);
  const move = (delta: number) => {
    setIndex((current) => Math.max(0, Math.min(photos.length - 1, current + delta)));
  };
  const arrowClass = "flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-2xl text-white disabled:opacity-40";
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {photos.map((photo, photoIndex) => (
          <div key={photoIndex} className="flex w-full shrink-0 justify-center px-4 pb-10">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt="A memory"
                className="max-h-[50dvh] max-w-full rounded-2xl object-contain shadow"
              />
              {photo.otherPictureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.otherPictureUrl}
                  alt="The player you shared this with"
                  className="absolute bottom-0 left-1/2 h-20 w-20 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-amber-100 object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-6 text-2xl">
        <button type="button" aria-label="Previous photo" disabled={index === 0} onClick={() => move(-1)} className={arrowClass}>&lt;</button>
        <span>{index + 1}/{photos.length}</span>
        <button type="button" aria-label="Next photo" disabled={index === photos.length - 1} onClick={() => move(1)} className={arrowClass}>&gt;</button>
      </div>
    </div>
  );
}

function FloatingDucks({ images }: { images: string[] }) {
  const elementRefs = useRef<(HTMLImageElement | null)[]>([]);
  // Two of each image float around.
  const doubled = useMemo(() => images.flatMap((src) => [src, src]), [images]);
  useEffect(() => {
    const SIZE = 112;
    // 25–70px/s per axis: similar pace to the old marquee, but no axis can
    // crawl so slowly that a duck lingers on an edge before wrapping.
    const component = () => (25 + Math.random() * 45) * (Math.random() < 0.5 ? -1 : 1);
    const ducks = doubled.map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      dx: component(),
      dy: component(),
    }));
    let last = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // Wrap bounds are the screen plus one duck on each side, so a duck is
      // fully out of view before it reappears on the opposite edge.
      const width = window.innerWidth + SIZE * 2;
      const height = window.innerHeight + SIZE * 2;
      ducks.forEach((duck, index) => {
        duck.x = (((duck.x + duck.dx * dt + SIZE) % width) + width) % width - SIZE;
        duck.y = (((duck.y + duck.dy * dt + SIZE) % height) + height) % height - SIZE;
        elementRefs.current[index]?.style.setProperty(
          "transform",
          `translate3d(${duck.x}px, ${duck.y}px, 0)`,
        );
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [doubled]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
      {doubled.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          ref={(element) => { elementRefs.current[index] = element; }}
          src={src}
          alt=""
          className="absolute left-0 top-0 h-28 w-28 object-contain"
        />
      ))}
    </div>
  );
}

function SnapIcon({ src, index }: { src: string; index: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-8 w-8 animate-icon-snap object-contain"
      // Stagger each icon by a fixed offset so they don't all snap in sync.
      style={{ animationDelay: `${-((index * 53) % 120) / 100}s` }}
    />
  );
}

function SnapRow({ src, count }: { src: string; count: number }) {
  if (count <= 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Array.from({ length: count }, (_, index) => (
        <SnapIcon key={index} src={src} index={index} />
      ))}
    </div>
  );
}

export default function WrappedPage() {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wrapped"],
    queryFn: () => apiJson<WrappedData>("/api/wrapped"),
    retry: false,
  });
  const sendFeedback = useMutation({
    mutationFn: () =>
      apiJson("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: feedback }),
      }),
    onSuccess: () => setFeedbackSent(true),
  });

  const goBack = () => {
    if (screen === 0) router.push("/game");
    else setScreen(screen - 1);
  };

  let content: ReactNode;
  if (isLoading) {
    content = <p className="text-2xl">Wrapping it up…</p>;
  } else if (isError || !data) {
    content = (
      <p className="max-w-md text-2xl">
        Sorry, you need to still be logged in to see wrapped! Ask your GM for help.
      </p>
    );
  } else if (screen === 0) {
    content = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.profilePictureUrl}
          alt={data.name}
          className="h-40 w-40 rounded-full object-cover shadow-lg"
        />
        <h1 className="text-4xl">Congratulations, {data.name}!</h1>
        <p className="text-2xl">
          You sure did a lot of networking: you made {data.connectionCount} connections!
        </p>
        {data.connectionPictures.length > 0 && (
          <Marquee pictures={data.connectionPictures} />
        )}
        <Button onClick={() => setScreen(1)}>tell me more</Button>
      </>
    );
  } else if (screen === 1) {
    content = (
      <>
        <p className="text-4xl">You:</p>
        <ul className="space-y-4 text-left text-2xl">
          <li>
            - delivered {data.deliveriesCompleted} packages
            <SnapRow src="/duck_icon.svg" count={data.deliveriesCompleted} />
          </li>
          <li>
            - across {data.deliveryStops} delivery stops
            <SnapRow src="/person_icon.svg" count={data.deliveryStops} />
          </li>
          <li>
            - completed {data.challengesCompleted} challenges
            <SnapRow src="/letters.png" count={data.challengesCompleted} />
          </li>
        </ul>
        <Button onClick={() => setScreen(2)}>but did i win?</Button>
      </>
    );
  } else if (screen === 2) {
    content = (
      <>
        <p className="text-3xl">Oh so you&rsquo;re competitive, eh?</p>
        <p className="text-2xl">Here&rsquo;s where you are on the connection leaderboard:</p>
        <div className="max-h-[50dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-lg">
            <thead>
              <tr className="border-b">
                <th className="p-2">#</th>
                <th className="p-2">name</th>
                <th className="p-2">connections</th>
                <th className="p-2">deliveries</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((row) => (
                <tr key={row.id} className={row.you ? "bg-rose-200 font-bold" : ""}>
                  <td className="p-2">{row.position}</td>
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.connections}</td>
                  <td className="p-2">{row.deliveries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={() => setScreen(3)}>actually i care more about the friends i made along the way</Button>
      </>
    );
  } else if (screen === 3) {
    content = (
      <>
        <p className="text-3xl">Aw, shucks! Well you sure had a time:</p>
        {data.photos.length > 0 ? (
          <PhotoCarousel photos={data.photos} />
        ) : (
          <p className="text-xl">You didn&rsquo;t take any photos!</p>
        )}
        <p className="text-lg">Tap &lt; or &gt; to view your memories</p>
        <Button onClick={() => setScreen(4)}>thanks for all the ducks</Button>
      </>
    );
  } else if (screen === 4) {
    content = (
      <>
        <FloatingDucks images={FINALE_DUCKS} />
        <p className="relative text-4xl">Quack! Thanks for playing!</p>
        <Button className="relative" onClick={() => setScreen(5)}>leave feedback</Button>
      </>
    );
  } else {
    content = feedbackSent ? (
      <p className="text-3xl">Thanks for the feedback!</p>
    ) : (
      <>
        <p className="text-3xl">What did you think of the game? We&rsquo;d love to know!</p>
        <p className="text-xl">Comments are anonymous by default.</p>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={5}
          className="w-full max-w-md rounded-xl border border-rose-300 bg-white p-3 text-left text-xl"
        />
        {sendFeedback.error && (
          <p role="alert" className="text-red-700">{sendFeedback.error.message}</p>
        )}
        <Button
          onClick={() => sendFeedback.mutate()}
          disabled={!feedback.trim() || sendFeedback.isPending}
        >
          {sendFeedback.isPending ? "sending…" : "submit"}
        </Button>
      </>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden p-6 pb-20 text-center">
      {content}
      <Button
        theme="secondary"
        className="fixed bottom-4 left-4 z-10"
        onClick={goBack}
      >
        back
      </Button>
    </main>
  );
}
