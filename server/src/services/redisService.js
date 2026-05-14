import {createClient} from "redis";
import config from "../configs/env.js";

export const createRedisClient = () => {
    const client = createClient({url: config.redisUrl});

    client.on("error", (err) => {
        console.error("Redis error", err);
    });

    return client;
};
