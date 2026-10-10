"use client";

import { useEffect, useRef, useState } from "react"

const framesPattern = [0, 1, 0, 2];

export default function Duck({ frameLimit = 20 }: { frameLimit?: number }) {
    const [frame, setFrame] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const frameRef = useRef(frame);
    const totalFramesRef = useRef(totalFrames);

    function tick() {
        if (totalFramesRef.current > frameLimit) {
            setFrame(0);
            frameRef.current = 0;
            return; // stop anim
        }
        totalFramesRef.current += 1;
        setTotalFrames(totalFramesRef.current);
        frameRef.current = (frameRef.current + 1) % framesPattern.length;
        setFrame(frameRef.current);
    }

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        function scheduleNextFrame() {
            const delay = 100 + Math.random() * 250;
            timeout = setTimeout(() => {
                tick();
                scheduleNextFrame();
            }, delay);
        }

        scheduleNextFrame();
        return () => clearTimeout(timeout);
    }, []);

    return <img src={`/duck_talk${framesPattern[frame]}.png`} alt="Duck talking" className="h-32 pb-4"></img>
}
