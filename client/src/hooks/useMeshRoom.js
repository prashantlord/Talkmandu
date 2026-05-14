import {useCallback, useEffect, useMemo, useRef, useState} from "react";

const STUN_SERVERS = {
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:stun1.l.google.com:19302"},
    ],
};

export default function useMeshRoom({socket, localStream, initialPeers = []}) {
    const [peers, setPeers] = useState([]);
    const connectionsRef = useRef(new Map());
    const initialHandledRef = useRef(false);
    const pendingOffersRef = useRef([]);

    const syncPeers = useCallback(() => {
        setPeers(
            Array.from(connectionsRef.current.entries()).map(([id, data]) => ({
                socketId: id,
                remoteStream: data.remoteStream,
                displayName: data.displayName,
            }))
        );
    }, []);

    const removePeer = useCallback(
        (socketId) => {
            const existing = connectionsRef.current.get(socketId);
            if (existing?.pc) {
                existing.pc.onicecandidate = null;
                existing.pc.ontrack = null;
                existing.pc.close();
            }
            connectionsRef.current.delete(socketId);
            syncPeers();
        },
        [syncPeers]
    );

    const createPeerConnection = useCallback(
        (socketId, displayName) => {
            if (connectionsRef.current.has(socketId)) {
                const existing = connectionsRef.current.get(socketId);
                if (displayName && existing.displayName !== displayName) {
                    existing.displayName = displayName;
                    connectionsRef.current.set(socketId, existing);
                    syncPeers();
                }
                return existing;
            }

            const pc = new RTCPeerConnection(STUN_SERVERS);

            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    pc.addTrack(track, localStream);
                });
            }

            const entry = {
                pc,
                remoteStream: null,
                displayName,
                createOffer: async () => {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    return offer;
                },
                createAnswer: async () => {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    return answer;
                },
                setRemoteOffer: async (offer) => {
                    await pc.setRemoteDescription(offer);
                },
                setRemoteAnswer: async (answer) => {
                    await pc.setRemoteDescription(answer);
                },
                addIceCandidate: async (candidate) => {
                    if (candidate) {
                        await pc.addIceCandidate(candidate);
                    }
                },
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("meeting:ice", {to: socketId, candidate: event.candidate});
                }
            };

            pc.ontrack = (event) => {
                const [stream] = event.streams;
                if (stream) {
                    entry.remoteStream = stream;
                    connectionsRef.current.set(socketId, entry);
                    syncPeers();
                }
            };

            connectionsRef.current.set(socketId, entry);
            syncPeers();
            return entry;
        },
        [localStream, socket, syncPeers]
    );

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handlePeerJoined = ({socketId, displayName}) => {
            createPeerConnection(socketId, displayName);
        };

        const handleOffer = async ({from, offer}) => {
            if (!localStream) {
                pendingOffersRef.current.push({from, offer});
                return;
            }
            const peerApi = createPeerConnection(from);
            await peerApi.setRemoteOffer(offer);
            const answer = await peerApi.createAnswer();
            socket.emit("meeting:answer", {to: from, answer});
        };

        const handleAnswer = async ({from, answer}) => {
            const existing = connectionsRef.current.get(from);
            if (!existing) {
                return;
            }
            await existing.setRemoteAnswer(answer);
        };

        const handleIce = async ({from, candidate}) => {
            const existing = connectionsRef.current.get(from);
            if (!existing) {
                return;
            }
            await existing.addIceCandidate(candidate);
        };

        const handlePeerLeft = ({socketId}) => {
            removePeer(socketId);
        };

        socket.on("meeting:peer-joined", handlePeerJoined);
        socket.on("meeting:offer", handleOffer);
        socket.on("meeting:answer", handleAnswer);
        socket.on("meeting:ice", handleIce);
        socket.on("meeting:peer-left", handlePeerLeft);

        return () => {
            socket.off("meeting:peer-joined", handlePeerJoined);
            socket.off("meeting:offer", handleOffer);
            socket.off("meeting:answer", handleAnswer);
            socket.off("meeting:ice", handleIce);
            socket.off("meeting:peer-left", handlePeerLeft);
        };
    }, [createPeerConnection, localStream, removePeer, socket]);

    useEffect(() => {
        if (!localStream) {
            return;
        }
        connectionsRef.current.forEach((entry) => {
            const senders = entry.pc.getSenders();
            localStream.getTracks().forEach((track) => {
                const exists = senders.some((sender) => sender.track === track);
                if (!exists) {
                    entry.pc.addTrack(track, localStream);
                }
            });
        });
    }, [localStream]);

    useEffect(() => {
        if (initialHandledRef.current || initialPeers.length === 0 || !localStream) {
            return;
        }
        initialHandledRef.current = true;
        const connectInitialPeers = async () => {
            for (const peerId of initialPeers) {
                const peerApi = createPeerConnection(peerId);
                const offer = await peerApi.createOffer();
                socket.emit("meeting:offer", {to: peerId, offer});
            }
        };
        connectInitialPeers();
    }, [createPeerConnection, initialPeers, localStream, socket]);

    useEffect(() => {
        if (!localStream || pendingOffersRef.current.length === 0) {
            return;
        }
        const pending = [...pendingOffersRef.current];
        pendingOffersRef.current = [];
        const answerPending = async () => {
            for (const {from, offer} of pending) {
                const peerApi = createPeerConnection(from);
                await peerApi.setRemoteOffer(offer);
                const answer = await peerApi.createAnswer();
                socket.emit("meeting:answer", {to: from, answer});
            }
        };
        answerPending();
    }, [createPeerConnection, localStream, socket]);

    return useMemo(() => ({peers}), [peers]);
}
