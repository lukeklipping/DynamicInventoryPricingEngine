import { db } from "../db.js"

type Product = Awaited<ReturnType<typeof db.orm.public.Product.all>>[number];
type Money = NonNullable<Product["currentPrice"]>;

function toMoney(value: number): Money {
    return value.toFixed(2) as Money;
}

// Current implementation uses absolute stock thresholds:
//   stock <= 5  -> +25%
//   stock <= 15 -> +10%
//   otherwise   -> base price
function getMultiplier(stock: number): number {
    if (stock <= 5) return 1.25;
    if (stock <= 15) return 1.10;
    return 1;
}

export async function runDynamicPricingEngine() {
    console.log("Running dynamic pricing engine evaluation...");

    try {
        const products = await db.orm.public.Product.all();

        for (const product of products) {
            const base = Number(product.basePrice);
            const multiplier = getMultiplier(product.stockQuantity);

            const newPrice = Math.round(base * 100 * multiplier) / 100;

            // Only write when the price actually changed
            if (Number(product.currentPrice) !== newPrice) {
                await db.orm.public.Product.where({ id: product.id }).update({
                    currentPrice: toMoney(newPrice),
                });
            }
            console.log(`[Pricing Engine] Updated product "${product.name}" price to $${newPrice} (Stock remaining: ${product.stockQuantity})`);
        }
    } catch (error) {
        console.error("Dynamic pricing engine failed:", error);
    }
}

export function startPricingWorker(intervalInMs = 30000) {
    console.log(`Starting dynamic pricing engine at interval ${intervalInMs / 1000}s`);

    runDynamicPricingEngine();

    return setInterval(runDynamicPricingEngine, intervalInMs);
}