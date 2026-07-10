import { NextRequest, NextResponse } from "next/server";

const ALCHEMY_FALLBACK = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "cR4WnXePioePZ5fFrnSiR"}`;
const RPC_URL = process.env.RPC_URL_84532 || ALCHEMY_FALLBACK;

export async function POST(req: NextRequest) {
	const body = await req.json();

	const response = await fetch(RPC_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});

	const data = await response.json();
	return NextResponse.json(data, { status: response.status });
}
