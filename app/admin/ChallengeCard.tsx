import QRCode from "react-qr-code";

const TYPE_ICONS: Record<"puzzle" | "creative" | "toastcard", string> = {
    puzzle: "/puzzle.svg",
    creative: "/art.svg",
    toastcard: "/toast_colour.svg",
};

function Card({ foreground, background, type, id, text, hintText, icon }: { foreground: string; background: string; type: "puzzle" | "creative" | "toastcard"; id: string; text: string; hintText: string; icon: string }) {
    const url = `${window.location.origin}/challenges/${id}`;
    return (
        <div className={`challenge-${type} relative h-[55mm] w-[100mm] p-8`}>
            <div className="challenge-highlight h-full p-2">
                <div className={`challenge-${type} h-full`}></div>
            </div>
            <div
                className="absolute left-9 top-9 flex h-[15mm] w-[15mm] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[1.5mm]"
                style={{ backgroundColor: background, borderColor: background }}
            >
                <img src={icon} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="absolute right-8 top-8 w-[60mm]">
                <h2 className={`challenge-${type} text-2xl pl-2 pb-2 leading-5`}>{text}</h2>
            </div>
            {hintText && (
                <p className="absolute bottom-11 right-8 w-[60mm] pl-2 text-md challenge-location">{hintText}</p>
            )}
            <div className={`absolute bottom-8 left-8 pt-2 pr-2 challenge-${type}`}>
                <QRCode value={url} size={80} bgColor={background} fgColor={foreground} />
            </div>
        </div>
    );
}

export default function ChallengeCard({ id, type, text, hintText, icon }: { id: string; type: "puzzle" | "creative" | "toastcard"; text: string; hintText?: string; icon?: string }) {
    const foreground = type === "puzzle" ? "#220055" : type === "toastcard" ? "#8b5a2b" : "#d40055";
    const background = "#fff6d5";
    return (
        <Card foreground={foreground} background={background} type={type}
            id={id || "CHALLENGE"}
            text={text}
            hintText={hintText || `Location: ${id}`}
            icon={icon ?? TYPE_ICONS[type]} />
    );
}
