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
    const { name, description, basePrice, stockQuantity } = req.body ?? {};

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
        return res.status(400).json({ error: "stockQuantity must be a non-negative integer." });
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
    const {id} = req.params;
    const body = req.body ?? {};
    const allowed = ["name", "description", "basePrice", "stockQuantity"];

    const unknown = Object.keys(body).filter((k) => !allowed.includes(k));

    if (unknown.length > 0){
        return res.status(400).json({error: `Unknown fields in request ${unknown}`});
    }
    
    if(Object.keys(body).length === 0){
        return res.status(400).json({error: "Request must have fields"});
    }

    if("name" in body && (typeof body.name !== "string" || body.name.trim() == "")){
        return res.status(400).json({error: "name is required in body"});
    }

    if("description" in body && typeof body.name !== "string" && body.description != null){
        return res.status(400).json({error: "description must be a string or null."});
    }

    const newBase = "basePrice" in body ? parsePrice(body.basePrice) : undefined;
    if(newBase === null){
        return res.status(400).json({error: "base price cannot be null."})
    }

    if("stockQuanitiy" in body && !isValidStock(body.stockQuanitiy)){
        return res.status(400).json({ error: "stockQuantity must be a non-negative integer." }); 
    }

    try{
        const current = await db.orm.public.Product.first();
        if(!current){
            return res.status(404).json({error: "product not found."})
        }

        const base = newBase ?? Number(current.basePrice);
        const stock: number = body.stockQuantity ?? current.stockQuantity;

        // Same optimistic lock as checkout: if a purchase lands between our read
        // and this write, the version won't match and we refuse instead of
        // silently overwriting the stock it just decremented.
        const updated = await db.orm.public.Product
            .where({ id, version: current.version })
            .update({
                ...("name" in body && { name: body.name.trim() }),
                ...("description" in body && { description: body.description }),
                basePrice: toMoney(base),
                currentPrice: toMoney(computePrice(base, stock)),
                stockQuantity: stock,
                version: current.version + 1,
            });
        if (!updated) {
            return res.status(409).json({ error: "Product changed while updating, please retry." })
;
        }

        // Checkout seeds Redis from the DB only when the key is missing (SET NX),
        // so drop the cached count to make it pick up the new stock.
        if ("stockQuantity" in body) {
            await redis.del(`product:stock:${id}`);
        }

        const product = await db.orm.public.Product.where({ id }).first();
        res.status(200).json(product);
    } catch (error) {
        console.error(`Error updating product with id: ${id}`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
