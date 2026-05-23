# Wave3 — Diseño de Métricas y Data Viz

> Pensado como un analista de datos/BI mirando el producto desde afuera.
> Al final, acá hay plata en juego. Las métricas tienen que responder esa pregunta.

---

## Perspectiva 1: Inversor (compró partes de canciones)

### "¿Cuánto gané y a qué tasa?"

| Métrica | Descripción | Fórmula | Dónde la tenemos |
|---|---|---|---|
| **Total Invested** | Capital puesto | Σ(partes × precio) | ✅ Portfolio |
| **Royalties Earned** | Ganancia acumulada (pendiente de retirar) | Σ pendingBalance on-chain | ✅ Portfolio |
| **ROI total** | Retorno sobre inversión | Royalties / Invested × 100 | ❌ falta |
| **ROI por canción** | Qué canción rindió más | idem por songId | ❌ falta |
| **Yield anualizado** | Como APY de un FCI | ROI × (365 / días desde compra) | ❌ falta |
| **Participación %** | Qué % del flujo de esa canción recibo | partsOwned / totalParts | ✅ Modal |
| **Plays generados** | Cuántos plays generaron mis partes | plays de mis canciones | ✅ Modal |
| **Ingresos por play** | Revenue promedio que genera 1 play | playFee × participación% | ❌ falta |

### "¿Qué tengo y cómo está distribuido?"

- Composición del portfolio: pie chart canciones por % de inversión
- Concentración: ¿estoy muy metido en una sola canción?
- Diversificación por artista / género
- Timeline de compras: cuándo compré y a qué precio

### "¿Cuándo cobro?"

- Historial de withdrawals (desde eventos on-chain)
- Proyección de ingresos si los plays se mantienen al ritmo actual
- Días desde última actividad por canción

---

## Perspectiva 2: Artista (subió su canción)

### "¿Cómo va mi canción?"

| Métrica | Descripción | Fórmula | Dónde la tenemos |
|---|---|---|---|
| **Total plays** | Reproducciones acumuladas | plays desde Ponder | ✅ Ponder |
| **Plays últimos 7/30 días** | Tendencia reciente | filtro temporal en Ponder | ❌ falta |
| **Revenue total generado** | WAVE que generó la canción | plays × playFee | ❌ falta |
| **Revenue retenido** | Lo que queda después del 30% fee | revenue × 0.70 | ❌ falta |
| **Partes vendidas** | Cuánto capital levantó | boughtParts / totalParts | ✅ Ponder |
| **Capital levantado** | WAVE recibido por venta de partes | partes vendidas × partPrice | ❌ falta |
| **Holders únicos** | Cuántos inversores tiene | count(distinct buyer) | ❌ falta |
| **Boost activo** | Si la canción está boosteada | boostExpiry on-chain | ✅ BoostButton |

### "¿Cuándo me conviene hacer qué?"

- Tendencia de plays: ¿crece o baja? (serie temporal)
- Plays por fuente (ML recommendation vs búsqueda directa — futuro)
- Correlación boost → plays: ¿el boost movió la aguja?

---

## Perspectiva 3: Métricas del sistema (vista admin / informe)

Estas no se muestran al usuario final pero sirven para el informe:

- **TVL (Total Value Locked)**: WAVE bloqueado en partes de canciones
- **Volume de withdrawals**: flujo de royalties retirados por período
- **Distribución de canciones por plays**: ley de potencia (80/20?)
- **Tasa de conversión**: usuarios que escuchan → usuarios que invierten
- **Churn de inversores**: inversores que nunca retiran vs activos

---

## Qué mostraría primero (MVP priorizado)

```
P0 (ya existe o es trivial de calcular):
  - Royalties Earned (✅ implementado hoy)
  - ROI total = Royalties / Invested
  - Total plays por canción

P1 (requiere trabajo pero alto impacto):
  - ROI por canción en tabla de Portfolio
  - Plays últimos 7 días (filtro en Ponder)
  - Revenue total generado por artista

P2 (nice to have, requiere historización):
  - Yield anualizado (APY)
  - Timeline de plays (gráfico)
  - Proyección de ingresos
```

---

## Notas de implementación

- **ROI** se puede calcular 100% en frontend con datos que ya tenemos (`tokensInvested` + `pendingRoyalties`)
- **Plays por período** requiere que Ponder indexe con timestamp o que filtremos eventos `SongPlayed`
- **Serie temporal** requiere almacenar snapshots o leer eventos históricos del contrato
- `playFee = 1 WAVE`, `DEFAULT_PART_PRICE = 10 WAVE`, fee del sistema = 30% sobre royalties
