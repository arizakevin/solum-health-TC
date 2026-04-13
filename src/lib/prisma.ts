import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		max: process.env.VERCEL === "1" ? 3 : 10,
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 10_000,
	});
	const adapter = new PrismaPg(pool);

	return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
	globalForPrisma.prisma = prisma;
}
