import {useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {v4 as uuidv4} from "uuid";
import PageShell from "../components/PageShell.jsx";
import {getDisplayName} from "../utils/name.js";

export default function Landing() {
    const navigate = useNavigate();
    const location = useLocation();
    const roomError = location.state?.error;

    const [displayName, setDisplayName] = useState(getDisplayName());
    const [roomId, setRoomId] = useState("");

    const heroCopy = useMemo(
        () => ({
            title: "Talkmandu",
            subtitle: "Small rooms. Big connection.",
            body:
                "Instant meetings that feel fast and secure. Create a room, share the link, or jump into a random 1-to-1 in seconds.",
        }),
        []
    );

    const handleCreateRoom = () => {
        const id = uuidv4();
        if (displayName.trim()) {
            localStorage.setItem("talkmandu_name", displayName.trim());
        }
        navigate(`/meeting/${id}`, {state: {error: null}});
    };

    const handleJoinRoom = () => {
        if (!roomId.trim()) {
            return;
        }
        if (displayName.trim()) {
            localStorage.setItem("talkmandu_name", displayName.trim());
        }
        navigate(`/meeting/${roomId.trim()}`, {state: {error: null}});
    };

    return (
        <PageShell>
            <header className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="mt-2 text-4xl font-semibold text-[var(--ink)] sm:text-5xl">
                        Talkmandu
                    </h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">Meet fast. Talk deeper.</p>
                </div>
                <div
                    className="rounded-full border border-[var(--panel-border)] bg-white/70 px-4 py-2 text-xs text-[var(--muted)]">
                    Real-time rooms · share instantly
                </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div
                    className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] p-8 shadow-[var(--shadow)]">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Overview</p>
                    <h2 className="mt-3 text-3xl font-semibold">{heroCopy.subtitle}</h2>
                    <p className="mt-4 text-base text-[var(--muted)]">{heroCopy.body}</p>

                    <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                        <div
                            className="flex items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
                            <span>Mesh rooms capped at 4</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Stable</span>
                        </div>
                        <div
                            className="flex items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
                            <span>Random 1-to-1 matching</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Fast</span>
                        </div>
                        <div
                            className="flex items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
                            <span>Local-only identity</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Private</span>
                        </div>
                    </div>

                    <div className="mt-8 rounded-3xl border border-[var(--panel-border)] bg-white/80 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Your display name</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            This name appears in meetings and random chats.
                        </p>
                        <input
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            placeholder="Enter your display name"
                            className="mt-4 w-full rounded-2xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div
                        className="rounded-3xl border border-[var(--panel-border)] bg-white/80 p-6 shadow-[var(--shadow)]">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Start a meeting</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            Generate a new room and share the link.
                        </p>
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                        >
                            Create new meeting
                        </button>
                    </div>

                    <div
                        className="rounded-3xl border border-[var(--panel-border)] bg-white/80 p-6 shadow-[var(--shadow)]">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Join a meeting</p>
                        <div className="mt-4 flex flex-col gap-3">
                            <input
                                value={roomId}
                                onChange={(event) => setRoomId(event.target.value)}
                                placeholder="Enter room id"
                                className="w-full rounded-2xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm"
                            />
                            {roomError ? (
                                <p className="text-sm text-red-600">{roomError}</p>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleJoinRoom}
                                className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
                            >
                                Join meeting
                            </button>
                        </div>
                    </div>

                    <div
                        className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Random 1-to-1</p>
                        <p className="mt-3 text-sm text-[var(--muted)]">
                            Jump into a quick 1-to-1 call. You can skip anytime.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/random")}
                            className="mt-5 w-full rounded-2xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm font-semibold"
                        >
                            Start random chat
                        </button>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}
