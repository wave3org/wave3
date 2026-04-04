#!/usr/bin/env python3
"""Seeds the chain with FMA music data. Run `make seed` or `make seed-sepolia`."""

import asyncio
import json
import os
import random
import sys
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
    sys.exit("Set DEPLOYER_PRIVATE_KEY for non-local networks")

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


def mp3_path(track_id):
    tid = f"{track_id:06d}"
    return FMA_SMALL / tid[:3] / f"{tid}.mp3"


def cover_url(image_file):
    if not isinstance(image_file, str) or not image_file.startswith(FMA_PREFIX):
        return None
    rel = image_file[len(FMA_PREFIX):]
    return f"{FMA_IMG}?file={quote(rel, safe='')}&width=290&height=290&type=album"


def load_contract(w3, name):
    with open(DEPLOYMENTS / f"{name}.json") as f:
        d = json.load(f)
    return w3.eth.contract(address=Web3.to_checksum_address(d["address"]), abi=d["abi"])


async def download_cover(session, image_file):
    url = cover_url(image_file)
    if not url:
        return None
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.ok:
                data = await r.read()
                return data if len(data) > 100 else None
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return None


async def upload(session, data, filename):
    form = aiohttp.FormData()
    form.add_field("file", data, filename=filename)
    async with session.post(STORAGE_URL, data=form) as r:
        r.raise_for_status()
        return (await r.json())["cid"]


async def prepare_album(session, sem, album_id, tracks, album_info):
    async with sem:
        first = tracks.iloc[0]
        title = str(first["album_title"])[:100]
        artist = str(first["artist_name"])[:100]

        row = album_info.loc[album_id] if album_id in album_info.index else {}
        img = row.get("album_image_file", "") if isinstance(row, dict) else row.get("album_image_file", "")

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
            songs.append({"track_id": int(t["track_id"]), "title": str(t["track_title"])[:100], "cid": cid})

        return {"album_id": album_id, "title": title, "artist": artist, "image_cid": image_cid, "songs": songs}


def load_fma():
    raw_tracks = pd.read_csv(FMA_META / "raw_tracks.csv")
    raw_albums = pd.read_csv(FMA_META / "raw_albums.csv")

    raw_tracks["has_mp3"] = raw_tracks["track_id"].apply(lambda t: mp3_path(t).exists())
    tracks = raw_tracks[raw_tracks["has_mp3"]].copy()
    albums = raw_albums[
        raw_albums["album_id"].isin(tracks["album_id"].unique())
        & raw_albums["album_image_file"].str.startswith(FMA_PREFIX, na=False)
    ].copy()

    print(f"{len(tracks)} tracks, {len(albums)} albums with covers")
    return tracks, albums


def connect():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        sys.exit(f"Can't reach {RPC_URL}")

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


async def main():
    for p in [FMA_SMALL, FMA_META, DEPLOYMENTS / "SongsFactory.json", DEPLOYMENTS / "SongsModel.json"]:
        if not p.exists():
            sys.exit(f"Missing: {p}")

    tracks, albums = load_fma()
    w3, deployer, factory, model = connect()

    by_album = tracks.groupby("album_id")
    ids = [a for a in albums["album_id"] if a in by_album.groups]
    random.seed(RANDOM_SEED)
    random.shuffle(ids)
    ids = ids[:SAMPLE_SIZE]
    print(f"seed={RANDOM_SEED} (reproduce with SEED={RANDOM_SEED})")
    info = albums.set_index("album_id")

    # upload covers + mp3s in parallel, then do chain txs sequentially
    t0 = time.time()
    sem = asyncio.Semaphore(MAX_PARALLEL)
    async with aiohttp.ClientSession() as s:
        try:
            await upload(s, b"ping", "smoke.txt")
        except Exception as e:
            sys.exit(f"Storage down: {e}")

        prepared = await asyncio.gather(*[
            prepare_album(s, sem, a, by_album.get_group(a).head(MAX_SONGS_PER_ALBUM), info)
            for a in ids
        ], return_exceptions=True)

    io_t = time.time() - t0
    print(f"uploads: {io_t:.1f}s")

    out = {"albums": [], "songs": [], "errors": [], "skipped": 0}
    for i, item in enumerate(prepared):
        if isinstance(item, Exception):
            out["errors"].append({"album_id": ids[i], "error": str(item)})
            continue
        if item.get("skip"):
            out["skipped"] += 1
            continue

        print(f"[{i+1}/{len(prepared)}] {item['title']} — {item['artist']}")
        try:
            tx = factory.functions.addAlbum(item["title"], item["artist"], item["image_cid"]).transact({"from": deployer})
            receipt = w3.eth.wait_for_transaction_receipt(tx)
            evts = model.events.AlbumAdded().process_receipt(receipt)
            if not evts:
                out["errors"].append({"album_id": item["album_id"], "error": "no event"})
                continue

            aid = evts[0]["args"]["id"]
            out["albums"].append({"fma_id": item["album_id"], "chain_id": aid, "title": item["title"]})

            for song in item["songs"]:
                tx = factory.functions.addSong(
                    song["title"], song["cid"], aid,
                    PLAY_FEE, PART_PRICE, TOTAL_PARTS, NON_SELLABLE_PARTS, ZERO,
                ).transact({"from": deployer})
                w3.eth.wait_for_transaction_receipt(tx)
                out["songs"].append({"fma_id": song["track_id"], "chain_album_id": aid, "title": song["title"]})
                print(f"  + {song['title']}")
        except Exception as e:
            print(f"  err: {e}")
            out["errors"].append({"album_id": item["album_id"], "error": str(e)})

    print(f"\ndone in {time.time()-t0:.1f}s (uploads {io_t:.1f}s)")
    print(f"{len(out['albums'])} albums, {len(out['songs'])} songs, {out['skipped']} skipped, {len(out['errors'])} errors")

    with open(ROOT / "seed" / "seed_results.json", "w") as f:
        json.dump(out, f, indent=2, default=str)


if __name__ == "__main__":
    asyncio.run(main())
