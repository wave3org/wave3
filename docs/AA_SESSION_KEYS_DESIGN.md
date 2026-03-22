# Session Keys para Reproduccion sin Firma por Play (Implementado)

## Objetivo
Reducir la friccion de UX para que el usuario no firme cada reproduccion.

Con `session keys`, el usuario firma una autorizacion inicial y luego una clave efimera (controlada por el cliente) puede ejecutar `playSong` dentro de limites definidos.

## Estado Actual
- Quick win activo: `approve` solo cuando falta allowance y por `MAX_UINT256`.
- Session keys activables por flag: `NEXT_PUBLIC_ENABLE_PLAYBACK_SESSIONS=true`.
- Cuando session keys esta activo (y AA activo), `playSong` se ejecuta sin popup de firma de wallet por cada reproduccion.

## Flujo Implementado

### 1. Smart Account
`Wave3SmartAccount` incorpora politica de sesion:
- `authorizeSessionKey(address sessionKey, address target, bytes4 selector, uint64 validUntil, uint32 maxCalls, uint256 deadline, bytes signature)`
- `revokeSessionKey(address sessionKey, uint256 deadline, bytes signature)`
- `executeSession(address sessionKey, address target, uint256 value, bytes data, uint256 deadline, bytes sessionSignature)`

Reglas:
- Solo `owner` puede crear/revocar sesiones.
- `sessionKey` solo puede invocar `target + selector` permitidos.
- `value` forzado a `0`.
- `maxCalls` decremental.
- `validUntil` obligatorio.
- Nonce separado por `sessionKey` para evitar replay.

### 2. Backend Relay
`POST /api/smart-account/relay` soporta:
- `authorizeSessionKey`
- `executeSession`

Validaciones:
- Session key solo para `SongRoyalties.playSong(uint256)`.
- Target debe ser contrato permitido para sponsorship.
- `value` debe ser `0`.

### 3. Frontend
Flujo:
1. Usuario conecta wallet.
2. Si no hay sesion valida: firma autorizacion de session key una sola vez (tx patrocinada).
3. Cliente genera/guarda clave efimera (idealmente en memoria o storage cifrado).
4. Cada play firma con `sessionKey` local (sin popup wallet) y envia al relay para `executeSession`.

## Politicas Recomendadas
- Duracion: 24h.
- Limite: 100 reproducciones por sesion.
- Restriccion de target: solo `SongRoyalties`.
- Restriccion de selector: solo `playSong(uint256)`.
- Rotacion de `sessionKey` al cerrar sesion.

## Riesgos y Mitigaciones
- Robo de clave de sesion en navegador: reducir vigencia, limitar llamadas, revocacion inmediata.
- Abuso del relay: rate limit por usuario/IP y observabilidad.
- Desalineacion de nonce/calls: incluir checks on-chain estrictos y errores claros.

## Variables de Entorno
- `NEXT_PUBLIC_ENABLE_SMART_ACCOUNTS=true`
- `NEXT_PUBLIC_ENABLE_PLAYBACK_SESSIONS=true`
- `SMART_ACCOUNT_RELAYER_PRIVATE_KEY=<pk-del-relayer>`

## Notas
- Si `NEXT_PUBLIC_ENABLE_PLAYBACK_SESSIONS=false`, el flujo vuelve al modo AA normal (firma owner por `playSong`).
