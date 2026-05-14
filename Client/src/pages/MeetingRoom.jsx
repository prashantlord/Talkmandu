import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import ChatPanel from "../components/ChatPanel.jsx";
import ChatToast from "../components/ChatToast.jsx";
import ControlBar from "../components/ControlBar.jsx";
import PageShell from "../components/PageShell.jsx";
import VideoGrid from "../components/VideoGrid.jsx";
import useLocalMedia from "../hooks/useLocalMedia.js";
import useMeshRoom from "../hooks/useMeshRoom.js";
import useSocket from "../hooks/useSocket.js";
import {getUserId} from "../utils/uuid.js";
import {getDisplayName} from "../utils/name.js";

export default function MeetingRoom() {
    const socket = useSocket();
    const navigate = useNavigate();
    const {roomId} = useParams();
    const {localStream, isMicOn, isCamOn, toggleMic, toggleCam} = useLocalMedia((next) => {
        if (roomId) {
            socket.emit("meeting:cam", {roomId, isCamOn: next});
        }
    });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [incomingMessage, setIncomingMessage] = useState(null);
    const [toastMessage, setToastMessage] = useState("");
    const [peerDisplayNames, setPeerDisplayNames] = useState({});
    const [peerCamState, setPeerCamState] = useState({});
    const [notice, setNotice] = useState("");
    const [copied, setCopied] = useState(false);
    const noticeTimerRef = useRef(null);
    const copyTimerRef = useRef(null);
    const userId = useMemo(() => getUserId(), []);
    const displayName = useMemo(() => getDisplayName(), []);

    const [initialPeers, setInitialPeers] = useState([]);
    const {peers} = useMeshRoom({socket, localStream, initialPeers});
    const peersWithNames = useMemo(
        () =>
            peers.map((peer) => ({
                ...peer,
                displayName: peerDisplayNames[peer.socketId] || peer.displayName || null,
                isCamOn:
                    typeof peerCamState[peer.socketId] === "boolean"
                        ? peerCamState[peer.socketId]
                        : undefined,
            })),
        [peerCamState, peerDisplayNames, peers]
    );

    useEffect(() => {
        const handleRejected = ({reason}) => {
            navigate("/", {state: {error: reason}});
        };

        const handleChat = ({message, displayName: senderName, userId: senderId, ts}) => {
            const label = senderName || (senderId ? senderId.slice(0, 6) : "Peer");
            setIncomingMessage({
                text: `${label}: ${message}`,
                ts,
                fromSelf: false,
            });
            if (!isChatOpen) {
                setToastMessage(`${label}: ${message}`);
            }
        };

        const handlePeers = ({peers: peerEntries}) => {
            const peerIds = Array.isArray(peerEntries)
                ? peerEntries.map((entry) => entry.socketId)
                : [];
            setInitialPeers(peerIds);
            if (Array.isArray(peerEntries)) {
                setPeerDisplayNames(
                    peerEntries.reduce((acc, entry) => {
                        if (entry?.socketId) {
                            acc[entry.socketId] = entry.displayName || null;
                        }
                        return acc;
                    }, {})
                );
            }
        };

        const handlePeerJoined = ({socketId, displayName: joinedName}) => {
            if (!socketId) {
                return;
            }
            setPeerDisplayNames((prev) => ({
                ...prev,
                [socketId]: joinedName || prev[socketId] || null,
            }));
        };

        const handlePeerLeft = ({socketId}) => {
            if (!socketId) {
                return;
            }
            setPeerDisplayNames((prev) => {
                const updated = {...prev};
                delete updated[socketId];
                return updated;
            });
            setPeerCamState((prev) => {
                const updated = {...prev};
                delete updated[socketId];
                return updated;
            });
            setNotice("A participant left the call.");
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
            noticeTimerRef.current = setTimeout(() => {
                setNotice("");
                noticeTimerRef.current = null;
            }, 2500);
        };

        const handlePeerCam = ({socketId, isCamOn}) => {
            if (!socketId || typeof isCamOn !== "boolean") {
                return;
            }
            setPeerCamState((prev) => ({...prev, [socketId]: isCamOn}));
        };

        if (!roomId) {
            navigate("/");
            return;
        }

        socket.on("meeting:rejected", handleRejected);
        socket.on("meeting:chat", handleChat);
        socket.on("meeting:peers", handlePeers);
        socket.on("meeting:peer-joined", handlePeerJoined);
        socket.on("meeting:peer-left", handlePeerLeft);
        socket.on("meeting:cam", handlePeerCam);

        socket.emit("meeting:join", {roomId, userId, displayName});
        socket.emit("meeting:cam", {roomId, isCamOn});

        return () => {
            socket.off("meeting:rejected", handleRejected);
            socket.off("meeting:chat", handleChat);
            socket.off("meeting:peers", handlePeers);
            socket.off("meeting:peer-joined", handlePeerJoined);
            socket.off("meeting:peer-left", handlePeerLeft);
            socket.off("meeting:cam", handlePeerCam);
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
                noticeTimerRef.current = null;
            }
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
                copyTimerRef.current = null;
            }
        };
    }, [displayName, isCamOn, isChatOpen, navigate, roomId, socket, userId]);

    const handleLeave = () => {
        socket.emit("meeting:leave", {roomId});
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        navigate("/");
    };

    const handleSendChat = (message) => {
        socket.emit("meeting:chat", {roomId, userId, displayName, message});
    };

    const shareInfo = useMemo(
        () => ({
            label: "Room ID",
            value: roomId,
        }),
        [roomId]
    );

    const handleCopy = async () => {
        if (!roomId) {
            return;
        }
        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = setTimeout(() => {
                setCopied(false);
                copyTimerRef.current = null;
            }, 1800);
        } catch (err) {
            console.error("Failed to copy room id", err);
        }
    };

    return (
        <PageShell>
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Meeting room</p>
                    <h1 className="mt-2 text-2xl font-semibold">Stay in sync</h1>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/70 px-3 py-1 text-xs text-[var(--muted)]"
                    >
                        ← Back to home
                    </button>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{shareInfo.label}</p>
                        <p className="text-sm font-semibold">{shareInfo.value}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`cursor-pointer rounded-full px-3 py-2 text-xs font-semibold transition ${
                            copied ? "bg-[var(--accent)] text-white" : "bg-black text-white"
                        }`}
                    >
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
            </header>

            <div className="group relative h-[55vh] max-h-[70vh] w-screen max-w-none -mx-6 rounded-none border-y border-[var(--panel-border)] bg-[var(--panel)] p-4 sm:h-[70vh] sm:max-h-[78vh] sm:rounded-3xl sm:border sm:mx-0 sm:w-full">
                {notice ? (
                    <div className="absolute left-6 top-6 z-10 rounded-full bg-white/90 px-3 py-1 text-xs text-[var(--muted)]">
                        {notice}
                    </div>
                ) : null}
                <VideoGrid
                    localStream={localStream}
                    peers={peersWithNames}
                    localLabel={displayName || "You"}
                    isLocalCamOn={isCamOn}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 hidden justify-center px-4 sm:flex">
                    <div className="pointer-events-auto rounded-2xl border border-[var(--panel-border)] bg-white/60 p-2 shadow-[var(--shadow)] opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                        <ControlBar
                            isMicOn={isMicOn}
                            isCamOn={isCamOn}
                            onToggleMic={toggleMic}
                            onToggleCam={toggleCam}
                            onToggleChat={() => setIsChatOpen((prev) => !prev)}
                            onLeave={handleLeave}
                        />
                    </div>
                </div>
            </div>

            <div className="-mt-2 flex justify-center sm:hidden">
                <div className="rounded-2xl border border-[var(--panel-border)] bg-white/60 p-2 shadow-[var(--shadow)]">
                    <ControlBar
                        isMicOn={isMicOn}
                        isCamOn={isCamOn}
                        onToggleMic={toggleMic}
                        onToggleCam={toggleCam}
                        onToggleChat={() => setIsChatOpen((prev) => !prev)}
                        onLeave={handleLeave}
                    />
                </div>
            </div>

            <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onSend={handleSendChat}
                incomingMessage={incomingMessage}
            />
            <ChatToast message={toastMessage} onClear={() => setToastMessage("")} />
        </PageShell>
    );
}
