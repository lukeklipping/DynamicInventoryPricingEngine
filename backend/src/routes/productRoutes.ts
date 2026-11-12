import { Router } from "express";
import { db } from "../db.js"
import redis from "../redis.js";
import { computePrice, toMoney } from "../workers/pricingWorker.js";

const router = Router();

const MAX_PRICE = 99_999_999.99; // Numeric(10, 2)

function parsePrice(value: unknown): number | null {
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0 || n > MAX_PRICE) return null;
    if (Math.round(n * 100) !== n * 100) return null; // at most 2 decimals
    return n;
}

function isValidStock(value: unknown): value is number {
    return Number.isInteger(value) && (value as number) >= 0;
}

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


router.post("/", async (req, res) => {
    const { name, description, basePrice, stockQuantity } = req.params ?? {};

    const base = parsePrice(basePrice);
    if(typeof name !== "string" || name.trim() == ""){
        return res.status(400).json({error: "name is required"})
    }

    if(typeof description !== "string" && description != null){
        return res.status(400).json({error: "description must be string."})
    }

    if(base === null){
        return res.status(400).json({error: "base price cannot be null."})
    }

    if(!isValidStock(stockQuantity)){
        return res.status(400);
    }

    try{
        const product = await db.orm.public.Product.create({
            name: name.trim(),
            description: description ?? null,
            basePrice: toMoney(base),
            currentPrice: toMoney(computePrice(base, stockQuantity)),
            stockQuantity
        });
        res.status(201).json(product);
    } catch(error){
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.patch("/:id", async (req, res) => {
    try{

    } catch (error){
        
    }
});

export default router;
