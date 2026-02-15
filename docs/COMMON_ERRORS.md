# Errores Comunes

## Linter se queja de contratos desactualizados

### Síntoma
El linter/type-checker arroja errores como:
```
Property 'SongRoyalties' does not exist on type '{ readonly Albums: ...'
```

O el frontend/Ponder no encuentran los contratos desplegados.

### Causa
Los contratos están desplegados en hardhat/localhost pero no en Sepolia (o viceversa). Los servicios (frontend, Ponder) usan los archivos de deployment generados en:
- `packages/hardhat/deployments/localhost/`
- `packages/hardhat/deployments/sepolia/`

Si estos archivos están desincronizados, los type-checkers no encuentran los contratos en los ABIs.

### Solución

**1. Para hardhat/localhost:**
```bash
yarn --cwd packages/hardhat deploy
```

**2. Para Sepolia:**
```bash
make deploy-sepolia
```

Esto regenera los archivos JSON en `packages/hardhat/deployments/` que son consumidos por:
- Frontend (TypeScript types)
- Ponder (indexador)
- Storage API
- Otros servicios

**Ambos deploys deben estar actualizados para que todo funcione correctamente.**

## Ponder no se inicia / CORS errors

### Síntoma
```
SES Removing unpermitted intrinsics error
CORS blocking requests
```

### Causa
Ponder necesita acceso al RPC y a la base de datos PostgreSQL.

### Solución
1. Asegurate que PostgreSQL está corriendo: `make dev`
2. Reinicia Ponder: `make dev-ponder`
3. Verifica que el RPC URL es correcto en `packages/ponder/ponder.config.ts`
4. Si persiste, chequea los logs: `docker logs` para el contenedor de Postgres

## Frontend no encuentra canciones

### Síntoma
Search page vacía aunque hay canciones deployadas.

### Causa
- Ponder no está corriendo o no indexó los eventos todavía
- El RPC_URL en Ponder apunta a la red incorrecta

### Solución
1. Verifica que `make dev-ponder` está corriendo
2. Chequea la consola de Ponder para ver si indexó los eventos de Songs
3. Si no ve eventos, el deploy podría no haberse hecho correctamente - ejecuta `yarn deploy` nuevamente
4. Espera 10-15 segundos para que Ponder indexe los eventos
5. Recarga el frontend

## Transacciones fallan con "insufficient balance"

### Síntoma
```
Error: insufficient balance for intrinsic transaction cost
```

### Causa
- La cuenta no tiene suficientes tokens WAVE
- Para Sepolia, la cuenta de deployment no tiene ETH de prueba

### Solución
1. **Localhost:** Usa el faucet en http://localhost:3000/faucet para obtener 100 WAVE
2. **Sepolia:** Faucet oficial: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
3. Verifica tu balance en el portfolio page

## Typecript errors después de cambios en contratos

### Síntoma
```
error TS2339: Property 'X' does not exist
```

### Causa
Los tipos de TypeScript se generan a partir de los ABIs en los deployment files.

### Solución
```bash
# Genera los tipos de TypeScript desde los ABIs
yarn --cwd packages/hardhat run scripts/generateTsAbis.ts
```

Luego recarga el IDE para que VSCode recargue los tipos.
