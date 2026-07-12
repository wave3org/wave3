#!/usr/bin/env python3
"""Preview (or upload) new albums for the New Releases section.

Picks albums NOT already in seed_results.json, using a different random seed.
By default uploads. Use --dry-run to preview without uploading.

Usage:
    python seed/seed_new_releases.py --dry-run              # preview only
    python seed/seed_new_releases.py --dry-run --seed 999   # try different seed
    python seed/seed_new_releases.py --dry-run --sample 6   # how many albums
    NETWORK=baseSepolia DEPLOYER_PRIVATE_KEY=0x... \\
        python seed/seed_new_releases.py                    # actually upload
"""

import argparse
import json
import random
import re
import sys
from pathlib import Path
from urllib.parse import quote

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
FMA_SMALL = ROOT / "downloads" / "fma_small"
FMA_META  = ROOT / "downloads" / "fma_metadata"
FMA_PREFIX = "https://freemusicarchive.org/file/"
FMA_IMG    = "https://freemusicarchive.org/image/"
COVER_WIDTH  = 290
COVER_HEIGHT = 290
MAX_SONGS_PER_ALBUM = 5

RESULTS_FILE = ROOT / "seed" / "seed_results.json"


def mp3_path(track_id):
    tid = f"{track_id:06d}"
    return FMA_SMALL / tid[:3] / f"{tid}.mp3"


def cover_url(image_file):
    text = str(image_file)
    if not text.startswith(FMA_PREFIX):
        return None
    rel = text[len(FMA_PREFIX):]
    return f"{FMA_IMG}?file={quote(rel, safe='')}&width={COVER_WIDTH}&height={COVER_HEIGHT}&type=album"


def parse_year(date_released):
    match = re.search(r"(\d{4})", str(date_released))
    return int(match.group(1)) if match else 0


def parse_genre(tracks):
    for _, t in tracks.iterrows():
        raw = str(t.get("track_genres", ""))
        match = re.search(r"'genre_title':\s*'([^']+)'", raw)
        if match:
            return match.group(1)[:50]
    return ""


def load_already_uploaded():
    """Return set of album titles already in seed_results.json."""
    if not RESULTS_FILE.exists():
        return set()
    with open(RESULTS_FILE) as f:
        d = json.load(f)
    return {a.get("title", "").strip().lower() for a in d.get("albums", [])}


def load_fma():
    raw_tracks = pd.read_csv(FMA_META / "raw_tracks.csv")
    raw_albums = pd.read_csv(FMA_META / "raw_albums.csv")

    raw_tracks["has_mp3"] = raw_tracks["track_id"].apply(lambda t: mp3_path(t).exists())
    tracks = raw_tracks[raw_tracks["has_mp3"]].copy()

    has_tracks = raw_albums["album_id"].isin(tracks["album_id"].unique())
    has_cover  = raw_albums["album_image_file"].str.startswith(FMA_PREFIX, na=False)
    albums = raw_albums[has_tracks & has_cover].copy()
    return tracks, albums


def pick_albums(seed, sample_size, exclude_titles):
    tracks, albums = load_fma()
    by_album = tracks.groupby("album_id")
    ids = [a for a in albums["album_id"] if a in by_album.groups]

    rng = random.Random(seed)
    rng.shuffle(ids)

    import requests
    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"}

    info = albums.set_index("album_id")
    selected = []
    checked = 0
    for aid in ids:
        if len(selected) >= sample_size:
            break
        album_tracks = by_album.get_group(aid).head(MAX_SONGS_PER_ALBUM)
        first = album_tracks.head(1).squeeze()
        title = str(first.get("album_title", ""))[:100]
        artist = str(first.get("artist_name", ""))[:100]
        if title.strip().lower() in exclude_titles:
            continue
        row = info.loc[aid] if aid in info.index else None
        img_url = cover_url(str(row["album_image_file"])) if row is not None else None
        if not img_url:
            continue
        # verify cover is alive
        checked += 1
        try:
            r = requests.head(img_url, headers=headers, timeout=5)
            if r.status_code != 200:
                continue
        except Exception:
            continue
        genre = parse_genre(album_tracks)
        year = parse_year(first.get("album_date_released", ""))
        songs = []
        for _, t in album_tracks.iterrows():
            songs.append({
                "track_id": int(t["track_id"]),
                "title": str(t.get("track_title", ""))[:100],
                "mp3": str(mp3_path(int(t["track_id"]))),
            })
        selected.append({
            "album_id": int(aid),
            "title": title,
            "artist": artist,
            "cover_url": img_url,
            "genre": genre,
            "year": year,
            "songs": songs,
        })
    print(f"(verificadas {checked} covers para encontrar {len(selected)} álbumes)")
    return selected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed",   type=int, default=999)
    parser.add_argument("--sample", type=int, default=6)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    already = load_already_uploaded()
    print(f"Albums ya subidos (excluidos): {len(already)}")

    selected = pick_albums(args.seed, args.sample, already)
    print(f"\n{'='*60}")
    print(f"PREVIEW — seed={args.seed}, sample={args.sample}")
    print(f"{'='*60}")
    for i, a in enumerate(selected, 1):
        print(f"\n[{i}] {a['title']} — {a['artist']}")
        print(f"     genre={a['genre']}  year={a['year']}")
        print(f"     cover: {a['cover_url']}")
        for s in a["songs"]:
            exists = "✓" if Path(s["mp3"]).exists() else "✗"
            print(f"       {exists} {s['title']}")

    if not selected:
        print("No hay álbumes nuevos para subir con este seed.")
        sys.exit(0)

    if args.dry_run:
        # Download cover images for preview
        import requests
        imgs_dir = ROOT / "seed" / "imgs"
        imgs_dir.mkdir(exist_ok=True)
        headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"}
        print("\nDescargando carátulas para preview...")
        for a in selected:
            if a["cover_url"]:
                dest = imgs_dir / f"{a['album_id']}.jpg"
                try:
                    r = requests.get(a["cover_url"], headers=headers, timeout=10)
                    r.raise_for_status()
                    ext = "webp" if r.content[:4] == b"RIFF" or r.content[:4] == b"\x00\x00\x00" or b"WEBP" in r.content[:12] else "jpg"
                    dest = imgs_dir / f"{a['album_id']}.{ext}"
                    dest.write_bytes(r.content)
                    print(f"  ✓ {dest.name}  ({a['title']})")
                except Exception as e:
                    print(f"  ✗ {a['title']}: {e}")
        print(f"\nCarátulas en: {imgs_dir}")
        print(f"\n→ Para subir estos {len(selected)} álbumes, corré:")
        print(f"  NETWORK=baseSepolia DEPLOYER_PRIVATE_KEY=0x... \\")
        print(f"  python seed/seed_new_releases.py --seed {args.seed} --sample {args.sample}")
        sys.exit(0)

    # ── upload mode ──────────────────────────────────────────────────────────
    import asyncio
    import aiohttp
    import os
    import time
    from web3 import Web3
    from web3.middleware import SignAndSendRawMiddlewareBuilder

    NETWORK = os.environ.get("NETWORK", "localhost")
    DEPLOYMENTS = ROOT / "packages" / "hardhat" / "deployments" / NETWORK
    STORAGE_URL = {
        "localhost":   "http://localhost:3001/upload",
        "baseSepolia": "https://storage-5gx1.onrender.com/upload",
    }.get(NETWORK, "http://localhost:3001/upload")
    RPC_URL = os.environ.get("RPC_URL") or {
        "localhost":   "http://127.0.0.1:8545",
        "baseSepolia": "https://sepolia.base.org",
    }.get(NETWORK, "http://127.0.0.1:8545")
    PRIVATE_KEY = os.environ.get("DEPLOYER_PRIVATE_KEY", "")

    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
    if NETWORK == "localhost":
        deployer = w3.eth.accounts[0]
    else:
        acct = w3.eth.account.from_key(PRIVATE_KEY)
        w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(acct), layer=0)
        deployer = acct.address

    def load_contract(name):
        with open(DEPLOYMENTS / f"{name}.json") as f:
            dep = json.load(f)
        return w3.eth.contract(address=Web3.to_checksum_address(dep["address"]), abi=dep["abi"])

    factory = load_contract("SongsFactory")
    model   = load_contract("SongsModel")

    async def upload_file(session, data, filename):
        form = aiohttp.FormData()
        form.add_field("file", data, filename=filename)
        async with session.post(STORAGE_URL, data=form) as r:
            r.raise_for_status()
            return (await r.json())["cid"]

    async def upload_album(session, album):
        # cover
        cover_data = None
        if album["cover_url"]:
            try:
                async with session.get(album["cover_url"], timeout=aiohttp.ClientTimeout(total=10)) as r:
                    if r.ok and r.headers.get("Content-Type","").startswith("image/"):
                        cover_data = await r.read()
            except Exception:
                pass
        if not cover_data:
            return None, "no cover"
        image_cid = await upload_file(session, cover_data, f"cover_{album['album_id']}.jpg")

        songs_out = []
        for s in album["songs"]:
            mp3 = Path(s["mp3"])
            if not mp3.exists():
                continue
            audio_data = mp3.read_bytes()
            cid = await upload_file(session, audio_data, f"{s['track_id']}.mp3")
            songs_out.append({**s, "cid": cid})

        if not songs_out:
            return None, "no songs"

        return {**album, "image_cid": image_cid, "songs": songs_out}, None

    async def run():
        t0 = time.time()
        async with aiohttp.ClientSession() as session:
            for i, album in enumerate(selected, 1):
                print(f"\n[{i}/{len(selected)}] Uploading {album['title']} — {album['artist']}...")
                prepared, err = await upload_album(session, album)
                if err:
                    print(f"  skip: {err}")
                    continue

                songs_tuple = [
                    (s["title"], s["cid"],
                     Web3.to_wei(random.randint(1,5), "ether"),
                     Web3.to_wei(random.randint(10,20), "ether"),
                     100, 30)
                    for s in prepared["songs"]
                ]
                tx = factory.functions.addAlbum((
                    prepared["title"], prepared["artist"],
                    prepared.get("genre",""), prepared.get("year", 0),
                    prepared["image_cid"], songs_tuple,
                )).transact({"from": deployer})
                w3.eth.wait_for_transaction_receipt(tx)
                print(f"  ✓ {len(songs_tuple)} songs on-chain")
                for s in prepared["songs"]:
                    print(f"    + {s['title']}")

        print(f"\nDone in {time.time()-t0:.1f}s")

    asyncio.run(run())


if __name__ == "__main__":
    main()
