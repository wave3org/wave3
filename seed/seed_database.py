#!/usr/bin/env python3
"""Seeds the chain with FMA music data. Run `make seed` or `make seed-sepolia`."""

import asyncio
import json
import os
import random
import re
import time
from pathlib import Path
from urllib.parse import quote

import aiohttp
import pandas as pd
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder

NETWORK = os.environ.get("NETWORK", "localhost")
ROOT = Path(__file__).resolve().parent.parent
FMA_SMALL = ROOT / "downloads" / "fma_small"
FMA_META = ROOT / "downloads" / "fma_metadata"
DEPLOYMENTS = ROOT / "packages" / "hardhat" / "deployments" / NETWORK

STORAGE_URL = {
    "localhost": "http://localhost:3001/upload",
    "sepolia": "https://storage-5gx1.onrender.com/upload",
    "baseSepolia": "https://storage-5gx1.onrender.com/upload",
}[NETWORK]

ALCHEMY_KEY = os.environ.get("ALCHEMY_API_KEY", "")
RPC_URL = os.environ.get("RPC_URL") or {
    "localhost": "http://127.0.0.1:8545",
    "sepolia": f"https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_KEY}" if ALCHEMY_KEY else "https://rpc.sepolia.org",
    "baseSepolia": f"https://base-sepolia.g.alchemy.com/v2/{ALCHEMY_KEY}" if ALCHEMY_KEY else "https://sepolia.base.org",
}[NETWORK]

PRIVATE_KEY = os.environ.get("DEPLOYER_PRIVATE_KEY", "")
if NETWORK != "localhost" and not PRIVATE_KEY:
    print("Set DEPLOYER_PRIVATE_KEY for non-local networks")
    exit()

SAMPLE_SIZE = int(os.environ.get("SAMPLE_SIZE") or 50)
MAX_SONGS_PER_ALBUM = 5
MAX_PARALLEL = 10
RANDOM_SEED = int(os.environ.get("SEED") or 123)
TARGET_SONGS = int(os.environ.get("TARGET_SONGS") or 0)  # 0 = use SAMPLE_SIZE

PLAY_FEE = Web3.to_wei(1, "ether")  # default, overridden per song
BUY_PRICE = Web3.to_wei(10, "ether")  # default, overridden per song
TOTAL_PARTS = 100
NON_SELLABLE_PARTS = 30


def random_song_prices(rng: random.Random):
    """Generate random play fee (1-5 WAVE) and buy price (10-20 WAVE)."""
    play_fee = rng.randint(1, 5)
    buy_price = rng.randint(10, 20)
    return (
        Web3.to_wei(play_fee, "ether"),
        Web3.to_wei(buy_price, "ether"),
    )

FMA_PREFIX = "https://freemusicarchive.org/file/"
FMA_IMG = "https://freemusicarchive.org/image/"
COVER_WIDTH = 290
COVER_HEIGHT = 290


def mp3_path(track_id):
    """Build the local path to an FMA mp3 file.
    track_id: int - FMA track id
    returns: Path - e.g. downloads/fma_small/002/002345.mp3
    """
    tid = f"{track_id:06d}"
    return FMA_SMALL / tid[:3] / f"{tid}.mp3"


def cover_url(image_file):
    """Convert an FMA image_file URL to a resized cover URL.
    image_file: str - raw FMA image URL from metadata
    returns: str or None - resized image URL, None if invalid
    """
    text = str(image_file)
    if not text.startswith(FMA_PREFIX):
        return None
    rel = text[len(FMA_PREFIX):]
    return f"{FMA_IMG}?file={quote(rel, safe='')}&width={COVER_WIDTH}&height={COVER_HEIGHT}&type=album"


def parse_year(date_released):
    """Extract the year from an FMA date string like '1/05/2009'.
    date_released: str - FMA date string (M/DD/YYYY)
    returns: int - year, or 0 if unparseable
    """
    text = str(date_released)
    match = re.search(r"(\d{4})", text)
    if match:
        return int(match.group(1))
    return 0


def parse_genre(tracks):
    """Extract the first genre title from a set of album tracks.
    tracks: DataFrame - album tracks with track_genres column
    returns: str - genre name (max 50 chars), or "" if none found
    """
    for _, t in tracks.iterrows():
        raw = str(t.get("track_genres", ""))
        match = re.search(r"'genre_title':\s*'([^']+)'", raw)
        if match:
            return match.group(1)[:50]
    return ""


def load_contract(w3, name):
    """Load a deployed contract by name from the deployments folder.
    w3: Web3 - web3 instance
    name: str - contract name (e.g. "SongsFactory")
    returns: Contract - web3 contract instance
    """
    with open(DEPLOYMENTS / f"{name}.json") as f:
        deployment = json.load(f)
    address = Web3.to_checksum_address(deployment["address"])
    return w3.eth.contract(address=address, abi=deployment["abi"])


def save_results(out):
    """Write seed results to seed/seed_results.json.
    out: dict - results with albums, songs, errors, skipped counts
    """
    path = ROOT / "seed" / "seed_results.json"
    with open(path, "w") as f:
        json.dump(out, f, indent=2, default=str)


async def download_cover(session, image_file):
    """Download a cover image from FMA. Returns None if unavailable.
    session: aiohttp.ClientSession
    image_file: str - raw FMA image URL
    returns: bytes or None - image data, or None if not available
    """
    url = cover_url(image_file)
    if url:
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
                content_type = r.headers.get("Content-Type", "")
                if r.ok and content_type.startswith("image/"):
                    data = await r.read()
                    if len(data) > 100:
                        return data
        except (aiohttp.ClientError, asyncio.TimeoutError):
            pass
    return None


async def upload(session, data, filename):
    """Upload a file to the storage service.
    session: aiohttp.ClientSession
    data: bytes - file content
    filename: str - name for the upload
    returns: str - IPFS CID
    """
    form = aiohttp.FormData()
    form.add_field("file", data, filename=filename)
    async with session.post(STORAGE_URL, data=form) as r:
        r.raise_for_status()
        return (await r.json())["cid"]


async def verify_album(session, sem, album_id, tracks, album_info):
    """Phase 1: check mp3s exist locally + cover is accessible. No IPFS uploads."""
    async with sem:
        valid_tracks = [(_, t) for _, t in tracks.iterrows() if mp3_path(int(t["track_id"])).exists()]
        if not valid_tracks:
            return None
        img = album_info.loc[album_id].get("album_image_file", "")
        url = cover_url(str(img))
        if not url:
            return None
        try:
            async with session.head(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
                if not r.ok:
                    return None
        except Exception:
            return None
        first = tracks.head(1).squeeze()
        return {
            "album_id": album_id,
            "title": str(first["album_title"])[:100],
            "artist": str(first["artist_name"])[:100],
            "cover_url": url,
            "valid_tracks": valid_tracks,
            "genre": parse_genre(tracks),
            "year": parse_year(album_info.loc[album_id].get("album_date_released", "")),
        }


async def upload_album(session, sem, verified):
    """Phase 2: upload cover + mp3s to IPFS for a pre-verified album."""
    async with sem:
        cover_data = None
        try:
            async with session.get(verified["cover_url"], timeout=aiohttp.ClientTimeout(total=10)) as r:
                if r.ok:
                    cover_data = await r.read()
        except Exception:
            pass
        if not cover_data:
            print(f"  IPFS skip {verified['album_id']}: cover download failed")
            return None

        image_cid = await upload(session, cover_data, f"cover_{verified['album_id']}.jpg")
        print(f"  cover ✓ {verified['title']} — {verified['artist']}")

        songs = []
        for _, t in verified["valid_tracks"]:
            path = mp3_path(int(t["track_id"]))
            cid = await upload(session, path.read_bytes(), path.name)
            songs.append({"track_id": int(t["track_id"]), "title": str(t["track_title"])[:100], "cid": cid})
            print(f"    mp3 ✓ {t['track_title']}")

        return {**verified, "image_cid": image_cid, "songs": songs}


def publish_album(item, w3, deployer, factory, model, rng, out):
    """Publish one uploaded album to the blockchain with retry."""
    album_songs = [
        (s["title"], s["cid"], *random_song_prices(rng), TOTAL_PARTS, NON_SELLABLE_PARTS)
        for s in item["songs"]
    ]
    for attempt in range(3):
        try:
            tx = factory.functions.addAlbum((
                item["title"], item["artist"],
                item.get("genre", ""), item.get("year", 0),
                item["image_cid"], album_songs,
            )).transact({"from": deployer})
            receipt = w3.eth.wait_for_transaction_receipt(tx)
            events = model.events.AlbumAdded().process_receipt(receipt)
            if not events:
                raise RuntimeError("no AlbumAdded event")
            aid = events[0]["args"]["id"]
            out["albums"].append({"fma_id": item["album_id"], "chain_id": aid, "title": item["title"]})
            for song in item["songs"]:
                out["songs"].append({"fma_id": song["track_id"], "chain_album_id": aid, "title": song["title"]})
                print(f"  + {song['title']}")
            return True
        except Exception as e:
            if attempt < 2:
                print(f"  blockchain err (attempt {attempt+1}/3): {e} — retrying...")
                time.sleep(2 ** attempt)
            else:
                print(f"  blockchain FAILED: {e}")
                out["errors"].append({"album_id": item["album_id"], "error": str(e)})
    return False


async def prepare_album(session, sem, album_id, tracks, album_info):
    """Legacy wrapper kept for compatibility."""
    return await upload_album(session, sem, await verify_album(session, sem, album_id, tracks, album_info) or {})


def load_fma():
    """Load FMA metadata CSVs and filter to tracks with mp3s and albums with covers.
    returns: (DataFrame, DataFrame) - (tracks, albums)
    """
    raw_tracks = pd.read_csv(FMA_META / "raw_tracks.csv")
    raw_albums = pd.read_csv(FMA_META / "raw_albums.csv")

    raw_tracks["has_mp3"] = raw_tracks["track_id"].apply(
        lambda t: mp3_path(t).exists()
    )
    tracks = raw_tracks[raw_tracks["has_mp3"]].copy()

    has_tracks = raw_albums["album_id"].isin(tracks["album_id"].unique())
    has_cover = raw_albums["album_image_file"].str.startswith(FMA_PREFIX, na=False)
    albums = raw_albums[has_tracks & has_cover].copy()

    print(f"{len(tracks)} tracks, {len(albums)} albums with covers")
    return tracks, albums


def connect():
    """Connect to the blockchain and load deployed contracts.
    returns: (Web3, str, Contract, Contract) - (w3, deployer, factory, model) or None on failure
    """
    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
    try:
        w3.eth.chain_id  # verifies the node is actually reachable
    except Exception:
        print(f"Can't reach {RPC_URL}")
        return None

    if NETWORK == "localhost":
        deployer = w3.eth.accounts[0]
    else:
        acct = w3.eth.account.from_key(PRIVATE_KEY)
        w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(acct), layer=0)
        deployer = acct.address

    factory = load_contract(w3, "SongsFactory")
    model = load_contract(w3, "SongsModel")
    print(f"chain {w3.eth.chain_id}, deployer {deployer}")
    return w3, deployer, factory, model


async def upload_albums(ids, by_album, info):
    """Upload covers and mp3s for all selected albums in parallel.
    ids: list[int] - album ids to process
    by_album: DataFrameGroupBy - tracks grouped by album_id
    info: DataFrame - album metadata indexed by album_id
    returns: list[dict] - prepared album dicts (or exceptions)
    """
    sem = asyncio.Semaphore(MAX_PARALLEL)
    async with aiohttp.ClientSession() as s:
        try:
            await upload(s, b"ping", "smoke.txt")
        except Exception as e:
            print(f"Storage down: {e}")
            return []

        tasks = []
        for a in ids:
            album_tracks = by_album.get_group(a).head(MAX_SONGS_PER_ALBUM)
            task = prepare_album(s, sem, a, album_tracks, info)
            tasks.append(task)

        return await asyncio.gather(*tasks, return_exceptions=True)


def publish_to_chain(prepared, ids, w3, deployer, factory, model):
    """Send addAlbum transactions to the chain for each prepared album.
    prepared: list[dict] - output from upload_albums
    ids: list[int] - album ids (same order as prepared)
    w3: Web3
    deployer: str - deployer address
    factory: Contract - SongsFactory contract
    model: Contract - SongsModel contract
    returns: dict - {albums, songs, errors, skipped}
    """
    out = {"albums": [], "songs": [], "errors": [], "skipped": 0}

    rng = random.Random(RANDOM_SEED)

    for i, item in enumerate(prepared):
        if isinstance(item, BaseException) or not item:
            out["errors"].append({"album_id": ids[i], "error": str(item)})
            continue
        if item.get("skip"):
            out["skipped"] += 1
            continue
        if "title" not in item:
            out["errors"].append({"album_id": ids[i], "error": str(item)})
            continue

        # Early exit if TARGET_SONGS reached
        if TARGET_SONGS and len(out["songs"]) >= TARGET_SONGS:
            print(f"\nTarget of {TARGET_SONGS} songs reached, stopping.")
            break

        print(f"[{i+1}/{len(prepared)}] {item['title']} — {item['artist']}")
        try:
            album_songs = []
            for song in item["songs"]:
                play_fee, buy_price = random_song_prices(rng)
                album_songs.append((
                    song["title"],
                    song["cid"],
                    play_fee,
                    buy_price,
                    TOTAL_PARTS,
                    NON_SELLABLE_PARTS,
                ))

            tx = factory.functions.addAlbum(
                (
                    item["title"],
                    item["artist"],
                    item.get("genre", ""),
                    item.get("year", 0),
                    item["image_cid"],
                    album_songs,
                )
            ).transact({"from": deployer})
            receipt = w3.eth.wait_for_transaction_receipt(tx)
            events = model.events.AlbumAdded().process_receipt(receipt)
            if not events:
                out["errors"].append({"album_id": item["album_id"], "error": "no event"})
                continue

            aid = events[0]["args"]["id"]
            out["albums"].append({
                "fma_id": item["album_id"],
                "chain_id": aid,
                "title": item["title"],
            })

            for song in item["songs"]:
                out["songs"].append({
                    "fma_id": song["track_id"],
                    "chain_album_id": aid,
                    "title": song["title"],
                })
                print(f"  + {song['title']}")
        except Exception as e:
            print(f"  err: {e}")
            out["errors"].append({"album_id": item["album_id"], "error": str(e)})

    return out


def check_required_paths():
    """Check that all required files and directories exist.
    returns: bool - True if all paths exist, False otherwise
    """
    paths = [
        FMA_SMALL,
        FMA_META,
        DEPLOYMENTS / "SongsFactory.json",
        DEPLOYMENTS / "SongsModel.json",
    ]
    for p in paths:
        if not p.exists():
            print(f"Missing: {p}")
            return False
    return True


async def main():
    if not check_required_paths():
        return

    tracks, albums = load_fma()
    connection = connect()
    if not connection:
        return
    w3, deployer, factory, model = connection
    if not w3:
        return

    by_album = tracks.groupby("album_id")
    ids = [a for a in albums["album_id"] if a in by_album.groups]
    random.seed(RANDOM_SEED)
    random.shuffle(ids)
    target = TARGET_SONGS if TARGET_SONGS else SAMPLE_SIZE * 3
    info = albums.set_index("album_id")
    t0 = time.time()

    # ── Phase 1: verify (no IPFS) ────────────────────────────────────────────
    print(f"\n=== Phase 1: verifying albums (no IPFS) — target {target} songs ===")
    sem = asyncio.Semaphore(MAX_PARALLEL)
    verified_albums = []
    verified_songs = 0
    async with aiohttp.ClientSession() as session:
        for i, aid in enumerate(ids):
            if verified_songs >= target:
                break
            album_tracks = by_album.get_group(aid).head(MAX_SONGS_PER_ALBUM)
            result = await verify_album(session, sem, aid, album_tracks, info)
            if result:
                verified_albums.append((aid, album_tracks, result))
                verified_songs += len(result["valid_tracks"])
                print(f"  [{verified_songs}/{target} songs] ✓ {result['title']} — {result['artist']} ({len(result['valid_tracks'])} tracks)")
            if (i + 1) % 50 == 0:
                print(f"  scanned {i+1}/{len(ids)} candidates...")

    print(f"\nPhase 1 done: {len(verified_albums)} albums, {verified_songs} songs ready for upload")
    if not verified_albums:
        print("No valid albums found.")
        return

    # ── Phase 2: upload to IPFS + blockchain ─────────────────────────────────
    print(f"\n=== Phase 2: uploading to IPFS and blockchain ===")
    out = {"albums": [], "songs": [], "errors": [], "skipped": 0}
    rng = random.Random(RANDOM_SEED)
    async with aiohttp.ClientSession() as session:
        for i, (aid, album_tracks, verified) in enumerate(verified_albums):
            print(f"\n[{i+1}/{len(verified_albums)}] {verified['title']} — {verified['artist']}")
            uploaded = await upload_album(session, sem, verified)
            if not uploaded:
                out["errors"].append({"album_id": aid, "error": "ipfs upload failed"})
                continue
            publish_album(uploaded, w3, deployer, factory, model, rng, out)

    print(f"\n=== Done in {time.time()-t0:.1f}s ===")
    print(f"{len(out['albums'])} albums, {len(out['songs'])} songs, {len(out['errors'])} errors")
    save_results(out)


if __name__ == "__main__":
    asyncio.run(main())
