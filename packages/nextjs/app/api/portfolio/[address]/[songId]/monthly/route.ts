import { NextRequest, NextResponse } from "next/server";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ address: string; songId: string }> }) {
	const { address, songId } = await params;

	const res = await fetch(`${PONDER_URL}/portfolio/earnings/${address.toLowerCase()}/${songId}/monthly?months=6`);

	if (!res.ok) {
		return NextResponse.json({ error: "Failed to fetch monthly earnings" }, { status: 502 });
	}

	const data = await res.json();

	// Transform [{ month, earned }] → { "YYYY-MM": "wei_string" }
	const result: Record<string, string> = {};
	for (const item of data.items ?? []) {
		result[item.month] = item.earned;
	}

	return NextResponse.json(result);
}
