import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import checkoutRouter from "../routes/checkout/checkout.js";

vi.mock("../redis.js", async () => {
    const { default: RedisMock } = await import("ioredis-mock");
    return { default: new RedisMock() };
});

vi.mock("../db.js", () => {
    let stock = 5;
    let version = 1;
    let storedOrder: any = null;

    const productRow = () => ({
        id: "test-product-id",
        stockQuantity: stock,
        version,
        currentPrice: "100.00",
    });

    const productQuery = () => ({
        first: async () => productRow(),
        update: async (data: any) => {
            stock = data.stockQuantity;
            version = data.version;
            return productRow();
        },
    });

    const orderQuery = (query: any) => {
        const match = () => {
            if (!storedOrder) return null;
            if (query.idempotencyKey && storedOrder.idempotencyKey === query.idempotencyKey) return storedOrder;
            if (query.id && storedOrder.id === query.id) return storedOrder;
            return null;
        };
        return {
            first: async () => match(),
            include: () => ({ first: async () => match() }),
        };
    };

    const createOrder = async (data: any) => {
        storedOrder = { id: "order-uuid-123", ...data };
        return storedOrder;
    };

    return {
        db: {
            orm: {
                public: {
                    Product: { where: productQuery },
                    Order: { where: orderQuery },
                },
            },
            transaction: async (cb: any) =>
                cb({
                    orm: {
                        public: {
                            Product: { where: productQuery },
                            Order: { create: createOrder },
                        },
                    },
                }),
        },
    };
});

const app = express();
app.use(express.json());
app.use("/api/checkout", checkoutRouter);

describe("POST /api/checkout", () => {
    it("should successfully process a valid checkout request", async () => {
        const response = await request(app)
            .post("/api/checkout")
            .send({ productId: "test-product-id", quantity: 2, idempotencyKey: "key-abc-123" });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id", "order-uuid-123");
    });

    it("should return idempotent replay on duplicate idempotencyKey", async () => {
        const response = await request(app)
            .post("/api/checkout")
            .send({ productId: "test-product-id", quantity: 2, idempotencyKey: "key-abc-123" });

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/already processed/i);
    });

    it("should reject checkout with 409 if quantity exceeds stock", async () => {
        const response = await request(app)
            .post("/api/checkout")
            .send({ productId: "test-product-id", quantity: 100, idempotencyKey: "key-out-of-stock" });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty("error");
    });
});