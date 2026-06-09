# Smart Contracts — Cómo funcionan

> Referencia técnica con diagramas de flujo y estado para todos los contratos del sistema Wave3.

---

## 1. Arquitectura general

Wave3 usa una arquitectura de contratos modulares. Cuatro contratos se despliegan una sola vez (vía scripts), y el resto se crean dinámicamente en runtime.

```mermaid
graph TD
    subgraph FRONTEND["Frontend / Usuario"]
        U["EOA / Smart Account"]
    end

    subgraph STATIC["Contratos estáticos (deploy scripts)"]
        WC["Wavecoin<br/>ERC-20 — token WAVE"]
        SF["SongsFactory<br/>escritura"]
        SP["SongsPresenter<br/>lectura"]
        SM["SongsModel<br/>orquestador + eventos"]
    end

    subgraph RUNTIME_MODEL["Creados por SongsModel"]
        AM["AlbumsManager"]
        SMgr["SongsManager"]
    end

    subgraph RUNTIME_ENTITY["Creados por entidad"]
        A["Album<br/>datos de álbum"]
        S["Song<br/>datos + lógica"]
        RD["RoyaltiesDistribution<br/>fracciones + regalías"]
    end

    subgraph SA["Smart Accounts (opcional)"]
        SAF["Wave3SmartAccountFactory"]
        SAC["Wave3SmartAccount<br/>EIP-712 + session keys"]
    end

    U -->|"mint / buyPlay / buyParts<br/>withdrawRoyalties / boostSong"| WC
    U -->|"addAlbum / addSong"| SF
    U -->|"getSong / getSongs"| SP

    WC --> SM
    SF --> SM
    SP --> SM

    SM -->|"constructor"| AM
    SM -->|"constructor"| SMgr

    AM -->|"addAlbum()"| A
    SMgr -->|"addSong()"| S
    S -->|"constructor"| RD

    U -.->|"gasless via relayer"| SAF
    SAF -.-> SAC
    SAC -.->|"execute()"| WC
```

---

## 2. Despliegue de contratos

```mermaid
flowchart TD
    START(["Deploy scripts"]) --> deployWC["Deployar Wavecoin<br/>(owner, treasury, SongsModel)"]
    deployWC --> deploySM["Deployar SongsModel"]
    deploySM_sub["SongsModel constructor"] --> newAM["new AlbumsManager()"]
    deploySM_sub --> newSMgr["new SongsManager()"]
    deploySM["Deployar SongsModel"] --> deploySM_sub
    deploySM --> deploySF["Deployar SongsFactory<br/>(Wavecoin, SongsModel)"]
    deploySF --> deploySP["Deployar SongsPresenter<br/>(SongsModel)"]
    deploySP --> END(["Sistema listo"])

    style deploySM_sub fill:#f0f0f0,stroke:#aaa
```

---

## 3. Flujo: crear un álbum

```mermaid
flowchart TD
    A(["Artista llama addAlbum()"]) --> SF["SongsFactory<br/>inyecta msg.sender como owner"]
    SF --> SM["SongsModel.addAlbum()"]
    SM --> AM["AlbumsManager.addAlbum()"]
    AM --> newAlbum["new Album(<br/>owner, name, artist,<br/>genre, year, imageCID<br/>)"]
    newAlbum --> storeAlbum["Almacena Album en mapping<br/>albums[id]"]
    storeAlbum --> returnId["Retorna albumId"]
    returnId --> emitEvt["emit AlbumAdded(<br/>id, owner, name, artist,<br/>imageCID, genre, year<br/>)"]
    emitEvt --> ponder["Ponder indexa el evento<br/>→ DB off-chain"]
    ponder --> END(["Album disponible"])
```

---

## 4. Flujo: publicar una canción

```mermaid
flowchart TD
    A(["Artista llama addSong()"]) --> SF["SongsFactory<br/>inyecta msg.sender como owner"]
    SF --> SM["SongsModel.addSong()"]
    SM --> SMgr["SongsManager.addSong()"]
    SMgr --> newSong["new Song(<br/>owner, name, audioCID,<br/>albumId, playFee, partPrice,<br/>totalParts, nonSellableParts, wavecoin<br/>)"]
    newSong --> newRD["Song constructor:<br/>new RoyaltiesDistribution(<br/>owner, partPrice, totalParts, nonSellableParts<br/>)"]
    newRD --> rdInit["RD inicializa:<br/>parts[owner] = totalParts<br/>availableParts = totalParts - nonSellableParts"]
    rdInit --> returnSongId["Retorna songId"]
    returnSongId --> emitEvt["emit SongAdded(<br/>id, owner, name, audioCID, albumId<br/>)"]
    emitEvt --> ponder["Ponder indexa el evento"]
    ponder --> END(["Canción publicada y fraccionable"])
```

---

## 5. Flujo: reproducir una canción (`buyPlay`)

```mermaid
flowchart TD
    U(["Oyente llama buyPlay(songId)"]) --> WC["Wavecoin.buyPlay()"]
    WC --> prePre["Llama buyPlayFor(songId, msg.sender)"]
    prePre --> authCheck{"msg.sender == listener<br/>OR operador aprobado?"}
    authCheck -->|No| revertAuth(["revert: Not authorized"])
    authCheck -->|Sí| preBuyPlay["SongsModel.preBuyPlay(songId)<br/>retorna (playFee, songAddress)"]
    preBuyPlay --> balCheck{"balance[listener]<br/>> playFee?"}
    balCheck -->|No| revertFunds(["revert: Insufficient funds"])
    balCheck -->|Sí| transfer["_transfer(listener → songAddress, playFee)"]
    transfer --> smBuyPlay["SongsModel.buyPlay(songId, listener)"]
    smBuyPlay --> songBuyPlay["Song.buyPlay()"]
    songBuyPlay --> distribute["RoyaltiesDistribution.distributeRevenue(playFee)"]
    distribute --> loop["Para cada holder:<br/>balances[holder] += (playFee / totalParts) × parts[holder]"]
    loop --> emitEvt["emit SongPlayed(songId, listener)"]
    emitEvt --> END(["Regalías distribuidas entre holders"])
```

---

## 6. Flujo: comprar fracciones (`buyParts`)

```mermaid
flowchart TD
    U(["Fan llama buyParts(songId, n)"]) --> WC["Wavecoin.buyParts()"]
    WC --> preParts["SongsModel.preBuyParts(songId, n)<br/>retorna (totalPrice, songAddress)"]
    preParts --> balCheck{"balance[msg.sender]<br/>>= totalPrice?"}
    balCheck -->|No| revert(["revert: Insufficient funds"])
    balCheck -->|Sí| transfer["transfer(msg.sender → songAddress, totalPrice)"]
    transfer --> smBuyParts["SongsModel.buyParts(songId, buyer, n)"]
    smBuyParts --> songBuyParts["Song.buyParts(buyer, n)"]
    songBuyParts --> rdBuyParts["RoyaltiesDistribution.buyParts(buyer, n)"]
    rdBuyParts --> availCheck{"availableParts >= n?"}
    availCheck -->|No| revert2(["revert: Not enough parts available"])
    availCheck -->|Sí| holdsCheck{"buyer ya es holder?"}
    holdsCheck -->|Sí| addParts["parts[buyer] += n"]
    holdsCheck -->|No| newHolder["alreadyHolds[buyer] = true<br/>parts[buyer] = n<br/>holders.push(buyer)"]
    addParts --> decrementOwner["parts[owner] -= n<br/>availableParts -= n"]
    newHolder --> decrementOwner
    decrementOwner --> emitEvt["emit SongPurchase(songId, buyer, n)"]
    emitEvt --> END(["Fan es holder, recibe regalías futuras"])
```

---

## 7. Flujo: retirar regalías (`withdrawRoyalties`)

```mermaid
flowchart TD
    U(["Holder llama withdrawRoyalties(songId)"]) --> WC["Wavecoin.withdrawRoyalties()"]
    WC --> smWithdraw["SongsModel.withdrawRoyalties(songId, msg.sender)<br/>retorna (amount, songAddress)"]
    smWithdraw --> songWithdraw["Song.withdrawRoyalties(holder)"]
    songWithdraw --> rdWithdraw["RoyaltiesDistribution.withdraw(holder)"]
    rdWithdraw --> holdsCheck{"alreadyHolds[holder]?"}
    holdsCheck -->|No| revert1(["revert: Sender does not hold any parts"])
    holdsCheck -->|Sí| balCheck{"balances[holder] > 0?"}
    balCheck -->|No| revert2(["revert: No royalties to withdraw"])
    balCheck -->|Sí| reset["withdrawnBalance = balances[holder]<br/>balances[holder] = 0"]
    reset --> approve["Song.wavecoin.approve(holder, amount)"]
    approve --> feeCalc["fee = amount × 30%"]
    feeCalc --> payFee["transferFrom(songAddress → owner, fee)"]
    payFee --> payHolder["transferFrom(songAddress → holder, amount - fee)"]
    payHolder --> emitEvt["emit RoyaltiesWithdrawn(songId, holder)"]
    emitEvt --> END(["Holder recibe 70% de sus regalías"])

    note["⚠️ El 30% va al owner del protocolo (treasury)"]
    style note fill:#fff3cd,stroke:#f0ad4e
```

---

## 8. Flujo: boost de canción (`boostSong`)

```mermaid
flowchart TD
    U(["Usuario llama boostSong(songId)"]) --> WC["Wavecoin.boostSong()"]
    WC --> priceCheck["price = SongsModel.BOOST_PRICE<br/>(10 WAVE)"]
    priceCheck --> balCheck{"balance[msg.sender]<br/>>= price?"}
    balCheck -->|No| revert(["revert: Insufficient funds"])
    balCheck -->|Sí| transfer["transfer(msg.sender → treasury, price)"]
    transfer --> smBoost["SongsModel.boostSong(songId, msg.sender)"]
    smBoost --> setExpiry["boostExpiry[songId] = block.timestamp + 30 days"]
    setExpiry --> emitEvt["emit SongBoosted(songId, payer, expiresAt)"]
    emitEvt --> END(["Canción boosteada por 30 días"])
```

---

## 9. Flujo: gasless con Smart Account y session key

```mermaid
flowchart TD
    U(["Usuario (EOA)"])
    U -->|"1. Firma offchain AuthorizeSessionKey EIP-712"| SAC["Wave3SmartAccount"]
    SAC --> storeSession["_sessions[sessionKey] = SessionConfig<br/>(target, selector, validUntil, maxCalls)"]
    storeSession --> emitSK["emit SessionKeyAuthorized"]

    Relayer(["Relayer (paga gas)"]) -->|"2. executeSession(sessionKey, target, data, sig)"| SAC2["Wave3SmartAccount"]
    SAC2 --> checkSK{"sessionKey activa<br/>no expirada<br/>usedCalls < maxCalls<br/>target y selector ok?"}
    checkSK -->|No| revertSK(["revert: InvalidSessionKey<br/>/ SessionExpired<br/>/ UsageExceeded<br/>/ etc."])
    checkSK -->|Sí| verifySig["Verifica firma EIP-712<br/>del sessionKey"]
    verifySig --> incUsed["usedCalls++"]
    incUsed --> callTarget["target.call(data)"]
    callTarget --> emitExec["emit SessionExecuted"]
    emitExec --> END(["Transacción ejecutada sin gas del usuario"])
```

---

## 10. Diagramas de estado

### 10.1 Estado de una canción

```mermaid
stateDiagram-v2
    [*] --> Inexistente

    Inexistente --> Publicada : addSong() por artista<br/>Song + RoyaltiesDistribution deployados

    Publicada --> ConFracciones : buyParts() por fan/inversor<br/>availableParts disminuye

    ConFracciones --> ConFracciones : más buyParts()<br/>hasta agotar availableParts

    Publicada --> RegaliasActivas : buyPlay() por oyente<br/>distributeRevenue() ejecutado

    ConFracciones --> RegaliasActivas : buyPlay() por oyente<br/>regalías distribuidas entre holders

    RegaliasActivas --> RegaliasActivas : más reproducciones<br/>balances acumulan

    RegaliasActivas --> RegaliasRetiradas : withdrawRoyalties() por holder<br/>balance = 0 (puede volver a acumular)

    RegaliasRetiradas --> RegaliasActivas : nueva reproducción<br/>vuelve a acumular

    Publicada --> Boosteada : boostSong()<br/>boostExpiry = now + 30d

    ConFracciones --> Boosteada : boostSong()

    RegaliasActivas --> Boosteada : boostSong()

    Boosteada --> Publicada : expiresAt alcanzado
    Boosteada --> ConFracciones : expiresAt alcanzado
    Boosteada --> RegaliasActivas : expiresAt alcanzado
```

### 10.2 Estado de RoyaltiesDistribution

```mermaid
stateDiagram-v2
    [*] --> Inicial

    Inicial : totalParts asignadas al owner<br/>availableParts = total - nonSellable<br/>0 holders externos

    Inicial --> ParcialmenteVendida : buyParts(buyer, n)<br/>availableParts -= n

    ParcialmenteVendida --> ParcialmenteVendida : más buyParts()<br/>nuevos holders agregados

    ParcialmenteVendida --> TotalmenteVendida : availableParts == 0

    Inicial --> ConRegalias : distributeRevenue(amount)<br/>balances actualizados

    ParcialmenteVendida --> ConRegalias : distributeRevenue(amount)

    TotalmenteVendida --> ConRegalias : distributeRevenue(amount)

    ConRegalias --> ConRegalias : distributeRevenue() adicionales<br/>balances siguen acumulando

    ConRegalias --> Vaciada : withdraw() por todos los holders<br/>todos los balances = 0

    Vaciada --> ConRegalias : nueva distributeRevenue()
```

### 10.3 Estado de Session Key (Smart Account)

```mermaid
stateDiagram-v2
    [*] --> Inactiva

    Inactiva --> Autorizada : authorizeSessionKey() firmado por owner<br/>active = true, validUntil, maxCalls configurados

    Autorizada --> EnUso : executeSession() por relayer<br/>usedCalls++

    EnUso --> EnUso : más executeSession()<br/>mientras usedCalls < maxCalls y no expirada

    EnUso --> Agotada : usedCalls == maxCalls

    Autorizada --> Expirada : block.timestamp > validUntil

    EnUso --> Expirada : block.timestamp > validUntil

    Autorizada --> Revocada : revokeSessionKey() firmado por owner

    EnUso --> Revocada : revokeSessionKey() firmado por owner

    Agotada --> [*]
    Expirada --> [*]
    Revocada --> [*]
```

---

## 11. Flujo de tokens WAVE (resumen financiero)

```mermaid
flowchart LR
    Usuario["Usuario<br/>(WAVE balance)"]
    SongContract["Song Contract<br/>(WAVE balance)"]
    Holders["Holders<br/>(balances[holder])"]
    OwnerProtocolo["Owner protocolo<br/>(30% fee)"]
    Treasury["Treasury<br/>(boost fees)"]

    Usuario -->|"mint(amount)"| Usuario
    Usuario -->|"buyPlay: playFee"| SongContract
    Usuario -->|"buyParts: n × partPrice"| SongContract
    SongContract -->|"distributeRevenue()<br/>(virtual, mapping)"| Holders
    Holders -->|"withdrawRoyalties()<br/>70% del balance"| Holders
    Holders -->|"30% fee"| OwnerProtocolo
    Usuario -->|"boostSong: 10 WAVE"| Treasury
```

---

## 12. Eventos emitidos por SongsModel (indexados por Ponder)

| Evento | Cuándo se emite | Campos indexados |
|---|---|---|
| `AlbumAdded` | `addAlbum()` exitoso | `id`, `owner` |
| `SongAdded` | `addSong()` exitoso | `id`, `owner`, `albumId` |
| `SongPurchase` | `buyParts()` exitoso | `songId`, `buyer` |
| `SongPlayed` | `buyPlay()` exitoso | `songId`, `listener` |
| `RoyaltiesWithdrawn` | `withdrawRoyalties()` exitoso | `songId`, `holder` |
| `SongBoosted` | `boostSong()` exitoso | `songId`, `payer` |

Ponder escucha estos eventos y actualiza la base de datos off-chain para que el frontend pueda consultar sin leer directamente la blockchain.
