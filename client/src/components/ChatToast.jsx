import {useEffect, useRef} from "react";

export default function ChatToast({message, onClear}) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (!message) {
            return undefined;
        }
        if (!message) {
            return null;
        }

        return (
            <div
                className="fixed right-6 top-6 z-40 max-w-xs rounded-2xl border border-[var(--panel-border)] bg-white/95 px-4 py-3 text-sm shadow-[var(--shadow)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">New message</p>
                <p className="mt-1 font-medium text-[var(--ink)]">{message}</p>
            </div>
        );
    }
}