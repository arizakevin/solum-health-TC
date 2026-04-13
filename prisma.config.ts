import { defineConfig } from "prisma/config";

// `prisma generate` does not connect to the DB; a placeholder allows `npm install`
// when DATABASE_URL is unset (npm postinstall). Real commands (db push, migrate) still need .env.
// We use DIRECT_URL here so that CLI commands (db push, migrate, studio) bypass the connection pooler.
// Your Next.js app runtime uses PrismaClient with @prisma/adapter-pg, which connects via DATABASE_URL.
const cliDatabaseUrl =
	process.env.DIRECT_URL ??
	process.env.DATABASE_URL ??
	"postgresql://127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
	schema: "prisma/schema.prisma",
	datasource: {
		url: cliDatabaseUrl,
	},
});
