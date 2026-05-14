import {useCallback, useEffect, useMemo, useRef, useState} from "react";

const STUN_SERVERS = {
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:stun1.l.google.com:19302"},
    ],
};

export default function usePeerConnection({localStream, onIceCandidate}) {
    const [remoteStream, setRemoteStream] = useState(null);
    const pcRef = useRef(null);

    const ensurePeerConnection = useCallback(() => {
        if (pcRef.current) {
            return pcRef.current;
        }

        const pc = new RTCPeerConnection(STUN_SERVERS);
        pcRef.current = pc;

        if (localStream) {
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && onIceCandidate) {
                onIceCandidate(event.candidate);
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) {
                setRemoteStream(stream);
            }
        };

        return pc;
    }, [localStream, onIceCandidate]);

    useEffect(() => {
        if (!localStream || !pcRef.current) {
            return;
        }
        const senders = pcRef.current.getSenders();
        localStream.getTracks().forEach((track) => {
            const exists = senders.some((sender) => sender.track === track);
            if (!exists) {
                pcRef.current.addTrack(track, localStream);
            }
        });
    }, [localStream]);

    const createOffer = useCallback(async () => {
        const pc = ensurePeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return offer;
    }, [ensurePeerConnection]);

    const createAnswer = useCallback(async () => {
        const pc = ensurePeerConnection();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        return answer;
    }, [ensurePeerConnection]);

    const setRemoteOffer = useCallback(async (offer) => {
        const pc = ensurePeerConnection();
        await pc.setRemoteDescription(offer);
    }, [ensurePeerConnection]);

    const setRemoteAnswer = useCallback(async (answer) => {
        const pc = ensurePeerConnection();
        await pc.setRemoteDescription(answer);
    }, [ensurePeerConnection]);

    const addIceCandidate = useCallback(async (candidate) => {
        if (!candidate) {
            return;
        }
        const pc = ensurePeerConnection();
        await pc.addIceCandidate(candidate);
    }, [ensurePeerConnection]);

    const close = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.onicecandidate = null;
            pcRef.current.ontrack = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        setRemoteStream(null);
    }, []);

    return useMemo(
        () => ({
            remoteStream,
            createOffer,
            createAnswer,
            setRemoteOffer,
            setRemoteAnswer,
            addIceCandidate,
            close,
        }),
        [
            remoteStream,
            createOffer,
            createAnswer,
            setRemoteOffer,
            setRemoteAnswer,
            addIceCandidate,
            close,
        ]
    );
}
