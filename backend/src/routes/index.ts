import { Router } from "express";
import productRouter from "./products/products.js";
import orderRouter from "./orders/orders.js";
import orderItemRouter from "./orderItems/orderItems.js"

const router = Router();

router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/orderItems", orderItemRouter);

export default router;