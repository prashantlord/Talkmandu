export const getPartnerSocket = (io, socket, roomId) => {
    if (!roomId) {
        return null;
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
        return null;
    }

    const partnerId = [...room].find((id) => id !== socket.id);
    if (!partnerId) {
        return null;
    }

    return io.sockets.sockets.get(partnerId) || null;
};
