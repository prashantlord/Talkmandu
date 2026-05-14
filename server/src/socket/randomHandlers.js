const queueKey = "random:queue";
const activeKey = (socketId) => `random:active:${socketId}`;
const queuedKey = (socketId) => `random:queued:${socketId}`;
const nameKey = "random:names";

const queueTTLSeconds = 300;

const addToQueueWithTTL = async (redisClient, payload) => {
    const entry = JSON.stringify(payload);
    await redisClient.lPush(queueKey, entry);
    await redisClient.set(queuedKey(payload.socketId), entry, {EX: queueTTLSeconds});
};

const popFromQueue = async (redisClient) => {
    const entry = await redisClient.rPop(queueKey);
    if (!entry) {
        return null;
    }
    try {
        return JSON.parse(entry);
    } catch {
        return null;
    }
};

const pushToQueue = async (redisClient, payload) => {
    await addToQueueWithTTL(redisClient, payload);
};

const isSocketConnected = (io, socketId) => io.sockets.sockets.get(socketId);

const matchUsers = async (io, redisClient) => {
    const first = await popFromQueue(redisClient);
    if (!first) {
        return false;
    }

    const firstEntry = await redisClient.get(queuedKey(first.socketId));
    if (!firstEntry || firstEntry !== JSON.stringify(first)) {
        return false;
    }

    const second = await popFromQueue(redisClient);
    if (!second) {
        await addToQueueWithTTL(redisClient, first);
        return false;
    }

    const secondEntry = await redisClient.get(queuedKey(second.socketId));
    if (!secondEntry || secondEntry !== JSON.stringify(second)) {
        return false;
    }

    await redisClient.del(queuedKey(first.socketId));
    await redisClient.del(queuedKey(second.socketId));

    const firstSocket = isSocketConnected(io, first.socketId);
    const secondSocket = isSocketConnected(io, second.socketId);

    if (!firstSocket || !secondSocket) {
        if (firstSocket) {
            await addToQueueWithTTL(redisClient, first);
        }
        if (secondSocket) {
            await addToQueueWithTTL(redisClient, second);
        }
        return false;
    }

    await redisClient.set(activeKey(first.socketId), second.socketId, {EX: queueTTLSeconds});
    await redisClient.set(activeKey(second.socketId), first.socketId, {EX: queueTTLSeconds});

    const firstName = first.displayName || (await redisClient.hGet(nameKey, first.socketId));
    const secondName = second.displayName || (await redisClient.hGet(nameKey, second.socketId));

    firstSocket.emit("random:matched", {
        partnerSocketId: second.socketId,
        initiator: true,
        partnerDisplayName: secondName || null,
    });
    secondSocket.emit("random:matched", {
        partnerSocketId: first.socketId,
        initiator: false,
        partnerDisplayName: firstName || null,
    });

    return true;
};

const clearActivePair = async (redisClient, socketId, partnerId) => {
    await redisClient.del(activeKey(socketId));
    if (partnerId) {
        await redisClient.del(activeKey(partnerId));
    }
};

const clearFromQueue = async (redisClient, socketId) => {
    const entry = await redisClient.get(queuedKey(socketId));
    if (entry) {
        await redisClient.lRem(queueKey, 0, entry);
        await redisClient.del(queuedKey(socketId));
    }
};

const randomHandlers = (io, socket, redisClient) => {
    socket.on("random:start", async ({userId, displayName}) => {
        await clearFromQueue(redisClient, socket.id);
        if (displayName) {
            await redisClient.hSet(nameKey, socket.id, displayName);
        }
        await pushToQueue(redisClient, {userId, socketId: socket.id, displayName});
        const matched = await matchUsers(io, redisClient);
        if (!matched) {
            socket.emit("random:waiting", {});
        }
    });

    socket.on("random:offer", ({to, offer}) => {
        socket.to(to).emit("random:offer", {from: socket.id, offer});
    });

    socket.on("random:answer", ({to, answer}) => {
        socket.to(to).emit("random:answer", {from: socket.id, answer});
    });

    socket.on("random:ice", ({to, candidate}) => {
        socket.to(to).emit("random:ice", {from: socket.id, candidate});
    });

    socket.on("random:chat", ({to, message, userId, displayName}) => {
        socket.to(to).emit("random:chat", {message, userId, displayName, ts: Date.now()});
    });

    socket.on("random:next", async ({userId, displayName}) => {
        const partnerId = await redisClient.get(activeKey(socket.id));
        await clearActivePair(redisClient, socket.id, partnerId);
        await clearFromQueue(redisClient, socket.id);

        if (partnerId) {
            io.to(partnerId).emit("random:partner-left", {});
            await clearFromQueue(redisClient, partnerId);
            const partnerName = await redisClient.hGet(nameKey, partnerId);
            await pushToQueue(redisClient, {userId, socketId: partnerId, displayName: partnerName || null});
        }

        await pushToQueue(redisClient, {userId, socketId: socket.id, displayName});
        const matched = await matchUsers(io, redisClient);
        if (!matched) {
            socket.emit("random:waiting", {});
            if (partnerId) {
                io.to(partnerId).emit("random:waiting", {});
            }
        }
    });

    socket.on("random:stop", async () => {
        const partnerId = await redisClient.get(activeKey(socket.id));
        await clearActivePair(redisClient, socket.id, partnerId);
        await clearFromQueue(redisClient, socket.id);
        await redisClient.hDel(nameKey, socket.id);

        if (partnerId) {
            io.to(partnerId).emit("random:partner-left", {});
        }
    });

    socket.on("disconnecting", async () => {
        const partnerId = await redisClient.get(activeKey(socket.id));
        await clearActivePair(redisClient, socket.id, partnerId);
        await clearFromQueue(redisClient, socket.id);
        await redisClient.hDel(nameKey, socket.id);
        if (partnerId) {
            io.to(partnerId).emit("random:partner-left", {});
        }
    });
};

export default randomHandlers;
