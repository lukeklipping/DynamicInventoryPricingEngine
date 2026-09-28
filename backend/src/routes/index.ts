import { Router } from "express";
import productRouter from "./productRoutes.js";
import orderRouter from "./orderRoutes.js";
import orderItemRouter from "./orderItemRoutes.js"
import checkoutRouter from "./checkoutRoutes.js"

const router = Router();

router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/orderItems", orderItemRouter);
router.use("/checkout", checkoutRouter);

export default router;