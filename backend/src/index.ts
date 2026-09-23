import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./redis.js"; // Import to initialize Redis connection
import router from "./routes/index.js"


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', router);

// Basic health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", message: "Inventory & Pricing Engine API is running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
