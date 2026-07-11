import { NextRequest, NextResponse } from "next/server";

const IPFS_GATEWAY =
	process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROD || "https://coral-accurate-peacock-411.mypinata.cloud/ipfs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ cid: string }> }) {
	const { cid } = await params;
	const range = req.headers.get("range");

	const upstreamHeaders: HeadersInit = {};
	if (range) upstreamHeaders["Range"] = range;

	const upstream = await fetch(`${IPFS_GATEWAY}/${cid}`, { headers: upstreamHeaders });

	const resHeaders = new Headers();
	resHeaders.set("Content-Type", upstream.headers.get("Content-Type") || "audio/mpeg");
	resHeaders.set("Accept-Ranges", "bytes");
	resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

	const contentLength = upstream.headers.get("Content-Length");
	if (contentLength) resHeaders.set("Content-Length", contentLength);

	const contentRange = upstream.headers.get("Content-Range");
	if (contentRange) resHeaders.set("Content-Range", contentRange);

	return new NextResponse(upstream.body, {
		status: upstream.status,
		headers: resHeaders
	});
}
