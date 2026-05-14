const getRoomKey = (roomId) => `room:${roomId}:peers`;
const getChatKey = (roomId) => `room:${roomId}:chat`;
const getNameKey = (roomId) => `room:${roomId}:names`;

const MAX_CHAT_MESSAGES = 100;

const broadcastPeerLeft = (io, socket, roomId) => {
    socket.to(roomId).emit("meeting:peer-left", {socketId: socket.id});
};

const meetingHandlers = (io, socket, redisClient) => {
    socket.on("meeting:join", async ({roomId, userId, displayName}) => {
        if (!roomId) {
            return;
        }

        const peerCount = await redisClient.sCard(getRoomKey(roomId));

        if (peerCount >= 4) {
            socket.emit("meeting:rejected", {
                reason: "Room is full. Maximum 4 participants allowed.",
            });
            return;
        }

        await redisClient.sAdd(getRoomKey(roomId), socket.id);
        if (displayName) {
            await redisClient.hSet(getNameKey(roomId), socket.id, displayName);
        }
        socket.join(roomId);

        const peers = await redisClient.sMembers(getRoomKey(roomId));
        const existingPeers = peers.filter((id) => id !== socket.id);
        const peerNames = existingPeers.length
            ? await redisClient.hmGet(getNameKey(roomId), existingPeers)
            : [];
        const peerEntries = existingPeers.map((id, index) => ({
            socketId: id,
            displayName: peerNames[index] || null,
        }));

        socket.emit("meeting:peers", {peers: peerEntries});
        socket.to(roomId).emit("meeting:peer-joined", {socketId: socket.id, userId, displayName});
    });

    socket.on("meeting:offer", ({to, offer}) => {
        socket.to(to).emit("meeting:offer", {from: socket.id, offer});
    });

    socket.on("meeting:answer", ({to, answer}) => {
        socket.to(to).emit("meeting:answer", {from: socket.id, answer});
    });

    socket.on("meeting:ice", ({to, candidate}) => {
        socket.to(to).emit("meeting:ice", {from: socket.id, candidate});
    });

    socket.on("meeting:cam", ({roomId, isCamOn}) => {
        if (!roomId) {
            return;
        }
        socket.to(roomId).emit("meeting:cam", {socketId: socket.id, isCamOn});
    });

    socket.on("meeting:chat", async ({roomId, userId, displayName, message}) => {
        if (!roomId || !message) {
            return;
        }

        const payload = {userId, displayName, message, ts: Date.now()};
        await redisClient.rPush(getChatKey(roomId), JSON.stringify(payload));
        await redisClient.lTrim(getChatKey(roomId), -MAX_CHAT_MESSAGES, -1);
        socket.to(roomId).emit("meeting:chat", payload);
    });

    socket.on("meeting:leave", async ({roomId}) => {
        if (!roomId) {
            return;
        }

        await redisClient.sRem(getRoomKey(roomId), socket.id);
        await redisClient.hDel(getNameKey(roomId), socket.id);
        socket.leave(roomId);
        broadcastPeerLeft(io, socket, roomId);

        const remaining = await redisClient.sCard(getRoomKey(roomId));
        if (remaining === 0) {
            await redisClient.del(getRoomKey(roomId));
            await redisClient.del(getChatKey(roomId));
            await redisClient.del(getNameKey(roomId));
        }
    });

    socket.on("disconnecting", async () => {
        const rooms = [...socket.rooms].filter((room) => room !== socket.id);

        for (const roomId of rooms) {
            await redisClient.sRem(getRoomKey(roomId), socket.id);
            await redisClient.hDel(getNameKey(roomId), socket.id);
            broadcastPeerLeft(io, socket, roomId);

            const remaining = await redisClient.sCard(getRoomKey(roomId));
            if (remaining === 0) {
                await redisClient.del(getRoomKey(roomId));
                await redisClient.del(getChatKey(roomId));
                await redisClient.del(getNameKey(roomId));
            }
        }
    });
};

export default meetingHandlers;
