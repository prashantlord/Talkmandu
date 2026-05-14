import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 5000,
    clientUrl: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
}

export default config;
