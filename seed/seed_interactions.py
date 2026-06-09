#!/usr/bin/env python3
"""Seeds the chain with synthetic user interactions (plays and part purchases).

Usage:
    python seed/seed_interactions.py

Environment variables:
    N_PLAYS         Number of random play events to generate (default: 2000)
    N_BUYS          Number of random part purchase events (default: 50)
    SEED            Random seed for reproducibility (default: 42)
    PONDER_URL      Ponder REST API base URL (default: http://localhost:42069)
    DISTRIBUTION    Song selection distribution: uniform | zipf (default: zipf)
    ZIPF_EXPONENT   Exponent for zipf distribution (default: 1.5, higher = more skewed)
    NETWORK         Target network: localhost | baseSepolia (default: localhost)
    RPC_URL         Override RPC endpoint (optional)
    PRIVATE_KEYS    Comma-separated private keys for non-localhost networks
"""

import json
import os
import random
from pathlib import Path

import numpy as np
import requests
from web3.middleware import SignAndSendRawMiddlewareBuilder
from scipy.stats import zipfian
from web3 import Web3

NETWORK = os.environ.get("NETWORK", "localhost")
ROOT = Path(__file__).resolve().parent.parent
DEPLOYMENTS = ROOT / "packages" / "hardhat" / "deployments" / NETWORK

RPC_URLS = {
    "localhost": "http://127.0.0.1:8545",
    "baseSepolia": "https://sepolia.base.org",
}
RPC_URL = os.environ.get("RPC_URL") or RPC_URLS.get(NETWORK, "http://127.0.0.1:8545")
PONDER_URL = os.environ.get("PONDER_URL") or {
    "localhost": "http://localhost:42069",
    "baseSepolia": "https://ponder-sudh.onrender.com",
}.get(NETWORK, "http://localhost:42069")
N_PLAYS = int(os.environ.get("N_PLAYS") or 2000)
N_BUYS = int(os.environ.get("N_BUYS") or 50)
WAVE_PER_USER = Web3.to_wei(1000, "ether")
RANDOM_SEED = int(os.environ.get("SEED") or 42)
DISTRIBUTION = os.environ.get("DISTRIBUTION") or "zipf"
ZIPF_EXPONENT = float(os.environ.get("ZIPF_EXPONENT") or 1.5)


class SongPicker:
    """Strategy for selecting a song ID from a list."""

    def __init__(self, rng: np.random.Generator):
        self.rng = rng

    def pick(self, song_ids: list) -> str:
        raise NotImplementedError


class UniformPicker(SongPicker):
    """Selects songs with equal probability."""

    def pick(self, song_ids: list) -> str:
        return self.rng.choice(song_ids)


class ZipfPicker(SongPicker):
    """Selects songs using scipy.stats.zipfian (bounded Zipf / power-law).

    A small number of songs receive the majority of plays, mimicking
    real-world streaming behaviour. Higher exponent = more skewed.
    """

    def __init__(self, rng: np.random.Generator, exponent: float = 1.5):
        super().__init__(rng)
        self.exponent = exponent
        self._weights: np.ndarray | None = None

    def pick(self, song_ids: list) -> str:
        if self._weights is None:
            k = np.arange(1, len(song_ids) + 1)
            w = zipfian.pmf(k, self.exponent, len(song_ids))
            self._weights = w / w.sum()
        return self.rng.choice(song_ids, p=self._weights)


def make_picker(rng: np.random.Generator) -> SongPicker:
    """Instantiate the song picker selected by the DISTRIBUTION env var."""
    options: dict[str, SongPicker] = {
        "uniform": UniformPicker(rng),
        "zipf": ZipfPicker(rng, ZIPF_EXPONENT),
    }
    picker = options.get(DISTRIBUTION)
    if picker is None:
        raise ValueError(f"Unknown DISTRIBUTION '{DISTRIBUTION}'. Choose from: {list(options)}.")
    return picker


def get_accounts(w3: Web3) -> list[str]:
    """Return user accounts depending on the network.

    On localhost, Hardhat unlocks all accounts automatically.
    On other networks, accounts are loaded from the PRIVATE_KEYS env var.
    """
    if NETWORK == "localhost":
        return list(w3.eth.accounts[1:])  # skip deployer

    raw = os.environ.get("PRIVATE_KEYS", "")
    if not raw:
        raise EnvironmentError("PRIVATE_KEYS env var is required for non-localhost networks.")
    accounts = []
    for pk in raw.split(","):
        pk = pk.strip()
        account = w3.eth.account.from_key(pk)
        w3.middleware_onion.add(SignAndSendRawMiddlewareBuilder.build(account))
        accounts.append(account.address)
    return accounts


def load_contract(w3, name):
    """Load a deployed contract by name from the deployments directory."""
    path = DEPLOYMENTS / f"{name}.json"
    with open(path) as f:
        deployment = json.load(f)
    return w3.eth.contract(address=Web3.to_checksum_address(deployment["address"]), abi=deployment["abi"])


def fetch_song_ids():
    """Fetch all song IDs from the Ponder REST API."""
    resp = requests.get(f"{PONDER_URL}/songs-with-albums?limit=200", timeout=10)
    resp.raise_for_status()
    return [item["songId"] for item in resp.json().get("items", [])]


def send_tx(w3, contract_call, addr, label):
    """Send a transaction, wait for receipt, and log the result. Returns True on success."""
    try:
        tx = contract_call.transact({"from": addr})
        w3.eth.wait_for_transaction_receipt(tx)
        print(f"  ✓ {label}")
        return True
    except Exception as e:
        print(f"  ✗ {label}: {e}")
        return False


def mint_to_users(w3, wavecoin, users):
    """Mint WAVE tokens to each user account."""
    print(f"=== Minting {Web3.from_wei(WAVE_PER_USER, 'ether')} WAVE to {len(users)} users ===")
    for addr in users:
        send_tx(w3, wavecoin.functions.mint(WAVE_PER_USER), addr, addr)
    print()


def random_plays(w3, wavecoin, users, song_ids, picker: SongPicker):
    """Generate N_PLAYS random play transactions across all users and songs."""
    print(f"=== Generating {N_PLAYS} random plays ===")
    ok = 0
    for i in range(N_PLAYS):
        addr = random.choice(users)
        song_id = int(picker.pick(song_ids))
        ok += send_tx(w3, wavecoin.functions.buyPlay(song_id), addr, f"[{i+1}/{N_PLAYS}] {addr[:10]}... → song {song_id}")
    print(f"  Plays completed: {ok}/{N_PLAYS}\n")


def random_buys(w3, wavecoin, users, song_ids, picker: SongPicker):
    """Generate N_BUYS random part purchase transactions across all users and songs."""
    print(f"=== Generating {N_BUYS} random part purchases ===")
    ok = 0
    for i in range(N_BUYS):
        addr = random.choice(users)
        song_id = int(picker.pick(song_ids))
        num_parts = random.randint(1, 5)
        ok += send_tx(w3, wavecoin.functions.buyParts(song_id, num_parts), addr, f"[{i+1}/{N_BUYS}] {addr[:10]}... → song {song_id}, {num_parts} part(s)")
    print(f"  Purchases completed: {ok}/{N_BUYS}\n")


def main():
    """Entry point: mint tokens, then seed plays and purchases."""
    random.seed(RANDOM_SEED)
    rng = np.random.default_rng(RANDOM_SEED)
    print(f"Network      : {NETWORK}\nRPC          : {RPC_URL}\nPonder       : {PONDER_URL}\nN_PLAYS      : {N_PLAYS}\nN_BUYS       : {N_BUYS}\nDISTRIBUTION : {DISTRIBUTION} (exponent={ZIPF_EXPONENT})\n")
    picker = make_picker(rng)

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    wavecoin = load_contract(w3, "Wavecoin")

    song_ids = fetch_song_ids()
    if not song_ids:
        print("ERROR: No songs found in Ponder. Run seed_database.py first.")
        return
    print(f"Found {len(song_ids)} songs: {song_ids}\n")

    users = get_accounts(w3)
    print(f"Using {len(users)} user accounts\n")

    mint_to_users(w3, wavecoin, users)
    random_plays(w3, wavecoin, users, song_ids, picker)
    random_buys(w3, wavecoin, users, song_ids, picker)

    print("Done.")


if __name__ == "__main__":
    main()
