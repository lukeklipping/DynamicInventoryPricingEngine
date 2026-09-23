import { Router } from "express";
import { db } from "../../db.js"

const router = Router();

router.get("/", async (req, res) => {
    try {
        const orders = await db.orm.public.Order.all();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const order = await db.orm.public.Order.where({ id }).first()
        res.status(200).json(order)
    } catch (error) {
        console.error(`Error fetching order with id: ${id}`, error);
        res.status(500).json({ error: "server error" });
    }
});

export default router;