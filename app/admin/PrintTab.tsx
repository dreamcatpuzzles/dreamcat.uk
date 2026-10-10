"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import QRCode from "react-qr-code";
import { apiJson, queryKeys } from "@/app/api";
import type { Package } from "@/app/admin/types";
import { PuzzleGrid, type Puzzle } from "./PuzzlesTab";
import ChallengeCard from "./ChallengeCard";
import { Button } from "../Button";

const ID_SUFFIX_LENGTH = 5;
const DEFAULT_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BADGES_PER_SHEET = 8;
const CODES_PER_SHEET = 24;
// Position of the QR placeholder image (id="image1") inside the 90x60mm
// template, inset a little so the QR code keeps a quiet zone.
const QR_BOX = { left: "4.34mm", top: "35mm", width: "21.50mm", height: "21.50mm" };

const PRINT_CSS = `
    @page { size: A4; margin: 0; }
    @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
        }
    }
    .print-sheet {
        width: 210mm;
        height: 297mm;
        display: grid;
        gap: 5mm;
        place-content: center;
        background: #ffffff;
        break-after: page;
    }
    .print-sheet:last-child { break-after: auto; }
    @media screen {
        .print-sheet {
            margin: 8mm auto;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
        }
    }
`;

const LANYARD_CSS = `${PRINT_CSS}
    @font-face {
        font-family: "Dealerplate";
        src: url("/dealerplate%20california.otf") format("opentype");
    }
    .lanyard-sheet {
        grid-template-columns: repeat(2, 90mm);
        grid-auto-rows: 60mm;
    }
    .badge { position: relative; width: 90mm; height: 60mm; }
    .badge-art svg { display: block; }
    .badge-qr { position: absolute; display: block; }
`;

const PACKAGE_CSS = `${PRINT_CSS}
    .package-sheet {
        grid-template-columns: repeat(4, 40mm);
        grid-auto-rows: 40mm;
    }
    .package-code {
        width: 50mm;
        height: 40mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.8mm;
        color: #000000;
    }
    .package-qr { display: block; width: 40mm; height: 40mm; }
    .package-id { font-size: 5mm; line-height: 1; }
`;

const CHALLENGE_CSS = `${PRINT_CSS}
    @font-face {
        font-family: "Dealerplate";
        src: url("/dealerplate%20california.otf") format("opentype");
    }
    .challenge-sheet {
        grid-template-columns: repeat(2, 100mm);
        grid-auto-rows: 55mm;
    }
    .challenge-location {
        font-family: "Dealerplate", monospace;
    }
    .challenge-puzzle {
        background-color: #fff6d5;
        color: #220055;
    }
    .challenge-creative {
        background-color: #fff6d5;
        color: #d40055;
    }
    .challenge-creative .challenge-highlight {
        background-color: #d40055;
    }
    .challenge-toastcard {
        background-color: #fff6d5;
        color: #8b5a2b;
    }
    .challenge-toastcard .challenge-highlight {
        background-color: #8b5a2b;
    }
    .challenge-puzzle .challenge-highlight {
        background-color: #220055;
    }
`;

const CAPTCHA_CSS = `${PRINT_CSS}
    .captcha-sheet {
        padding: 12mm;
        gap: 0;
        grid-template-rows: auto 1fr;
        place-content: stretch;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .captcha-title {
        text-align: center;
        font-size: 24mm;
        color: #220055;
        line-height: 100px
    }
    .captcha-grid-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
    }
    .captcha-grid-wrap > * {
        width: 100%;
        max-width: 186mm;
    }
`;

interface LanyardTemplate {
    inner: string;
    idText: string;
}

interface PrintTabProps {
    takenIds: Set<string>;
    packages: Package[];
}

function escapeXml(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// The template is ~1MB of embedded images, so it is injected once into a
// shared <defs> and cloned per badge with <use>; only the id text varies.
function prepareTemplate(svg: string): LanyardTemplate {
    const idText = svg.match(/<text\b[^>]*\bid="text8"[\s\S]*?<\/text>/)?.[0] ?? "";
    const inner = svg
        .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
        .replace(/<\/svg>\s*$/, "")
        .replace(/<image\b[^>]*\bid="image1"[^>]*\/>/, "")
        .replace(/<text\b[^>]*\bid="text8"[\s\S]*?<\/text>/, "");
    return { inner, idText };
}

function badgeSvg(idText: string, id: string) {
    const text = idText.replace(">ABCDE<", `>${escapeXml(id)}<`);
    return `<svg viewBox="0 0 90 60" width="90mm" height="60mm">` +
        `<use href="#lanyard-badge"/>${text}</svg>`;
}

function generateIds(count: number, characters: string, takenIds: Set<string>, prefix = "") {
    const alphabet = [...new Set([...characters])];
    const target = Math.max(0, Math.min(count, alphabet.length ** ID_SUFFIX_LENGTH));
    const seen = new Set<string>();
    const ids: string[] = [];
    let attempts = 0;
    const maxAttempts = Math.max(target * 20, 1000);
    while (ids.length < target && attempts < maxAttempts) {
        attempts += 1;
        let id = prefix;
        for (let i = 0; i < ID_SUFFIX_LENGTH; i += 1) {
            id += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        const upper = id.toUpperCase();
        if (seen.has(upper) || takenIds.has(upper)) continue;
        seen.add(upper);
        ids.push(id);
    }
    return ids;
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function GenerateForm({ noun, onGenerate }: {
    noun: string;
    onGenerate: (count: number, characters: string) => void;
}) {
    const [countInput, setCountInput] = useState("24");
    const [characters, setCharacters] = useState(DEFAULT_CHARACTERS);

    const count = Number(countInput);
    const alphabetSize = new Set([...characters]).size;
    const possible = alphabetSize ** ID_SUFFIX_LENGTH;
    const valid = alphabetSize > 0 && Number.isSafeInteger(count) && count > 0;

    return (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-gray-800 p-5 shadow">
            <div>
                <label className="block" htmlFor={`print-${noun}-count`}>
                    How many {noun} to generate for
                </label>
                <input
                    id={`print-${noun}-count`}
                    type="number"
                    min={1}
                    step={1}
                    value={countInput}
                    onChange={(event) => setCountInput(event.target.value)}
                    className="mt-2 w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                />
            </div>
            <div>
                <label className="block" htmlFor={`print-${noun}-characters`}>
                    Characters to use in ids
                </label>
                <input
                    id={`print-${noun}-characters`}
                    type="text"
                    value={characters}
                    onChange={(event) => setCharacters(event.target.value)}
                    className="mt-2 w-full rounded border border-gray-600 bg-gray-700 p-2 font-mono text-gray-100"
                />
                {valid && count > possible && (
                    <p className="mt-2 text-amber-300">
                        Only {possible} unique ids are possible with these
                        characters.
                    </p>
                )}
            </div>
            <button
                type="button"
                disabled={!valid}
                onClick={() => onGenerate(count, characters)}
                className="rounded bg-rose-500 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                generate
            </button>
        </section>
    );
}

function PrintArea({ styles, children }: { styles: string; children: ReactNode }) {
    return (
        <div className="mt-6">
            <button
                type="button"
                onClick={() => window.print()}
                className="mx-auto mb-4 block rounded bg-rose-500 px-5 py-2 text-white"
            >
                print
            </button>
            <div className="print-area bg-white p-4">
                <style>{styles}</style>
                {children}
            </div>
        </div>
    );
}

function PlayerCodes({ ids, takenIds, onIds }: {
    ids: string[];
    takenIds: Set<string>;
    onIds: (ids: string[]) => void;
}) {
    const [template, setTemplate] = useState<LanyardTemplate | null>(null);
    const [templateFailed, setTemplateFailed] = useState(false);

    useEffect(() => {
        fetch("/lanyard_template.svg")
            .then((res) => res.ok ? res.text() : Promise.reject(new Error("missing template")))
            .then((svg) => setTemplate(prepareTemplate(svg)))
            .catch(() => setTemplateFailed(true));
    }, []);

    // The admin page is only interactive client-side, so window exists here.
    const origin = window.location.origin;

    return (
        <>
            <GenerateForm
                noun="players"
                onGenerate={(count, characters) =>
                    onIds(generateIds(count, characters, takenIds))}
            />
            {ids.length > 0 && (
                templateFailed ? (
                    <p role="alert" className="mt-6 text-center text-red-300">
                        Could not load the lanyard template.
                    </p>
                ) : !template ? (
                    <p className="mt-6 text-center">Loading template…</p>
                ) : (
                    <PrintArea styles={LANYARD_CSS}>
                        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
                            <defs>
                                <g
                                    id="lanyard-badge"
                                    dangerouslySetInnerHTML={{ __html: template.inner }}
                                />
                            </defs>
                        </svg>
                        {chunk(ids, BADGES_PER_SHEET).map((sheetIds, index) => (
                            <section className="print-sheet lanyard-sheet" key={index}>
                                {sheetIds.map((id) => (
                                    <div className="badge" key={id}>
                                        <div
                                            className="badge-art"
                                            dangerouslySetInnerHTML={{ __html: badgeSvg(template.idText, id) }}
                                        />
                                        <QRCode
                                            className="badge-qr"
                                            style={QR_BOX}
                                            value={`${origin}/player/?id=${encodeURIComponent(id)}`}
                                            level="M"
                                        />
                                    </div>
                                ))}
                            </section>
                        ))}
                    </PrintArea>
                )
            )}
        </>
    );
}

function PackageCodes({ packages }: { packages: Package[] }) {
    const ids = packages.map((item) => item.id);
    // The admin page is only interactive client-side, so window exists here.
    const origin = window.location.origin;
    return ids.length === 0 ? (
        <p className="text-center">No packages yet.</p>
    ) : (
        <PrintArea styles={PACKAGE_CSS}>
            {chunk(ids, CODES_PER_SHEET).map((sheetIds, index) => (
                <section className="print-sheet package-sheet" key={index}>
                    {sheetIds.map((id) => (
                        <div className="package-code" key={id}>
                            <QRCode
                                className="package-qr"
                                value={`${origin}/package/?id=${encodeURIComponent(id)}`}
                                level="M"
                            />
                            <span className="package-id">{id}</span>
                        </div>
                    ))}
                </section>
            ))}
        </PrintArea>
    );
}

const CHALLENGE_CARDS_PER_SHEET = 10;

// Card catalogue comes from the backend so printed cards and the game share
// one source of truth; it only changes on deploy, so cache it for 5 minutes.
interface ChallengeCardData {
    id: string;
    type: "puzzle" | "creative" | "toastcard";
    text: string;
    hintText: string;
}

function useCaptchaStations() {
    return useQuery({
        queryKey: queryKeys.admin.puzzles,
        queryFn: ({ signal }) =>
            apiJson<{ stations: { name: string; puzzle: Puzzle }[] }>(
                "/api/admin/captcha-puzzles",
                { signal },
            ),
    });
}

function CaptchaStations() {
    const stationsQuery = useCaptchaStations();
    const stations = stationsQuery.data?.stations ?? [];
    if (stations.length === 0) {
        return <p className="mt-6 text-center">loading…</p>;
    }
    return (
        <PrintArea styles={CAPTCHA_CSS}>
            {stations.map((station) => (
                <section className="print-sheet captcha-sheet" key={station.name}>
                    <h1 className="captcha-title">{station.name}</h1>
                    <div className="captcha-grid-wrap">
                        <PuzzleGrid
                            puzzle={station.puzzle}
                            selectedDuck={null}
                            onSelect={() => {}}
                            onMutate={() => {}}
                            editable={false}
                        />
                    </div>
                </section>
            ))}
        </PrintArea>
    );
}

function ChallengeCodes() {
    const [mode, setMode] = useState<"cards" | "blanks" | "toastcards">("cards");
    const [blankGenre, setBlankGenre] = useState<"puzzle" | "creative">("puzzle");
    const cardsQuery = useQuery({
        queryKey: ["challenge-cards"],
        queryFn: ({ signal }) =>
            apiJson<{ cards: ChallengeCardData[] }>("/api/challenge-cards", { signal }),
        staleTime: 5 * 60 * 1000,
    });
    const cards = cardsQuery.data?.cards ?? [];
    const standardCards = cards.filter((card) => card.type !== "toastcard");
    const toastcards = cards.filter((card) => card.type === "toastcard");
    return <>
        {mode === "cards" && <>
            <Button onClick={() => setMode("blanks")}>print blank challenges</Button>
            <Button onClick={() => setMode("toastcards")}>print toastcard challenge cards</Button>
        </>}
        {mode === "blanks" && <>
            <Button onClick={() => setMode("cards")}>print predefined challenges</Button>
            <Button onClick={() => setBlankGenre(blankGenre === "puzzle" ? "creative" : "puzzle")}>
                {blankGenre === "puzzle" ? "print creative challenges" : "print puzzle challenges"}
            </Button>
        </>}
        {mode === "toastcards" && (
            <Button onClick={() => setMode("cards")}>print challenge cards</Button>
        )}
        {mode === "blanks" && <PrintArea styles={CHALLENGE_CSS}>
            <section className="print-sheet challenge-sheet">
                {Array.from({ length: CHALLENGE_CARDS_PER_SHEET }).map((_, i) => (
                    <ChallengeCard key={i} id={"OTHER"} type={blankGenre} text={" "} hintText={" "} icon="/captcha/duck/duck.png" />
                ))}
            </section>
        </PrintArea>
        }
        {mode === "cards" && <PrintArea styles={CHALLENGE_CSS}>
            {chunk(standardCards, CHALLENGE_CARDS_PER_SHEET).map((challenges, index) => (
                <section className="print-sheet challenge-sheet" key={index}>
                    {challenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} id={challenge.id} type={challenge.type} text={challenge.text} hintText={challenge.hintText} />
                    ))}
                </section>
            ))}
        </PrintArea>}
        {mode === "toastcards" && toastcards.length > 0 && <PrintArea styles={CHALLENGE_CSS}>
            <section className="print-sheet challenge-sheet">
                {Array.from({ length: CHALLENGE_CARDS_PER_SHEET }).map((_, i) => {
                    const card = toastcards[i % toastcards.length]!;
                    return (
                        <ChallengeCard key={i} id={card.id} type={card.type} text={card.text} hintText={card.hintText} />
                    );
                })}
            </section>
        </PrintArea>}
    </>
}

export default function PrintTab({ takenIds, packages }: PrintTabProps) {
    const [subTab, setSubTab] = useState<"players" | "packages" | "challenges" | "captchas">("players");
    const [playerIds, setPlayerIds] = useState<string[]>([]);

    return (
        <>
            <div className="mb-6 flex justify-center gap-2" role="tablist">
                {(
                    [
                        ["players", "print player codes"],
                        ["packages", "print package codes"],
                        ["challenges", "print challenge cards"],
                        ["captchas", "print captcha stations"],
                    ] as const
                ).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={subTab === id}
                        className={`rounded px-4 py-2 ${subTab === id
                            ? "bg-rose-500 text-white"
                            : "bg-gray-700 text-gray-100"
                            }`}
                        onClick={() => setSubTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {subTab === "players" ? (
                <PlayerCodes ids={playerIds} takenIds={takenIds} onIds={setPlayerIds} />
            ) : subTab === "packages" ? (
                <PackageCodes packages={packages} />
            ) : subTab === "captchas" ? (
                <CaptchaStations />
            ) : (
                <ChallengeCodes />
            )}
        </>
    );
}
