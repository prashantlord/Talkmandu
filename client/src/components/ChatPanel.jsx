import {useEffect, useRef, useState} from "react";

export default function ChatPanel({isOpen, onClose, onSend, incomingMessage}) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!message.trim()) {
            return;
        }
        const entry = {text: message, ts: Date.now(), fromSelf: true};
        setMessages((prev) => [...prev, entry]);
        onSend?.(message);
        setMessage("");
    };

    useEffect(() => {
        if (incomingMessage) {
            setMessages((prev) => [...prev, incomingMessage]);
        }
    }, [incomingMessage]);

    if (!isOpen) {
        return null;
    }

    return (
        <aside
            className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-[var(--panel-border)] bg-[var(--panel)] shadow-[var(--shadow)]"
        >
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-4 py-3">
                <p className="text-sm font-semibold">Chat</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-[var(--panel-border)] bg-white px-3 py-1 text-xs"
                >
                    Close
                </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No messages yet.</p>
                ) : (
                    messages.map((entry) => (
                        <div
                            key={entry.ts + entry.text}
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                entry.fromSelf
                                    ? "ml-auto bg-[var(--accent)] text-white"
                                    : "bg-white text-[var(--ink)]"
                            }`}
                        >
                            {entry.text}
                        </div>
                    ))
                )}
            </div>
            <form onSubmit={handleSubmit} className="border-t border-[var(--panel-border)] p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Type a message"
                        className="flex-1 rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                        Send
                    </button>
                </div>
            </form>
        </aside>
    );
}
