import {useEffect, useState} from "react";

export default function useLocalMedia(onCameraToggle) {
    const [localStream, setLocalStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

    useEffect(() => {
        let active = true;
        navigator.mediaDevices
            .getUserMedia({video: true, audio: true})
            .then((stream) => {
                if (active) {
                    setLocalStream(stream);
                }
            })
            .catch((err) => {
                console.error("Failed to access media", err);
            });

        return () => {
            active = false;
        };
    }, []);

    const toggleMic = () => {
        if (!localStream) {
            return;
        }
        localStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsMicOn((prev) => !prev);
    };

    const toggleCam = () => {
        if (!localStream) {
            return;
        }
        const [track] = localStream.getVideoTracks();
        if (!track) {
            return;
        }
        track.enabled = !track.enabled;
        setIsCamOn((prev) => {
            const next = !prev;
            if (onCameraToggle) {
                onCameraToggle(next);
            }
            return next;
        });
    };

    return {localStream, isMicOn, isCamOn, toggleMic, toggleCam};
}
