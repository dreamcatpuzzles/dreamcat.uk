'use client';

import Link from "next/link";
import QRCode from "react-qr-code";

export default function QRForPlayer({ playerId, size, isLink = true }: { playerId: string, size: number, isLink?: boolean }) {
    const qrCodeUrl = `${window.location.origin}/player/?id=${encodeURIComponent(playerId)}`;
    return isLink ? (
        <Link href={qrCodeUrl} target="_blank" rel="noopener noreferrer" aria-label={`QR code for player ${playerId}`}>
            <QRCode value={qrCodeUrl} size={size} />
        </Link>
    ) : (
        <QRCode value={qrCodeUrl} size={size} />
    )
}
