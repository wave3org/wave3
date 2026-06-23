import { NextRequest, NextResponse } from "next/server";
import { fetchFeaturedSong } from "~~/services/songs/songService";

const FEATURED_CACHE_TTL = 60; // 1 minuto

export async function GET(_req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
	const { address } = await params;

	const song = await fetchFeaturedSong(address);
	if (!song) {
		return NextResponse.json({ song: null });
	}

	return NextResponse.json(
		{ song },
		{
			headers: {
				"Cache-Control": `public, s-maxage=${FEATURED_CACHE_TTL}, stale-while-revalidate=${FEATURED_CACHE_TTL * 2}`
			}
		}
	);
}
