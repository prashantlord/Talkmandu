import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import ChatPanel from "../components/ChatPanel.jsx";
import ChatToast from "../components/ChatToast.jsx";
import PageShell from "../components/PageShell.jsx";
import RandomControlBar from "../components/RandomControlBar.jsx";
import VideoGrid from "../components/VideoGrid.jsx";
import useLocalMedia from "../hooks/useLocalMedia.js";
import usePeerConnection from "../hooks/usePeerConnection.js";
import useSocket from "../hooks/useSocket.js";
import {getUserId} from "../utils/uuid.js";
import {getDisplayName} from "../utils/name.js";

export default function RandomMeetingRoom() {
    const socket = useSocket();
    const navigate = useNavigate();
    const {localStream, isMicOn, isCamOn, toggleMic, toggleCam} = useLocalMedia();
    const [state, setState] = useState("idle");
    const [partnerId, setPartnerId] = useState(null);
    const [incomingMessage, setIncomingMessage] = useState(null);
    const [toastMessage, setToastMessage] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const [partnerName, setPartnerName] = useState(null);
    const userId = useMemo(() => getUserId(), []);
    const displayName = useMemo(() => getDisplayName(), []);

    const peer = usePeerConnection({
        localStream,
        onIceCandidate: (candidate) => {
            if (partnerId) {
                socket.emit("random:ice", {to: partnerId, candidate});
            }
        },
    });

    useEffect(() => {
        const handleMatched = async ({partnerSocketId, initiator, partnerDisplayName}) => {
            setPartnerId(partnerSocketId);
            setPartnerName(partnerDisplayName || null);
            setState("connected");
            setNotice("");
            if (initiator) {
                const offer = await peer.createOffer();
                socket.emit("random:offer", {to: partnerSocketId, offer});
            }
        };

        const handleWaiting = () => {
            setState("searching");
        };

        const handleOffer = async ({from, offer}) => {
            setPartnerId(from);
            setState("connected");
            await peer.setRemoteOffer(offer);
            const answer = await peer.createAnswer();
            socket.emit("random:answer", {to: from, answer});
        };

        const handleAnswer = async ({from, answer}) => {
            await peer.setRemoteAnswer(answer);
        };

        const handleIce = async ({candidate}) => {
            await peer.addIceCandidate(candidate);
        };

        const handleChat = ({message, ts, displayName: senderName, userId: senderId}) => {
            const label = senderName || (senderId ? senderId.slice(0, 6) : "Peer");
            setIncomingMessage({text: `${label}: ${message}`, ts, fromSelf: false});
            if (!isChatOpen) {
                setToastMessage(`${label}: ${message}`);
            }
        };

        const handlePartnerLeft = () => {
            peer.close();
            setPartnerId(null);
            setPartnerName(null);
            setNotice("Finding new match...");
            socket.emit("random:start", {userId, displayName});
            setState("searching");
        };

        socket.on("random:matched", handleMatched);
        socket.on("random:waiting", handleWaiting);
        socket.on("random:offer", handleOffer);
        socket.on("random:answer", handleAnswer);
        socket.on("random:ice", handleIce);
        socket.on("random:chat", handleChat);
        socket.on("random:partner-left", handlePartnerLeft);

        return () => {
            socket.off("random:matched", handleMatched);
            socket.off("random:waiting", handleWaiting);
            socket.off("random:offer", handleOffer);
            socket.off("random:answer", handleAnswer);
            socket.off("random:ice", handleIce);
            socket.off("random:chat", handleChat);
            socket.off("random:partner-left", handlePartnerLeft);
        };
    }, [displayName, isChatOpen, peer, socket, userId]);

    const handleSendChat = (message) => {
        if (!partnerId) {
            return;
        }
        socket.emit("random:chat", {to: partnerId, message, userId, displayName});
    };

    const handleStart = () => {
        if (state !== "idle") {
            return;
        }
        setNotice("");
        setState("searching");
        socket.emit("random:start", {userId, displayName});
    };

    const handleStop = () => {
        socket.emit("random:stop", {});
        peer.close();
        setState("idle");
        setPartnerId(null);
        setPartnerName(null);
    };

    const handleNext = () => {
        socket.emit("random:next", {userId, displayName});
        peer.close();
        setState("searching");
    };

    const handleLeave = () => {
        socket.emit("random:stop", {});
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        navigate("/");
    };

    return (
        <PageShell>
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Random meeting</p>
                    <h1 className="mt-2 text-2xl font-semibold">Find someone new</h1>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white/70 px-3 py-1 text-xs text-[var(--muted)]"
                    >
                        ← Back to home
                    </button>
                </div>
                <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
                    Status: {state}
                </div>
            </header>

            <div className="group relative h-[55vh] max-h-[70vh] w-screen max-w-none -mx-6 rounded-none border-y border-[var(--panel-border)] bg-[var(--panel)] p-4 sm:h-[70vh] sm:max-h-[78vh] sm:rounded-3xl sm:border sm:mx-0 sm:w-full">
                {state === "searching" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/70 text-white">
                        <div className="text-center">
                            <p className="text-lg font-semibold">Searching...</p>
                            <p className="text-sm text-white/70">Hang tight while we find a match.</p>
                        </div>
                    </div>
                )}
                {notice ? (
                    <div className="absolute left-6 top-6 z-10 rounded-full bg-white/90 px-3 py-1 text-xs text-[var(--muted)]">
                        {notice}
                    </div>
                ) : null}
                <VideoGrid
                    localStream={localStream}
                    peers={
                        partnerId
                            ? [{socketId: partnerId, remoteStream: peer.remoteStream, displayName: partnerName}]
                            : []
                    }
                    localLabel={displayName || "You"}
                    isLocalCamOn={isCamOn}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 hidden justify-center px-4 sm:flex">
                    <div className="pointer-events-auto rounded-2xl border border-[var(--panel-border)] bg-white/60 p-2 shadow-[var(--shadow)] opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                        <RandomControlBar
                            isMicOn={isMicOn}
                            isCamOn={isCamOn}
                            onToggleMic={toggleMic}
                            onToggleCam={toggleCam}
                            onToggleChat={() => setIsChatOpen((prev) => !prev)}
                            onLeave={handleLeave}
                            state={state}
                            onStart={handleStart}
                            onStop={handleStop}
                            onNext={handleNext}
                        />
                    </div>
                </div>
            </div>

            <div className="-mt-2 flex justify-center sm:hidden">
                <div className="rounded-2xl border border-[var(--panel-border)] bg-white/60 p-2 shadow-[var(--shadow)]">
                    <RandomControlBar
                        isMicOn={isMicOn}
                        isCamOn={isCamOn}
                        onToggleMic={toggleMic}
                        onToggleCam={toggleCam}
                        onToggleChat={() => setIsChatOpen((prev) => !prev)}
                        onLeave={handleLeave}
                        state={state}
                        onStart={handleStart}
                        onStop={handleStop}
                        onNext={handleNext}
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
