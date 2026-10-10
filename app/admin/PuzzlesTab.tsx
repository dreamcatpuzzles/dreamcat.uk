"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiJson, queryKeys } from "@/app/api";
import { Button } from "@/app/Button";

// Accessory sprites share the duck sprite's crop box, so they can be layered
// with absolute positioning. Render order matters: earlier entries sit behind
// later ones.
const ACCESSORIES = ["flag", "tattoo", "earring", "tache", "hat"] as const;
type Accessory = (typeof ACCESSORIES)[number];

// Theme = directory under /captcha holding one sprite set: the creature is
// <theme>.png and each accessory is <accessory>.png in the same crop box.
const CAPTCHA_THEMES = ["duck", "frog", "crab"] as const;
type CaptchaTheme = (typeof CAPTCHA_THEMES)[number];

function themeOf(puzzle: { theme?: string }): CaptchaTheme {
  return (CAPTCHA_THEMES as readonly string[]).includes(puzzle.theme ?? "")
    ? (puzzle.theme as CaptchaTheme)
    : "duck";
}

// Cropped sprite dimensions from crop.py: duck size is expressed as a
// fraction of cell height, so a size of 1 fills the cell vertically.
const SPRITE_ASPECT = "694 / 748";
// Radius of a bounding circle for a sprite whose height is `size` (as a
// fraction of the cell): half the sprite's diagonal, so a rotated duck stays
// inside its circle and circles never overlap.
const BOUNDING_RADIUS = 0.74;

interface PuzzleDuck {
    x: number;
    y: number;
    size: number;
    rotation: number;
    flipped: boolean;
    accessories: Accessory[];
}

interface PuzzleCell {
    row: number;
    col: number;
    ducks: PuzzleDuck[];
}

export interface Puzzle {
    name?: string;
    theme?: CaptchaTheme;
    grid: { rows: number; cols: number };
    cells: PuzzleCell[];
}

function round(value: number, decimals = 4) {
    return Number(value.toFixed(decimals));
}

function randomDuck(maxAccessories: number): Pick<PuzzleDuck, "accessories" | "flipped"> {
    const limit = Math.min(maxAccessories, ACCESSORIES.length);
    const count = Math.floor(Math.random() * (limit + 1));
    const pool: Accessory[] = [...ACCESSORIES];
    const accessories: Accessory[] = [];
    for (let i = 0; i < count; i += 1) {
        accessories.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return { accessories, flipped: Math.random() < 0.5 };
}

// Tries to place `count` ducks of size `drawSize` at random non-overlapping
// positions inside the unit square. A duck's centre stays half a duck-width
// from the edges, and duck centres are kept at least one bounding-circle
// radius apart. Returns null if any duck cannot be placed.
function tryLayout(count: number, drawSize: number) {
    const half = drawSize / 2;
    const r = drawSize * BOUNDING_RADIUS;
    const placed: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < count; i += 1) {
        let spot: { x: number; y: number } | null = null;
        for (let s = 0; s < 200 && !spot; s += 1) {
            const x = half + Math.random() * Math.max(0, 1 - 2 * half);
            const y = half + Math.random() * Math.max(0, 1 - 2 * half);
            let clearance = Infinity;
            for (const p of placed) {
                clearance = Math.min(
                    clearance,
                    Math.hypot(x - p.x, y - p.y) - p.r - r,
                );
            }
            if (clearance >= 0.005) spot = { x, y };
        }
        if (!spot) return null;
        placed.push({ ...spot, r });
    }
    return placed;
}

// Lays out `count` ducks in a cell. If they cannot all fit at the requested
// size, the whole cell's ducks are shrunk together until they do.
function layoutDucks(count: number, size: number, maxAngle: number, maxAccessories: number): PuzzleDuck[] {
    let drawSize = size;
    let placed: { x: number; y: number }[] | null = null;
    for (let shrink = 0; shrink < 40 && !placed && drawSize > 0.002; shrink += 1) {
        placed = tryLayout(count, drawSize);
        if (!placed) drawSize *= 0.8;
    }
    const fitted = placed !== null;
    placed ??= Array.from({ length: count }, () => ({ x: 0.5, y: 0.5 }));
    return placed.map((spot) => ({
        x: round(spot.x),
        y: round(spot.y),
        size: round(fitted ? drawSize : 0),
        rotation: round((Math.random() * 2 - 1) * maxAngle, 2),
        ...randomDuck(maxAccessories),
    }));
}

function generatePuzzle(
    rows: number,
    cols: number,
    minDucks: number,
    maxDucks: number,
    duckSize: number,
    maxAngle: number,
    maxAccessories: number,
): Puzzle {
    const cells: PuzzleCell[] = [];
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const count = minDucks +
                Math.floor(Math.random() * (maxDucks - minDucks + 1));
            cells.push({
                row,
                col,
                ducks: layoutDucks(count, duckSize, maxAngle, maxAccessories),
            });
        }
    }
    return { grid: { rows, cols }, cells };
}

function cellKey(row: number, col: number) {
    return `${row},${col}`;
}

function DuckSprite({ duck, theme, selected, interactive = true, onPointerDown }: {
    duck: PuzzleDuck;
    theme: CaptchaTheme;
    selected: boolean;
    interactive?: boolean;
    onPointerDown?: (event: React.PointerEvent) => void;
}) {
    return (
        <div
            className={`absolute select-none ${
                interactive ? "cursor-move touch-none" : "pointer-events-none"
            } ${
                selected ? "outline-2 outline-rose-500" : ""
            }`}
            style={{
                left: `${duck.x * 100}%`,
                top: `${duck.y * 100}%`,
                height: `${duck.size * 100}%`,
                aspectRatio: SPRITE_ASPECT,
                transform: `translate(-50%, -50%) rotate(${duck.rotation}deg)`,
            }}
            onPointerDown={onPointerDown}
        >
            <div
                className="relative h-full w-full"
                style={duck.flipped ? { transform: "scaleX(-1)" } : undefined}
            >
                <img
                    src={`/captcha/${theme}/${theme}.png`}
                    alt={theme}
                    draggable={false}
                    className="block h-full w-full"
                />
                {ACCESSORIES.filter((accessory) =>
                    duck.accessories.includes(accessory)).map((accessory) => (
                        <img
                            key={accessory}
                            src={`/captcha/${theme}/${accessory}.png`}
                            alt=""
                            draggable={false}
                            className="absolute inset-0 h-full w-full"
                        />
                    ))}
            </div>
        </div>
    );
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function PuzzleGrid({ puzzle, selectedDuck, onSelect, onMutate, editable = true }: {
    puzzle: Puzzle;
    selectedDuck: PuzzleDuck | null;
    onSelect: (duck: PuzzleDuck | null) => void;
    onMutate: () => void;
    editable?: boolean;
}) {
    const gridRef = useRef<HTMLDivElement>(null);

    // Dragging uses window listeners (not pointer capture) so a duck keeps
    // moving even when React reparents it into another cell's element.
    function startDrag(event: React.PointerEvent, cell: PuzzleCell, duck: PuzzleDuck) {
        event.preventDefault();
        onSelect(duck);
        let host = cell;
        const move = (ev: PointerEvent) => {
            const grid = gridRef.current;
            if (!grid) return;
            const rect = grid.getBoundingClientRect();
            const gx = (ev.clientX - rect.left) / rect.width;
            const gy = (ev.clientY - rect.top) / rect.height;
            const col = clamp(Math.floor(gx * puzzle.grid.cols), 0, puzzle.grid.cols - 1);
            const row = clamp(Math.floor(gy * puzzle.grid.rows), 0, puzzle.grid.rows - 1);
            duck.x = round(clamp(gx * puzzle.grid.cols - col, 0, 1));
            duck.y = round(clamp(gy * puzzle.grid.rows - row, 0, 1));
            const target = puzzle.cells.find((c) => c.row === row && c.col === col);
            if (target && target !== host) {
                host.ducks.splice(host.ducks.indexOf(duck), 1);
                target.ducks.push(duck);
                host = target;
            }
            onMutate();
        };
        const up = () => window.removeEventListener("pointermove", move);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up, { once: true });
    }

    return (
        <div
            ref={gridRef}
            className="grid gap-1"
            style={{
                gridTemplateColumns: `repeat(${puzzle.grid.cols}, minmax(0, 1fr))`,
            }}
        >
            {puzzle.cells.map((cell) => (
                <div
                    key={cellKey(cell.row, cell.col)}
                    className="relative aspect-square rounded bg-gray-100"
                    onPointerDown={editable ? () => onSelect(null) : undefined}
                >
                    {cell.ducks.map((duck, index) => (
                        <DuckSprite
                            key={index}
                            duck={duck}
                            theme={themeOf(puzzle)}
                            selected={duck === selectedDuck}
                            interactive={editable}
                            onPointerDown={editable
                                ? (event) => {
                                    event.stopPropagation();
                                    startDrag(event, cell, duck);
                                }
                                : undefined}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function isPuzzle(value: unknown): value is Puzzle {
    if (typeof value !== "object" || value === null) return false;
    const puzzle = value as Puzzle;
    return Number.isSafeInteger(puzzle.grid?.rows) &&
        Number.isSafeInteger(puzzle.grid?.cols) &&
        Array.isArray(puzzle.cells) &&
        (puzzle.name === undefined || typeof puzzle.name === "string") &&
        (puzzle.theme === undefined || typeof puzzle.theme === "string");
}

interface Quest {
    accessory: Accessory;
    puzzle: Puzzle;
}

function CaptchaPlay() {
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [quest, setQuest] = useState<Quest | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [result, setResult] = useState<"correct" | "wrong" | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const stationsQuery = useQuery({
        queryKey: queryKeys.admin.puzzles,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            apiJson<{ stations: { name: string; puzzle: Puzzle }[] }>(
                "/api/admin/captcha-puzzles",
                { signal },
            ),
    });

    const present = puzzle
        ? new Set(
            puzzle.cells.flatMap((cell) =>
                cell.ducks.flatMap((duck) => duck.accessories)),
        )
        : new Set<Accessory>();
    const questOptions = ACCESSORIES.filter((accessory) => present.has(accessory));

    const correctCells = new Set(
        (quest?.puzzle.cells ?? [])
            .filter((cell) =>
                cell.ducks.some((duck) =>
                    duck.accessories.includes(quest!.accessory)))
            .map((cell) => cellKey(cell.row, cell.col)),
    );

    // showAnswer intentionally persists across quest and station changes —
    // it stays on until toggled off.
    function loadStation(next: Puzzle) {
        setPuzzle(structuredClone(next));
        setQuest(null);
        setSelected(new Set());
        setResult(null);
    }

    function chooseQuest(accessory: Accessory) {
        if (!puzzle) return;
        setQuest({ accessory, puzzle });
        setSelected(new Set());
        setResult(null);
    }

    function toggleCell(key: string) {
        setResult(null);
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function submit() {
        const right = selected.size === correctCells.size &&
            [...selected].every((key) => correctCells.has(key));
        setResult(right ? "correct" : "wrong");
    }

    return (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-gray-800 p-5 shadow">
            <div>
                <span className="block">Load captcha station</span>
                <div className="mt-2 flex flex-wrap gap-2">
                    {stationsQuery.data?.stations.map((station) => (
                        <Button
                            key={station.name}
                            theme="secondary"
                            onClick={() => loadStation(station.puzzle)}
                        >
                            load {station.name}
                        </Button>
                    ))}
                </div>
                {stationsQuery.isLoading && <p className="mt-2">loading…</p>}
            </div>
            {puzzle && questOptions.length === 0 && (
                <p>This puzzle has no accessories, so no quests are available.</p>
            )}
            {questOptions.length > 0 && (
                <div>
                    <span className="block">Choose a quest</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {questOptions.map((accessory) => (
                            <Button
                                key={accessory}
                                theme={quest?.accessory === accessory
                                    ? "primary"
                                    : "secondary"}
                                onClick={() => chooseQuest(accessory)}
                            >
                                {accessory}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            {puzzle && (
                <PuzzleGrid
                    puzzle={puzzle}
                    selectedDuck={null}
                    onSelect={() => {}}
                    onMutate={() => {}}
                    editable={false}
                />
            )}
            {quest && (
                <>
                    <p>find all {themeOf(quest.puzzle)}s with {quest.accessory}</p>
                    <div
                        className="grid gap-1"
                        style={{
                            gridTemplateColumns: `repeat(${quest.puzzle.grid.cols}, minmax(0, 1fr))`,
                        }}
                    >
                        {quest.puzzle.cells.map((cell) => {
                            const key = cellKey(cell.row, cell.col);
                            const isSelected = selected.has(key);
                            const isCorrect = correctCells.has(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => toggleCell(key)}
                                    className={`aspect-square rounded border-2 ${
                                        isSelected
                                            ? "border-rose-500 bg-rose-500/40"
                                            : "border-gray-600 bg-gray-700"
                                    } ${
                                        showAnswer && isCorrect
                                            ? "bg-emerald-500/40 ring-2 ring-emerald-400"
                                            : ""
                                    }`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={submit}>submit</Button>
                        <Button onClick={() => setShowAnswer((v) => !v)}>
                            {showAnswer ? "hide answer" : "show answer"}
                        </Button>
                        {result === "correct" && (
                            <p role="status" className="text-green-400">correct!</p>
                        )}
                        {result === "wrong" && (
                            <p role="status" className="text-red-300">wrong</p>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

function CaptchaCreate() {
    const [minDucksInput, setMinDucksInput] = useState("1");
    const [maxDucksInput, setMaxDucksInput] = useState("3");
    const [duckSizeInput, setDuckSizeInput] = useState("100");
    const [maxAngleInput, setMaxAngleInput] = useState("5");
    const [maxAccessoriesInput, setMaxAccessoriesInput] = useState("2");
    const [rowsInput, setRowsInput] = useState("3");
    const [colsInput, setColsInput] = useState("3");
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [nameInput, setNameInput] = useState("");
    const [theme, setTheme] = useState<CaptchaTheme>("duck");
    const [selectedDuck, setSelectedDuck] = useState<PuzzleDuck | null>(null);
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");

    const stationsQuery = useQuery({
        queryKey: queryKeys.admin.puzzles,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
            apiJson<{ stations: { name: string; puzzle: Puzzle }[] }>(
                "/api/admin/captcha-puzzles",
                { signal },
            ),
    });

    const minDucks = Number(minDucksInput);
    const maxDucks = Number(maxDucksInput);
    const duckSize = Number(duckSizeInput);
    const maxAngle = Number(maxAngleInput);
    const maxAccessories = Number(maxAccessoriesInput);
    const rows = Number(rowsInput);
    const cols = Number(colsInput);
    const valid = Number.isSafeInteger(minDucks) && minDucks >= 0 &&
        Number.isSafeInteger(maxDucks) && maxDucks >= minDucks &&
        Number.isFinite(duckSize) && duckSize >= 0 && duckSize <= 100 &&
        Number.isFinite(maxAngle) && maxAngle >= 0 && maxAngle <= 180 &&
        Number.isSafeInteger(maxAccessories) && maxAccessories >= 0 &&
        Number.isSafeInteger(rows) && rows >= 1 &&
        Number.isSafeInteger(cols) && cols >= 1;

    function loadPuzzle(next: Puzzle) {
        setPuzzle(next);
        setNameInput(next.name ?? "");
        setTheme(themeOf(next));
        setSelectedDuck(null);
        setJsonText(JSON.stringify(next, null, 2));
        setJsonError("");
    }

    function selectTheme(next: CaptchaTheme) {
        setTheme(next);
        if (puzzle) {
            puzzle.theme = next;
            commitPuzzle();
        }
    }

    function rename(name: string) {
        setNameInput(name);
        if (puzzle) {
            puzzle.name = name;
            commitPuzzle();
        }
    }

    function generate() {
        loadPuzzle({
            ...generatePuzzle(
                rows,
                cols,
                minDucks,
                maxDucks,
                duckSize / 100,
                maxAngle,
                maxAccessories,
            ),
            name: nameInput,
            theme,
        });
    }

    // Interactive edits mutate the puzzle in place so the selected duck keeps
    // its object identity; committing stores a fresh state object and syncs
    // the JSON text.
    function commitPuzzle() {
        if (!puzzle) return;
        setPuzzle({ ...puzzle });
        setJsonText(JSON.stringify(puzzle, null, 2));
    }

    function mutateSelectedDuck(mutate: (duck: PuzzleDuck) => void) {
        if (!puzzle || !selectedDuck) return;
        mutate(selectedDuck);
        commitPuzzle();
    }

    function applyJson() {
        try {
            const parsed: unknown = JSON.parse(jsonText);
            if (!isPuzzle(parsed)) {
                setJsonError("JSON does not look like a puzzle.");
                return;
            }
            parsed.theme ??= theme;
            parsed.name ??= nameInput;
            setPuzzle(parsed);
            setNameInput(parsed.name ?? "");
            setTheme(themeOf(parsed));
            setSelectedDuck(null);
            setJsonError("");
        } catch {
            setJsonError("Invalid JSON.");
        }
    }

    return (
        <>
            <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-gray-800 p-5 shadow">
                <div>
                    <span className="block">Ducks per cell (min – max)</span>
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            aria-label="min ducks per cell"
                            type="number"
                            min={0}
                            step={1}
                            value={minDucksInput}
                            onChange={(event) =>
                                setMinDucksInput(event.target.value)}
                            className="w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                        />
                        <span>–</span>
                        <input
                            aria-label="max ducks per cell"
                            type="number"
                            min={0}
                            step={1}
                            value={maxDucksInput}
                            onChange={(event) =>
                                setMaxDucksInput(event.target.value)}
                            className="w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                        />
                    </div>
                </div>
                <div>
                    <label className="block" htmlFor="captcha-duck-size">
                        Duck size (%)
                    </label>
                    <input
                        id="captcha-duck-size"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={duckSizeInput}
                        onChange={(event) => setDuckSizeInput(event.target.value)}
                        className="mt-2 w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                    />
                </div>
                <div>
                    <label className="block" htmlFor="captcha-max-angle">
                        Max duck angle randomisation (°)
                    </label>
                    <input
                        id="captcha-max-angle"
                        type="number"
                        min={0}
                        max={180}
                        step={1}
                        value={maxAngleInput}
                        onChange={(event) => setMaxAngleInput(event.target.value)}
                        className="mt-2 w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                    />
                </div>
                <div>
                    <label className="block" htmlFor="captcha-max-accessories">
                        Max number of duck accessories
                    </label>
                    <input
                        id="captcha-max-accessories"
                        type="number"
                        min={0}
                        max={ACCESSORIES.length}
                        step={1}
                        value={maxAccessoriesInput}
                        onChange={(event) =>
                            setMaxAccessoriesInput(event.target.value)}
                        className="mt-2 w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                    />
                </div>
                <div>
                    <span className="block">Grid size (h × w)</span>
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            aria-label="grid height"
                            type="number"
                            min={1}
                            step={1}
                            value={rowsInput}
                            onChange={(event) => setRowsInput(event.target.value)}
                            className="w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                        />
                        <span>×</span>
                        <input
                            aria-label="grid width"
                            type="number"
                            min={1}
                            step={1}
                            value={colsInput}
                            onChange={(event) => setColsInput(event.target.value)}
                            className="w-28 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                        />
                    </div>
                </div>
                <div>
                    <label className="block" htmlFor="captcha-name">
                        Name
                    </label>
                    <input
                        id="captcha-name"
                        type="text"
                        value={nameInput}
                        onChange={(event) => rename(event.target.value)}
                        className="mt-2 w-64 rounded border border-gray-600 bg-gray-700 p-2 text-gray-100"
                    />
                </div>
                <div>
                    <span className="block">Theme</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {CAPTCHA_THEMES.map((option) => (
                            <Button
                                key={option}
                                theme={theme === option ? "primary" : "secondary"}
                                onClick={() => selectTheme(option)}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                </div>
                <Button disabled={!valid} onClick={generate}>generate</Button>
                {stationsQuery.data && stationsQuery.data.stations.length > 0 && (
                    <div>
                        <span className="block">Load existing</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {stationsQuery.data.stations.map((station) => (
                                <Button
                                    key={station.name}
                                    theme="secondary"
                                    onClick={() =>
                                        loadPuzzle(structuredClone(station.puzzle))}
                                >
                                    load {station.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            {puzzle && (
                <div className="mx-auto mt-6 max-w-2xl">
                    {selectedDuck && (
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Button
                                onClick={() =>
                                    mutateSelectedDuck((duck) => {
                                        duck.size = round(Math.min(2, duck.size * 1.1));
                                    })}
                            >
                                bigger
                            </Button>
                            <Button
                                onClick={() =>
                                    mutateSelectedDuck((duck) => {
                                        duck.size = round(Math.max(0.02, duck.size / 1.1));
                                    })}
                            >
                                smaller
                            </Button>
                            <Button
                                onClick={() =>
                                    mutateSelectedDuck((duck) => {
                                        duck.flipped = !duck.flipped;
                                    })}
                            >
                                flip
                            </Button>
                            <Button
                                onClick={() =>
                                    mutateSelectedDuck((duck) => {
                                        duck.rotation = round(duck.rotation - 5, 2);
                                    })}
                            >
                                -5°
                            </Button>
                            <Button
                                onClick={() =>
                                    mutateSelectedDuck((duck) => {
                                        duck.rotation = round(duck.rotation + 5, 2);
                                    })}
                            >
                                +5°
                            </Button>
                            {ACCESSORIES.map((accessory) => (
                                <label
                                    key={accessory}
                                    className="flex items-center gap-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDuck.accessories.includes(accessory)}
                                        onChange={(event) =>
                                            mutateSelectedDuck((duck) => {
                                                duck.accessories = ACCESSORIES
                                                    .filter((a) =>
                                                        a === accessory
                                                            ? event.target.checked
                                                            : duck.accessories.includes(a));
                                            })}
                                        className="accent-rose-500"
                                    />
                                    {accessory}
                                </label>
                            ))}
                        </div>
                    )}
                    <PuzzleGrid
                        puzzle={puzzle}
                        selectedDuck={selectedDuck}
                        onSelect={setSelectedDuck}
                        onMutate={commitPuzzle}
                    />
                    <textarea
                        aria-label="puzzle json"
                        value={jsonText}
                        onChange={(event) => setJsonText(event.target.value)}
                        spellCheck={false}
                        className="mt-4 h-96 w-full overflow-auto rounded bg-gray-800 p-4 font-mono text-xs"
                    />
                    <div className="mt-2 flex items-center gap-3">
                        <Button onClick={applyJson}>apply json</Button>
                        {jsonError && (
                            <p role="alert" className="text-red-300">{jsonError}</p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default function PuzzlesTab() {
    const [subTab, setSubTab] = useState<"play" | "create">("play");

    return (
        <>
            <div className="mb-6 flex justify-center gap-2" role="tablist">
                {([["play", "play"], ["create", "create"]] as const).map(
                    ([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={subTab === id}
                            className={`rounded px-4 py-2 ${
                                subTab === id
                                    ? "bg-rose-500 text-white"
                                    : "bg-gray-700 text-gray-100"
                            }`}
                            onClick={() => setSubTab(id)}
                        >
                            {label}
                        </button>
                    ),
                )}
            </div>
            {subTab === "play" ? <CaptchaPlay /> : <CaptchaCreate />}
        </>
    );
}
