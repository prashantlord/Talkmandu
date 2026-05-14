import ControlBar from "./ControlBar.jsx";

const IconStart = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 5l11 7-11 7V5Z" />
    </svg>
);

const IconStop = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

const IconNext = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 7l6 5-6 5V7Z" />
        <path d="M15 7v10" />
    </svg>
);

export default function RandomControlBar({
    isMicOn,
    isCamOn,
    onToggleMic,
    onToggleCam,
    onLeave,
    onToggleChat,
    state,
    onStart,
    onStop,
    onNext,
}) {
    return (
        <div className="flex flex-col gap-3">
            <ControlBar
                isMicOn={isMicOn}
                isCamOn={isCamOn}
                onToggleMic={onToggleMic}
                onToggleCam={onToggleCam}
                onLeave={onLeave}
                onToggleChat={onToggleChat}
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onStart}
                    disabled={state !== "idle"}
                    title="Start"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-white disabled:opacity-40"
                >
                    <IconStart />
                </button>
                <button
                    type="button"
                    onClick={onStop}
                    disabled={state === "idle"}
                    title="Stop"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white text-[var(--ink)] disabled:opacity-40"
                >
                    <IconStop />
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={state !== "connected"}
                    title="Next"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white disabled:opacity-40"
                >
                    <IconNext />
                </button>
            </div>
        </div>
    );
}
