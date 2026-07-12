#!/usr/bin/env python3
"""Unpins Pinata files older than N days (default: 7).

Usage:
    PINATA_JWT=eyJ... python seed/unpin_old.py
    PINATA_JWT=eyJ... DAYS=3 python seed/unpin_old.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

import aiohttp

PINATA_JWT = os.environ.get("PINATA_JWT", "")
if not PINATA_JWT:
    print("ERROR: Set PINATA_JWT env var")
    sys.exit(1)

DAYS = int(os.environ.get("DAYS", "7"))
CONCURRENCY = int(os.environ.get("WORKERS", "50"))
CUTOFF = datetime.now(timezone.utc) - timedelta(days=DAYS)
HEADERS = {"Authorization": f"Bearer {PINATA_JWT}"}
BASE = "https://api.pinata.cloud"


async def fetch_all_pins(session):
    pins = []
    page_offset = 0
    page_limit = 1000
    while True:
        async with session.get(
            f"{BASE}/data/pinList",
            params={"status": "pinned", "pageLimit": page_limit, "pageOffset": page_offset},
        ) as resp:
            resp.raise_for_status()
            data = await resp.json()
        rows = data.get("rows", [])
        pins.extend(rows)
        if len(rows) < page_limit:
            break
        page_offset += page_limit
    return pins


async def unpin(session, sem, cid, idx, total):
    async with sem:
        for attempt in range(5):
            async with session.delete(f"{BASE}/pinning/unpin/{cid}") as resp:
                if resp.status == 200:
                    print(f"[{idx}/{total}] ✓ {cid}")
                    return True
                if resp.status == 429:
                    wait = 2 ** attempt
                    print(f"[{idx}/{total}] rate limited, retry in {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                print(f"[{idx}/{total}] ✗ {cid} (status {resp.status})")
                return False
        print(f"[{idx}/{total}] ✗ {cid} (max retries)")
        return False


async def main():
    async with aiohttp.ClientSession(headers=HEADERS) as session:
        print("Fetching pins...")
        pins = await fetch_all_pins(session)
        print(f"Total pins: {len(pins)}")

        old = [p for p in pins if datetime.fromisoformat(p["date_pinned"].replace("Z", "+00:00")) < CUTOFF]
        print(f"Older than {DAYS} days: {len(old)}")

        if not old:
            print("Nothing to unpin.")
            return

        confirm = input(f"Unpin {len(old)} files with {CONCURRENCY} workers? [y/N] ").strip().lower()
        if confirm != "y":
            print("Aborted.")
            return

        sem = asyncio.Semaphore(CONCURRENCY)
        total = len(old)
        tasks = [unpin(session, sem, p["ipfs_pin_hash"], i + 1, total) for i, p in enumerate(old)]
        results = await asyncio.gather(*tasks)

        ok = sum(results)
        print(f"\nDone — {ok} unpinned, {total - ok} failed")


asyncio.run(main())
