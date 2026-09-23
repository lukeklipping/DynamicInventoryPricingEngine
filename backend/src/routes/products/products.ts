import { Router } from "express";
import { db } from "../../db.js"

const router = Router();

router.get("/", async (req, res) => {
    try {
        const products = await db.orm.public.Product.all();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;