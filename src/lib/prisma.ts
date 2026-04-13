import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
		max: process.env.VERCEL === "1" ? 3 : 10,
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 10_000,
	});

	return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
	globalForPrisma.prisma = prisma;
}
