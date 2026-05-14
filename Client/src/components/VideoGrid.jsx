import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({localStream, peers, localLabel = "You", isLocalCamOn}) {
    const totalTiles = 1 + peers.length;
    const gridCols = totalTiles === 1 ? "grid-cols-1" : "grid-cols-2";
    const gridRows = totalTiles >= 3 ? "grid-rows-2 auto-rows-fr" : "";
    const centerLast = totalTiles === 3;

    return (
        <div className={`grid h-full w-full items-stretch gap-4 ${gridCols} ${gridRows}`}>
            <VideoTile stream={localStream} muted label={localLabel} videoOn={isLocalCamOn} />
            {peers.map((peer, index) => (
                <VideoTile
                    key={peer.socketId}
                    stream={peer.remoteStream}
                    muted={false}
                    label={peer.displayName || `Peer ${index + 1}`}
                    videoOn={peer.isCamOn}
                    className={
                        centerLast && index === peers.length - 1
                            ? "col-span-2 w-full max-w-[calc(50%-0.5rem)] justify-self-center"
                            : ""
                    }
                />
            ))}
        </div>
    );
}
