import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./redis.js"; // Import to initialize Redis connection

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", message: "Inventory & Pricing Engine API is running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
