import { Router, type Response, type Request } from "express";
import { db } from "../db.js";
import redis from "../redis.js";

type Money = Parameters<typeof db.orm.public.Order.create>[0]["totalAmount"];

const router = Router();

class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

router.post("/", async (req: Request, res: Response) => {
    const { productId, quantity, idempotencyKey } = req.body;

    if (!productId || !Number.isInteger(quantity) || quantity <= 0 || !idempotencyKey) {
        return res
            .status(400)
            .json({ error: "Missing or invalid fields: productId, quantity, idempotencyKey." });
    }

    const stockKey = `product:stock:${productId}`;
    let reserved = false;

    try {

        // validate order is not processed
        const existingOrder = await db.orm.public.Order.where({ idempotencyKey }).first();
        if (existingOrder) {
            return res.status(200).json({ message: "Order already processed.", order: existingOrder });
        }

        const product = await db.orm.public.Product.where({ id: productId }).first();
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        await redis.set(stockKey, product.stockQuantity, "NX");

        const remainingStock = await redis.decrby(stockKey, quantity);
        if (remainingStock < 0) {
            await redis.incrby(stockKey, quantity);
            return res.status(409).json({ error: "Out of stock! Purchase failed due to high demand." });
        }
        reserved = true;

        const order = await db.transaction(async (tx) => {
            const current = await tx.orm.public.Product.where({ id: productId }).first();
            if (!current || current.stockQuantity < quantity) {
                throw new HttpError(409, "Out of stock.");
            }

            const updated = await tx.orm.public.Product
                .where({ id: productId, version: current.version })
                .update({
                    stockQuantity: current.stockQuantity - quantity,
                    version: current.version + 1,
                });
            if (!updated) {
                throw new HttpError(409, "Stock changed while ordering, please retry.");
            }

            const totalCents = Math.round(Number(current.currentPrice) * 100) * quantity;

            return tx.orm.public.Order.create({
                totalAmount: (totalCents / 100).toFixed(2) as Money,
                status: "CONFIRMED",
                idempotencyKey,
                items: (p) =>
                    p.create([{ productId, quantity, pricePaid: current.currentPrice }]),
            });
        });
        reserved = false;

        const fullOrder = await db.orm.public.Order
            .where({ id: order.id })
            .include("items")
            .first();

        return res.status(201).json(fullOrder);
    } catch (error) {
        if (reserved) {
            await redis.incrby(stockKey, quantity);
        }

        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }

        if ((error as { sqlState?: string }).sqlState === "23505") {
            const order = await db.orm.public.Order.where({ idempotencyKey }).first();
            return res.status(200).json({ message: "Order already processed.", order });
        }

        console.error("Error creating order:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;