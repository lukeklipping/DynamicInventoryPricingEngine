import type { Numeric } from "@prisma/orm-postgres/target/codec-types";
import { db } from "../src/db.js";

async function main() {
    console.log("Seeding database...");

    const existing = await db.orm.public.Product.first();
    if (existing) {
        console.log("Products already exist, skipping seed.");
        return;
    }

    await db.orm.public.Product.createAll([
        {
            name: "Limited Edition Mechanical Keyboard",
            description: "Custom hot-swappable RGB mechanical keyboard with tactile switches.",
            basePrice: "150.00" as Numeric<10, 2>,
            currentPrice: "150.00" as Numeric<10, 2>,
            stockQuantity: 20,
        },
        {
            name: "Ultra-Wide Gaming Monitor 34-inch",
            description: "144Hz 1ms curved IPS monitor for immersive workflows and gaming.",
            basePrice: "400.00" as Numeric<10, 2>,
            currentPrice: "400.00" as Numeric<10, 2>,
            stockQuantity: 10,
        },
        {
            name: "Ergonomic Wireless Mouse",
            description: "Precision wireless mouse with adjustable DPI and scroll wheel.",
            basePrice: "75.00" as Numeric<10, 2>,
            currentPrice: "75.00" as Numeric<10, 2>,
            stockQuantity: 50,
        },
    ]);

    console.log("Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.close();
    });