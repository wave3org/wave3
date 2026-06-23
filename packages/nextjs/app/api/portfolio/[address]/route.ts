import { NextRequest, NextResponse } from "next/server";

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
	const { address } = await params;
	const days = request.nextUrl.searchParams.get("days") || "30";

	const [positionsRes, earningsRes] = await Promise.all([
		fetch(`${PONDER_URL}/portfolio/positions/${address}?days=${days}`),
		fetch(`${PONDER_URL}/portfolio/earnings/${address}?days=${days}`)
	]);

	if (!positionsRes.ok || !earningsRes.ok) {
		return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 502 });
	}

	const [positions, earnings] = await Promise.all([positionsRes.json(), earningsRes.json()]);

	return NextResponse.json({ positions, earnings });
}
