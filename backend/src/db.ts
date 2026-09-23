import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../generated/prisma/contract.js";
import contractJson from "../generated/prisma/contract.json" with { type: "json" };
import "temporal-polyfill/global";

export const db = postgres<Contract>({
    url: process.env.DATABASE_URL!,
    contractJson,
});