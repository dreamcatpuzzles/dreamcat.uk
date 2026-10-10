export default function YouTube({ url }: { url: string }) {
    return <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div
            style={{
                position: "relative",
                width: "100%",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
            }}
        >
            <iframe
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
                src={url}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    </div>
}