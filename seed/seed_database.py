#!/usr/bin/env python3
"""Seeds the chain with FMA music data. Run `make seed` or `make seed-sepolia`."""

import asyncio
import json
import os
import random
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
}[NETWORK]

ALCHEMY_KEY = os.environ.get("ALCHEMY_API_KEY", "cR4WnXePioePZ5fFrnSiR")
RPC_URL = {
    "localhost": "http://127.0.0.1:8545",
    "sepolia": f"https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_KEY}",
}[NETWORK]

PRIVATE_KEY = os.environ.get("DEPLOYER_PRIVATE_KEY", "")
if NETWORK != "localhost" and not PRIVATE_KEY:
    print("Set DEPLOYER_PRIVATE_KEY for non-local networks")
    exit()

SAMPLE_SIZE = int(os.environ.get("SAMPLE_SIZE") or 50)
MAX_SONGS_PER_ALBUM = 5
MAX_PARALLEL = 10
RANDOM_SEED = int(os.environ.get("SEED") or 123)

PLAY_FEE = Web3.to_wei(1, "ether")
PART_PRICE = Web3.to_wei(10, "ether")
TOTAL_PARTS = 100
NON_SELLABLE_PARTS = 30
ZERO = "0x" + "0" * 40

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
    """Download a cover image from FMA. Skips tiny/broken images.
    session: aiohttp.ClientSession
    image_file: str - raw FMA image URL
    returns: bytes or None - image data, None on failure
    """
    url = cover_url(image_file)
    if not url:
        return None
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
            if not r.ok:
                return None
            data = await r.read()
            if len(data) <= 100:
                return None
            return data
    except (aiohttp.ClientError, asyncio.TimeoutError):
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


async def prepare_album(session, sem, album_id, tracks, album_info):
    """Upload cover + mp3s for one album to storage.
    session: aiohttp.ClientSession
    sem: asyncio.Semaphore - concurrency limiter
    album_id: int - FMA album id
    tracks: DataFrame - tracks belonging to this album
    album_info: DataFrame - album metadata indexed by album_id
    returns: dict - {album_id, title, artist, image_cid, songs} or {album_id, skip: True}
    """
    async with sem:
        first = tracks.head(1).squeeze()
        title = str(first["album_title"])[:100]
        artist = str(first["artist_name"])[:100]

        img = album_info.loc[album_id].get("album_image_file", "")

        cover = await download_cover(session, img)
        if not cover:
            return {"album_id": album_id, "skip": True}

        image_cid = await upload(session, cover, f"cover_{album_id}.jpg")

        songs = []
        for _, t in tracks.iterrows():
            path = mp3_path(int(t["track_id"]))
            if not path.exists():
                continue
            cid = await upload(session, path.read_bytes(), path.name)
            songs.append({
                "track_id": int(t["track_id"]),
                "title": str(t["track_title"])[:100],
                "cid": cid,
            })

        return {
            "album_id": album_id,
            "title": title,
            "artist": artist,
            "image_cid": image_cid,
            "songs": songs,
        }


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
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
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
    """Send addAlbum + addSong transactions to the chain for each prepared album.
    prepared: list[dict] - output from upload_albums
    ids: list[int] - album ids (same order as prepared)
    w3: Web3
    deployer: str - deployer address
    factory: Contract - SongsFactory contract
    model: Contract - SongsModel contract
    returns: dict - {albums, songs, errors, skipped}
    """
    out = {"albums": [], "songs": [], "errors": [], "skipped": 0}

    for i, item in enumerate(prepared):
        if not item:
            out["errors"].append({"album_id": ids[i], "error": str(item)})
            continue
        if item.get("skip"):
            out["skipped"] += 1
            continue
        if "title" not in item:
            out["errors"].append({"album_id": ids[i], "error": str(item)})
            continue

        print(f"[{i+1}/{len(prepared)}] {item['title']} — {item['artist']}")
        try:
            tx = factory.functions.addAlbum(
                item["title"], item["artist"], item["image_cid"],
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
                tx = factory.functions.addSong(
                    song["title"], song["cid"], aid,
                    PLAY_FEE, PART_PRICE, TOTAL_PARTS, NON_SELLABLE_PARTS, ZERO,
                ).transact({"from": deployer})
                w3.eth.wait_for_transaction_receipt(tx)
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
    w3, deployer, factory, model = connect()
    if not w3:
        return

    by_album = tracks.groupby("album_id")
    ids = [a for a in albums["album_id"] if a in by_album.groups]
    random.seed(RANDOM_SEED)
    random.shuffle(ids)
    ids = ids[:SAMPLE_SIZE]
    print(f"seed={RANDOM_SEED} (reproduce with SEED={RANDOM_SEED})")
    info = albums.set_index("album_id")

    t0 = time.time()
    prepared = await upload_albums(ids, by_album, info)
    io_t = time.time() - t0
    print(f"uploads: {io_t:.1f}s")

    out = publish_to_chain(prepared, ids, w3, deployer, factory, model)

    print(f"\ndone in {time.time()-t0:.1f}s (uploads {io_t:.1f}s)")
    print(f"{len(out['albums'])} albums, {len(out['songs'])} songs, {out['skipped']} skipped, {len(out['errors'])} errors")

    save_results(out)


if __name__ == "__main__":
    asyncio.run(main())
