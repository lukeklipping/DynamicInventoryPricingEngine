import { Router } from "express";
import { db } from "../../db.js"

const router = Router();

router.get("/", async (req, res) => {
    try {
        const orderItems = await db.orm.public.OrderItem.all();
        res.status(200).json(orderItems);
    } catch (error) {
        console.error("Error fetching orderItems:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const orderItem = await db.orm.public.OrderItem.where({ id }).first()
        res.status(200).json(orderItem)
    } catch (error) {
        console.error(`Error fetching orderItem with id: ${id}`, error);
        res.status(500).json({ error: "server error" });
    }
});

export default router;