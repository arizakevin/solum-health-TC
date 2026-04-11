import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ error: "Not implemented — Phase 2b" },
		{ status: 501 },
	);
}
