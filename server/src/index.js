import http from "http";
import express from "express";
import cors from "cors";
import {Server} from "socket.io";
import config from "./configs/env.js";
import {createRedisClient} from "./services/redisService.js";
import meetingHandlers from "./socket/meetingHandlers.js";
import randomHandlers from "./socket/randomHandlers.js";

const app = express();

app.get("/", (req, res) => {
    return res.json({message: "Talkmandu server alive"});
});

app.use(cors({
    origin: config.clientUrl, methods: ["GET", "POST"],
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: config.clientUrl, methods: ["GET", "POST"],
    },
});

const redisClient = createRedisClient();

await redisClient.connect();

const QUEUE_CLEANUP_INTERVAL = 60000;
const MAX_QUEUE_SIZE = 1000;

setInterval(async () => {
    try {
        const queueLen = await redisClient.lLen("random:queue");
        if (queueLen > MAX_QUEUE_SIZE) {
            await redisClient.lTrim("random:queue", 0, MAX_QUEUE_SIZE - 1);
            console.log(`Queue trimmed from ${queueLen} to ${MAX_QUEUE_SIZE}`);
        }

        const activeKeys = await redisClient.keys("random:active:*");
        for (const key of activeKeys) {
            const val = await redisClient.get(key);
            if (!val) {
                await redisClient.del(key);
            }
        }

        const queuedKeys = await redisClient.keys("random:queued:*");
        for (const key of queuedKeys) {
            const entry = await redisClient.get(key);
            if (!entry) {
                await redisClient.del(key);
            }
        }
    } catch (err) {
        console.error("Redis cleanup error", err);
    }
}, QUEUE_CLEANUP_INTERVAL);

io.on("connection", (socket) => {
    meetingHandlers(io, socket, redisClient);
    randomHandlers(io, socket, redisClient);
});

server.listen(config.port, () => {
    console.log(`Server listening on ${config.port}`);
});
