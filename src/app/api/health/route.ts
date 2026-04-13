import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
	const checks: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		database_url_set: !!process.env.DATABASE_URL,
		database_url_host: (() => {
			try {
				const url = new URL(
					(process.env.DATABASE_URL ?? "").replace(
						/^postgresql:/i,
						"postgres:",
					),
				);
				return `${url.hostname}:${url.port || "5432"}`;
			} catch {
				return "parse_error";
			}
		})(),
	};

	try {
		const count = await prisma.case.count();
		checks.prisma = "ok";
		checks.case_count = count;
	} catch (err: unknown) {
		const e = err as Error & { code?: string; meta?: unknown };
		checks.prisma = "error";
		checks.error_name = e.name;
		checks.error_code = e.code;
		checks.error_message = e.message;
		checks.error_meta = e.meta;
	}

	const ok = checks.prisma === "ok";
	return NextResponse.json(checks, { status: ok ? 200 : 503 });
}
