import { Redis } from "ioredis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl);

redis.on("connect", () => {
    console.log("Connected to Redis successfully!");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export default redis;