import {useEffect, useMemo, useRef, useState} from "react";

const getInitials = (name) => {
    if (!name) {
        return "";
    }
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getVideoActive = (stream, forcedVideoOn) => {
    if (typeof forcedVideoOn === "boolean") {
        return forcedVideoOn;
    }
    if (!stream) {
        return false;
    }
    const [track] = stream.getVideoTracks();
    if (!track) {
        return false;
    }
    return track.readyState !== "ended" && !track.muted;
};

export default function VideoTile({stream, muted, label, className = "", videoOn}) {
    const videoRef = useRef(null);
    const [isVideoActive, setIsVideoActive] = useState(getVideoActive(stream, videoOn));
    const initials = useMemo(() => getInitials(label || ""), [label]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream || null;
        }
    }, [stream]);

    useEffect(() => {
        setIsVideoActive(getVideoActive(stream, videoOn));
    }, [stream, videoOn]);

    useEffect(() => {
        const [track] = stream?.getVideoTracks() || [];
        if (!track) {
            return undefined;
        }

        const update = () => setIsVideoActive(getVideoActive(stream, videoOn));
        track.addEventListener("mute", update);
        track.addEventListener("unmute", update);
        track.addEventListener("ended", update);

        return () => {
            track.removeEventListener("mute", update);
            track.removeEventListener("unmute", update);
            track.removeEventListener("ended", update);
        };
    }, [stream, videoOn]);

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-black shadow-[var(--shadow)] ${className}`}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="h-full w-full object-cover"
            />
            {!isVideoActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--panel)] bg-opacity-90">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white text-lg font-semibold text-[var(--ink)]">
                        {initials || "?"}
                    </div>
                    <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
                </div>
            ) : null}
            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {label}
            </div>
        </div>
    );
}
