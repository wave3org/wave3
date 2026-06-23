import { NextRequest, NextResponse } from "next/server";
import { fetchFeaturedSong } from "~~/services/songs/songService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
	const { address } = await params;

	const song = await fetchFeaturedSong(address);
	if (!song) {
		return NextResponse.json({ song: null });
	}

	return NextResponse.json({ song });
}
