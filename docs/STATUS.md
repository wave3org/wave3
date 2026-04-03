# Wave3 — Project Status Audit

> Auto-generated: 2026-04-03

---

## Architecture Overview

```mermaid
graph TB
    subgraph Blockchain["⛓️ Blockchain (Hardhat / Sepolia)"]
        SF[SongsFactory]
        SM[SongsModel]
        SMgr[SongsManager]
        AMgr[AlbumsManager]
        WC[Wavecoin ERC20]
        Song[Song]
        RD[RoyaltiesDistribution]
        Album[Album]
        SAF[Wave3SmartAccountFactory]
        SA[Wave3SmartAccount]
    end

    subgraph Frontend["🌐 Next.js Frontend"]
        Pages[Pages]
        Hooks[Hooks]
        SmartAccountSvc[Smart Account Service]
        RelaySvc[Relay API Route]
    end

    subgraph Indexer["📇 Ponder Indexer"]
        PConfig[ponder.config.ts]
        PHandlers[Event Handlers]
        PSchema[Schema]
        PApi[REST API]
    end

    subgraph DB["🗄️ PostgreSQL"]
        PG[(wave3 DB)]
    end

    subgraph Storage["📦 Storage Service"]
        IPFS[IPFS / Pinata]
    end

    subgraph ML["🤖 ML Service"]
        Recommender[ALS + FAISS]
    end

    SF --> SM
    SM --> SMgr
    SM --> AMgr
    SMgr --> Song
    AMgr --> Album
    Song --> RD
    WC --> SM
    SAF --> SA

    Pages --> Hooks
    Hooks --> SmartAccountSvc
    SmartAccountSvc --> RelaySvc
    RelaySvc --> SA

    PConfig --> Blockchain
    PHandlers --> PSchema
    PSchema --> PG
    PApi --> PG

    ML --> PApi
    Frontend --> Storage
    Frontend --> PApi
    Frontend --> Blockchain
```

---

## Component Health

```mermaid
graph LR
    subgraph Legend
        OK["✅ OK"]
        WARN["⚠️ Issues"]
        BROKEN["❌ Broken"]
    end
```

| Component | Status | Notes |
|-----------|--------|-------|
| Smart Contracts (Solidity) | ✅ OK | Compiles, logic is sound |
| Smart Account Contracts | ✅ OK | EIP-712, session keys, relayer pattern |
| Wavecoin | ✅ OK | ERC20 with mint/buyParts/buyPlay |
| Smart Account Frontend Integration | ❌ **Broken** | Targets non-existent `SongRoyalties` contract |
| Ponder Indexer | ❌ **Broken** | Handlers reference contracts that don't exist in deployedContracts |
| Frontend Pages | ⚠️ Partial | 8 pages exist, search uses mock service |
| Test Coverage | ⚠️ Minimal | Contracts: basic, many `TODO: FINISH TESTS`; Frontend: 1 test file |
| ML Recommendation | ⚠️ OK-ish | Works if ponder provides data; depends on broken indexer |
| Storage / IPFS | ✅ OK | Simple upload proxy to IPFS/Pinata |
| Docker Compose | ✅ OK | All services wired correctly |

---

## Critical Issue #1: Smart Account → Ghost Contract

The frontend smart account integration calls a **`SongRoyalties` contract that was never built**. The actual contract architecture doesn't match what the frontend expects.

```mermaid
graph LR
    subgraph "What the frontend expects"
        SA1[SmartAccount] -->|"execute()"| SR["SongRoyalties.playSong()"]
        SA1 -->|"approve()"| WC1["Wavecoin.approve(SongRoyalties)"]
        SA1 -->|"executeSession()"| SR
    end

    subgraph "What actually exists"
        SA2[SmartAccount] -->|"should call"| WC2["Wavecoin.buyPlay(songId)"]
    end

    SR -.-x|"DOES NOT EXIST"| X["❌"]

    style SR fill:#ff6b6b,color:#fff
    style X fill:#ff6b6b,color:#fff
```

### Affected files
- `packages/nextjs/services/songs/playSongService.ts` — calls `playSong()` on `royaltiesAddress`
- `packages/nextjs/hooks/scaffold-eth/useSponsoredSongPlayback.ts` — session key for `playSong` selector
- `packages/nextjs/app/api/smart-account/relay/route.ts` — relays to wrong targets
- `docs/AA_SESSION_KEYS_DESIGN.md` — references `SongRoyalties`

### What needs to change
- `playSong(songId)` on SongRoyalties → `buyPlay(songId)` on **Wavecoin**
- No `approve()` needed — `Wavecoin.buyPlay()` uses `transfer()` from `msg.sender`
- Session key target should be **Wavecoin** address, selector `buyPlay(uint256)`

---

## Critical Issue #2: Ponder Indexer — Wrong Contract Names

```mermaid
graph TB
    subgraph "Ponder handlers (what code says)"
        H1["Songs:AddedSong"]
        H2["Albums:AddedAlbum"]
        H3["SongRoyalties:SongPlayed"]
    end

    subgraph "Actual event sources"
        E1["SongsManager.AddedSong"]
        E2["AlbumsManager.AlbumAdded"]
        E3["SongsModel.SongPlayed"]
    end

    subgraph "deployedContracts keys"
        D1[SongsFactory]
        D2[SongsModel]
        D3[SongsPresenter]
        D4[Wave3SmartAccountFactory]
        D5[Wavecoin]
    end

    H1 -.-x|"No 'Songs' key"| D1
    H2 -.-x|"No 'Albums' key"| D1
    H3 -.-x|"No 'SongRoyalties' key"| D1

    E1 -.-|"internal contract, no known address"| SMgr["SongsManager (child of SongsModel)"]
    E2 -.-|"internal contract, no known address"| AMgr["AlbumsManager (child of SongsModel)"]
    E3 -.-|"emitted by"| SM2["SongsModel ✅ (deployed)"]

    style H1 fill:#ff6b6b,color:#fff
    style H2 fill:#ff6b6b,color:#fff
    style H3 fill:#ff6b6b,color:#fff
    style SM2 fill:#51cf66,color:#fff
```

### The problem
- `SongsManager` and `AlbumsManager` are created internally by `SongsModel`'s constructor — their addresses are not in `deployedContracts`
- Ponder config dynamically reads `deployedContracts` keys → no `Songs`, `Albums`, or `SongRoyalties` keys exist
- **`SongPlayed` and `PartsPurchased` events ARE on `SongsModel`** (which IS deployed), so those can be indexed
- `AddedSong` event is on `SongsManager` and `AlbumAdded` is on `AlbumsManager` — these child contracts need their addresses exposed or the events need to be moved to `SongsModel`

### Missing event: `PartsPurchased`
`SongsModel` emits `PartsPurchased(songId, buyer, parts)` but ponder has **no handler and no table** for it.

---

## Contract Architecture (Actual)

```mermaid
graph TB
    subgraph "Deploy Order"
        D1["01: SongsModel"] --> D2["02: Wavecoin(SongsModel)"]
        D1 --> D3["03a: SongsPresenter(SongsModel)"]
        D1 --> D3b["03b: SongsFactory(Wavecoin, SongsModel)"]
        D4["04: Wave3SmartAccountFactory"]
    end

    subgraph "SongsModel internals"
        SongsModel --> |"creates in constructor"| AlbumsManager
        SongsModel --> |"creates in constructor"| SongsManager
    end

    subgraph "User Actions via Wavecoin"
        User -->|"Wavecoin.buyPlay(songId)"| Wavecoin
        User -->|"Wavecoin.buyParts(songId, n)"| Wavecoin
        User -->|"Wavecoin.withdrawRoyalties(songId)"| Wavecoin
        Wavecoin --> SongsModel
        SongsModel --> Song
        Song --> RoyaltiesDistribution
    end

    subgraph "Song Creation via SongsFactory"
        Artist -->|"addAlbum()"| SongsFactory
        Artist -->|"addSong()"| SongsFactory
        SongsFactory --> SongsModel
    end
```

---

## Test Coverage

```mermaid
pie title Test Coverage Distribution
    "Wave3SmartAccount (thorough)" : 5
    "RoyaltiesDistribution (basic)" : 3
    "SongsManager (1 test)" : 1
    "AlbumsManager (1 test + TODO)" : 1
    "Wavecoin (1 test + TODO)" : 1
    "Relay API route (vitest)" : 3
    "Frontend pages (NONE)" : 0
    "Frontend hooks (NONE)" : 0
    "Ponder handlers (NONE)" : 0
    "ML service (NONE)" : 0
    "Storage service (NONE)" : 0
```

### Hardhat tests

| File | Tests | Status |
|------|-------|--------|
| `Wave3SmartAccount.ts` | 4 tests (execute, invalid sig, session keys, gasless) | ✅ Thorough |
| `RoyaltiesDistribution.ts` | ~3 tests (parts calc, buy, distribute) | ⚠️ Basic |
| `SongsManager.ts` | 1 test (create song) | ⚠️ Minimal |
| `AlbumsManager.ts` | 1 test + `TODO: FINISH TESTS` | ⚠️ Stub |
| `Wavecoin.ts` | 1 test (mint) + `TODO: FINISH TESTS` | ⚠️ Stub |

### Frontend tests

| File | Tests | Status |
|------|-------|--------|
| `relay/route.test.ts` | Relay API (create, execute, rate limit) | ✅ OK |
| Everything else | — | ❌ None |

---

## Frontend Pages

```mermaid
graph LR
    subgraph Pages
        Home["/home"]
        Market["/marketplace"]
        Upload["/upload"]
        Search["/search"]
        Playlists["/playlists"]
        Portfolio["/portfolio"]
        Recs["/recommendations"]
    end

    subgraph Status
        Home --- OK1["✅ Carousel + Featured"]
        Market --- OK2["✅ Grid view"]
        Upload --- OK3["✅ Create album + add songs"]
        Search --- WARN1["⚠️ Uses mock service"]
        Playlists --- OK4["✅ Exists"]
        Portfolio --- OK5["✅ Exists"]
        Recs --- DEP1["⚠️ Depends on ML → Ponder (broken chain)"]
    end
```

---

## Service Dependencies

```mermaid
graph TB
    User((User)) --> Frontend
    Frontend --> Blockchain
    Frontend --> Ponder
    Frontend --> Storage
    Frontend --> ML

    Ponder -->|"reads events from"| Blockchain
    Ponder -->|"stores in"| Postgres
    ML -->|"fetches song-plays from"| Ponder
    Storage -->|"uploads to"| IPFS

    Ponder -.-x|"❌ handlers broken"| Blockchain

    style Ponder fill:#ff6b6b,color:#fff
```

If Ponder can't index events → the REST API returns no data → ML can't train → Recommendations are empty → Search (if moved off mock) has nothing.

---

## Summary of Required Fixes (Priority Order)

### P0 — Blocking everything

1. **Fix Ponder event handlers** — Either:
   - Move `AddedSong`/`AlbumAdded` events to `SongsModel` (so they emit from a deployed contract), OR
   - Expose `SongsManager`/`AlbumsManager` addresses from `SongsModel` and add them to deploy scripts
   - Fix handler names: `SongRoyalties:SongPlayed` → `SongsModel:SongPlayed`
2. **Add `PartsPurchased` handler** to Ponder (event already exists on `SongsModel`)

### P1 — Smart Account integration

3. **Fix `playSongService.ts`** — Target `Wavecoin.buyPlay(songId)` instead of non-existent `SongRoyalties.playSong(songId)`
4. **Fix session key config** — Target = Wavecoin address, selector = `buyPlay(uint256)`
5. **Remove unnecessary `approve()` call** — `buyPlay` uses `transfer()`, not `transferFrom()`

### P2 — Tests & polish

6. **Finish contract tests** — Wavecoin (`buyParts`, `buyPlay`, `withdrawRoyalties`), AlbumsManager (multiple albums)
7. **Replace search mock** with real Ponder query
8. **Add frontend tests** — at minimum for `playSongService`, `smartAccount` service
