const IconMic = ({active}) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 19v3" />
        <path d="M8 22h8" />
        {!active && <path d="M5 5l14 14" />}
    </svg>
);

const IconCam = ({active}) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
        <path d="M16 10l4-2v8l-4-2" />
        {!active && <path d="M5 5l14 14" />}
    </svg>
);

const IconChat = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4v-4H7a3 3 0 0 1-3-3V6Z" />
    </svg>
);

const IconLeave = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 7l5 5-5 5" />
        <path d="M19 12H9" />
        <path d="M11 5H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h4" />
    </svg>
);

export default function ControlBar({isMicOn, isCamOn, onToggleMic, onToggleCam, onLeave, onToggleChat}) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-3 px-2 py-1">
            <button
                type="button"
                onClick={onToggleMic}
                title={isMicOn ? "Mute mic" : "Unmute mic"}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                    isMicOn ? "bg-[var(--accent)] text-white" : "bg-black text-white"
                }`}
            >
                <IconMic active={isMicOn} />
            </button>
            <button
                type="button"
                onClick={onToggleCam}
                title={isCamOn ? "Turn off camera" : "Turn on camera"}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                    isCamOn ? "bg-[var(--accent)] text-white" : "bg-black text-white"
                }`}
            >
                <IconCam active={isCamOn} />
            </button>
            <button
                type="button"
                onClick={onToggleChat}
                title="Open chat"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white text-[var(--ink)]"
            >
                <IconChat />
            </button>
            <button
                type="button"
                onClick={onLeave}
                title="Leave"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white"
            >
                <IconLeave />
            </button>
        </div>
    );
}
