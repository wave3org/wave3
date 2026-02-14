# GraphQL Codegen - Type-Safe Queries

## ¿Por qué lo necesitamos?

El frontend consulta Ponder (GraphQL) para obtener canciones indexadas. Sin codegen, las queries son strings sin tipado:

```typescript
// ❌ Sin tipos - propenso a errores
const query = `query { songss(where: { name_contains: "${search}" }) { items { name } } }`;
const response = await fetch(url, { body: JSON.stringify({ query }) });
const data = response.json(); // ¿Qué tipo tiene data? 🤷
```

Con codegen, obtenemos **TypeScript generado automáticamente** desde el schema de Ponder:

```typescript
// ✅ Con tipos - autocomplete, validación en compile-time
import { GetSongsDocument, GetSongsQuery, GetSongsQueryVariables } from "@/generated/graphql";

const data = await client.request<GetSongsQuery, GetSongsQueryVariables>(
  GetSongsDocument,              // ← Query pre-construida
  { nameContains: search }       // ← Variables tipadas (autocomplete!)
);
// data.songss.items ← TypeScript conoce la estructura exacta
```

## Cómo funciona

**1. Escribís queries en archivos `.graphql`:**
```graphql
# packages/nextjs/src/queries/GetSongs.graphql
query GetSongs($nameContains: String) {
  songss(where: { name_contains: $nameContains }) {
    items {
      songId
      name
      audioCID
    }
  }
}
```

**2. Ejecutás el comando de generación:**
```bash
make codegen
```

Esto genera TypeScript automáticamente y lo formatea con Prettier.

**3. Se genera TypeScript automáticamente:**
```typescript
// packages/nextjs/src/generated/graphql.ts (NO EDITAR - GENERADO)
export type GetSongsQueryVariables = Exact<{
  nameContains?: InputMaybe<Scalars['String']['input']>;
}>;

export type GetSongsQuery = { 
  songss: { 
    items: Array<{ 
      songId: any; 
      name: string; 
      audioCID: string; 
    }> 
  } 
};

export const GetSongsDocument = gql`...`; // Query lista para usar
```

**4. Lo usás en tu código con tipos completos:**
```typescript
import { GetSongsDocument, type GetSongsQuery, type GetSongsQueryVariables } from "@/generated/graphql";

const data = await client.request<GetSongsQuery, GetSongsQueryVariables>(
  GetSongsDocument,
  { nameContains: searchTerm }
);
```

## Los 3 plugins - ¿Por qué?

En `packages/nextjs/codegen.yml` hay 3 plugins:

```yaml
plugins:
  - typescript                         # 1️⃣ Tipos base del schema
  - typescript-operations              # 2️⃣ Tipos de tus queries
  - typescript-graphql-request         # 3️⃣ Constantes listas para usar
```

- **typescript**: Genera tipos TypeScript del schema GraphQL de Ponder (`Songs`, `SongsFilter`, etc.)
- **typescript-operations**: Genera tipos **específicos** para tus queries (`GetSongsQuery`, `GetSongsQueryVariables`)
- **typescript-graphql-request**: Genera constantes pre-construidas (`GetSongsDocument`) para `graphql-request`

Sin los 3, tenés tipado incompleto o tenés que escribir `gql` manualmente.

## Cuándo regenerar

**Ejecutá `make codegen` cuando:**
- ✅ Cambias el schema de Ponder (`packages/ponder/ponder.schema.ts`)
- ✅ Agregás/modificás queries en `packages/nextjs/src/queries/*.graphql`
- ✅ Ves errores de tipos después de cambios en Ponder

**NO hace falta regenerar si:**
- ❌ Solo cambias código de React/componentes
- ❌ Solo cambias estilos CSS

## Troubleshooting

**Error de lint en commit (husky/lint-staged):**
- Los archivos generados están excluidos de ESLint en `eslint.config.mjs`
- Si ves errores en `src/generated/graphql.ts`, verificá que el archivo esté en la lista de `ignores`
- El archivo se auto-formatea con Prettier después de generarse

## Archivos importantes

```
packages/nextjs/
├── codegen.yml                    # ← Configuración de codegen
├── eslint.config.mjs              # ← Ignora src/generated/** (auto-generado)
├── src/
│   ├── queries/                   # ← TUS QUERIES (editar)
│   │   └── GetSongs.graphql       # ← Escribís queries aquí
│   └── generated/                 # ← CÓDIGO GENERADO (NO EDITAR, ignorado por ESLint)
│       └── graphql.ts             # ← TypeScript generado automáticamente
└── services/
    └── songs/
        └── ponderSongService.ts   # ← Importa de generated/graphql.ts
```

**Nota sobre ESLint**: Los archivos en `src/generated/` están excluidos de ESLint porque son auto-generados. Si ves errores de lint en commits, asegurate de que `eslint.config.mjs` tenga:
```javascript
export default defineConfig([
  {
    ignores: ["src/generated/**/*"],
  },
  // ... resto de config
]);
```
