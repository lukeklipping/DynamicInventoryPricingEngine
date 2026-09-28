import { Router } from "express";
import { db } from "../db.js"

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

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const product = await db.orm.public.Product.where({ id }).first()
        res.status(200).json(product)
    } catch (error) {
        console.error(`Error fetching product with id: ${id}`, error);
        res.status(500).json({ error: "server error" });
    }
});

export default router;