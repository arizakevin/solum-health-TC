import { defineConfig } from "prisma/config";

// `prisma generate` does not connect to the DB; a placeholder allows `npm install`
// when DATABASE_URL is unset (npm postinstall). Real commands (db push, migrate) still need .env.
const databaseUrl =
	process.env.DATABASE_URL ??
	"postgresql://127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
	schema: "prisma/schema.prisma",
	datasource: {
		url: databaseUrl,
	},
});
