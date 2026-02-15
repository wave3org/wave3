# Arquitectura de Contratos Inteligentes

## Resumen

Wave3 utiliza 4 contratos inteligentes simples para una plataforma de streaming musical con reparto de regalías:

- **Wavecoin** - Token ERC20 para pagos
- **Albums** - Registro de álbumes
- **Songs** - Token ERC1155 que representa acciones de canciones (100 acciones por canción)
- **SongRoyalties** - Gestiona las tarifas de reproducción y el comercio de acciones

## Flujo de Contratos

```mermaid
graph TD
    A[Artista] -->|1. Crear Álbum| Albums
    A -->|2. Subir Canción| Songs
    Songs -->|Mintea 100 acciones| A
    
    L[Oyente] -->|3. Reproducir Canción<br/>Paga 1 WAVE| SongRoyalties
    SongRoyalties -->|Acumula| Royalties[(Pool de Regalías)]
    
    A -->|4. Retirar| SongRoyalties
    SongRoyalties -->|Envía WAVE proporcional| A
    
    F[Fan] -->|5. Comprar Acciones<br/>Precio = % Regalías Actuales| SongRoyalties
    SongRoyalties -->|Transfiere acciones| F
    SongRoyalties -->|Paga al vendedor| A
    
    F -->|6. Retirar Regalías Futuras| SongRoyalties
```

## Detalle de Contratos

### 1. Wavecoin (ERC20)

Token de pago simple con minteo público.

```solidity
function mint(uint256 amount) public
```

### 2. Albums

Almacena metadatos de álbumes con propiedad del artista.

```mermaid
classDiagram
    class Albums {
        +uint256 nextId
        +mapping albums
        +addAlbum(name, imageCID) uint256
        +getAlbum(id) Album
    }
    class Album {
        +uint256 id
        +string name
        +address artist
        +string imageCID
    }
    Albums --> Album
```

### 3. Songs (ERC1155)

Cada canción es un token ERC1155 con 100 acciones totales.

```mermaid
classDiagram
    class Songs {
        +uint256 TOTAL_SHARES = 100
        +mapping songs
        +addSong(name, audioCID, albumId) uint256
        +getSong(id) Song
    }
    class Song {
        +uint256 id
        +string name
        +string audioCID
        +uint256 albumId
    }
    Songs --> Song
```

**Puntos Clave:**
- El creador recibe 100 acciones (100% de propiedad)
- Acciones = porcentaje de regalías
- Las acciones son tokens ERC1155 transferibles

### 4. SongRoyalties

Gestiona el play-to-earn y el mercado de acciones.

```mermaid
stateDiagram-v2
    [*] --> SinRegalias: Canción Creada
    SinRegalias --> Acumulando: Oyente Reproduce (1 WAVE)
    Acumulando --> Acumulando: Más Reproducciones
    Acumulando --> Retirado: Accionista Retira %
    Retirado --> Acumulando: Más Reproducciones
    
    state "Precio Acción = 0" as SinRegalias
    state "Precio Acción > 0" as Acumulando
```

**Funciones:**

```solidity
function playSong(uint256 songId) external
// El oyente paga 1 WAVE, se agrega al pool de regalías

function withdrawRoyalties(uint256 songId) external
// El accionista retira: (regalías * acciones) / 100

function buyShares(uint256 songId, address seller, uint256 shares) external
// Precio = (regalíasTotales * acciones) / 100
// El vendedor debe aprobar el contrato primero
```

## Economía de Acciones

### Ejemplo: Ciclo de Vida de una Canción

```mermaid
sequenceDiagram
    participant Artista
    participant Songs
    participant SongRoyalties
    participant Fan
    participant Oyente

    Artista->>Songs: addSong()
    Songs->>Artista: Mintea 100 acciones
    
    Note over SongRoyalties: Regalías = 0 WAVE<br/>Precio Acción = 0 WAVE
    
    loop 100 reproducciones
        Oyente->>SongRoyalties: playSong() + 1 WAVE
    end
    
    Note over SongRoyalties: Regalías = 100 WAVE<br/>10 acciones = 10 WAVE
    
    Artista->>Songs: setApprovalForAll(SongRoyalties)
    Fan->>SongRoyalties: buyShares(songId, artista, 20)
    SongRoyalties->>Artista: Paga 20 WAVE
    SongRoyalties->>Fan: Transfiere 20 acciones
    
    Note over Artista,Fan: Artista: 80 acciones (80%)<br/>Fan: 20 acciones (20%)
    
    loop 50 reproducciones más
        Oyente->>SongRoyalties: playSong() + 1 WAVE
    end
    
    Note over SongRoyalties: Nuevas Regalías = 50 WAVE
    
    Artista->>SongRoyalties: withdrawRoyalties()
    SongRoyalties->>Artista: Envía 40 WAVE (80%)
    
    Fan->>SongRoyalties: withdrawRoyalties()
    SongRoyalties->>Fan: Envía 10 WAVE (20%)
```

### Modelo de Precios

El precio de las acciones es **dinámico** basado en las regalías acumuladas:

- **Canción nueva** (0 reproducciones) → Acciones cuestan **0 WAVE** (¡gratis!)
- **100 reproducciones** (100 WAVE de regalías) → 10 acciones cuestan **10 WAVE**
- **1000 reproducciones** (1000 WAVE de regalías) → 10 acciones cuestan **100 WAVE**

**Fórmula:**
```
Precio = (Regalías Totales × Acciones) ÷ 100
```

Esto significa:
- Los primeros seguidores obtienen acciones gratis
- El valor de las acciones crece con la popularidad de la canción
- Los vendedores son compensados exactamente por lo que pierden

## Decisiones Clave de Diseño

### Simplicidad Primero

1. **Tarifa de reproducción constante**: 1 WAVE por reproducción (sin variables)
2. **Acciones fijas**: Siempre 100 acciones por canción (porcentajes fáciles)
3. **Sin sistema de listado**: Comercio basado en aprobación (ERC1155 estándar)
4. **Pool de regalías único**: Por canción, no por artista
5. **Precio basado en valor**: Precio de acción = valor de regalías (mercado justo)

### ¿Por qué 100 Acciones?

- **Matemática fácil**: 1 acción = 1%
- **Legible para humanos**: 20 acciones = 20%
- **Precio simple**: Sin decimales complejos

### ¿Por qué Precio Dinámico?

- **Justo para vendedores**: Compensados por la pérdida de regalías
- **Recompensa a fans tempranos**: Acciones gratis antes de que la canción sea popular
- **Impulsado por el mercado**: El precio refleja el valor real
- **Sin especulación**: Precio = regalías reales, no hype

## Direcciones de Contratos

Los contratos desplegados se encuentran en:
```
packages/hardhat/deployments/localhost/
packages/hardhat/deployments/sepolia/
```

## Testing

Ejecutar tests:
```bash
cd packages/hardhat
npx hardhat test
```

Casos de prueba clave:
- Reproducir canción → Acumular regalías
- Retirar → Obtener porción proporcional
- Comprar acciones → Precio basado en regalías
- El valor de las acciones aumenta con las reproducciones
