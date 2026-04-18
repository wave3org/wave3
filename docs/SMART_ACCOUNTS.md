# Smart Accounts en Wave3

## Objetivo

Wave3 usa smart accounts para que las interacciones con blockchain se sientan más cercanas a un producto de streaming musical que a una dApp tradicional.

El objetivo principal es eliminar los popups repetidos de la wallet en acciones de alta frecuencia, como reproducir una canción, sin perder verificabilidad on-chain.

Este desarrollo se hizo para soportar:

- transacciones gasless para playback
- autorización por sesión para acciones repetidas
- una experiencia más fluida de "poner play y escuchar"
- futuras reglas de producto, como features atadas a suscripción

## Por Qué Se Agregaron Smart Accounts

En el flujo original, cada reproducción implicaba una aprobación de wallet.

Eso no era un buen fit para una UX tipo Spotify porque:

- reproducir canciones es una acción muy frecuente
- los popups de wallet interrumpen la escucha
- las confirmaciones repetidas hacen que la app se sienta lenta y frágil
- el manejo del gas pasa a formar parte del recorrido del usuario

Las smart accounts resuelven eso separando:

- quién es el dueño de la cuenta y autoriza permisos
- quién paga el gas
- qué actor puede ejecutar acciones repetidas ya aprobadas

En Wave3 eso significa:

- el usuario sigue siendo dueño de la experiencia a través de su wallet
- el relayer paga el gas
- una session key puede ejecutar reproducciones repetidas sin abrir un popup cada vez

## Arquitectura General

El sistema actual se compone de cuatro partes:

1. `Wave3SmartAccount`
2. `Wave3SmartAccountFactory`
3. el relay en `app/api/smart-account/relay`
4. el flujo de frontend en `useSponsoredSongPlayback`

### Contratos

`Wave3SmartAccount` es la cuenta de ejecución controlada por el usuario.

Soporta:

- `execute(...)`
- `authorizeSessionKey(...)`
- `executeSession(...)`
- `revokeSessionKey(...)`

`Wave3SmartAccountFactory` crea una smart account por owner y funciona como punto de onboarding para la creación de cuentas.

### Relay

El relay se encarga de:

- crear la smart account si hace falta
- enviar transacciones patrocinadas
- pagar el gas con la cuenta relayer
- aplicar restricciones sobre qué llamadas pueden sponsorearse

### Frontend

El frontend:

- detecta si el usuario ya tiene una smart account
- la crea vía relay si todavía no existe
- genera y guarda una session key
- pide una firma inicial del owner para autorizar esa sesión
- luego firma los plays localmente con la session key

## Flujo Actual de Playback

Hoy el flujo de reproducción es:

1. El usuario toca `Play`.
2. El frontend chequea si ya existe una smart account.
3. Si no existe, el relay la crea a través de la factory.
4. Durante esa creación, la factory también registra a esa smart account como playback operator aprobado del usuario dentro de `Wavecoin`.
5. Si no hay una session key válida, el usuario firma una única autorización con su wallet principal.
6. La session key se guarda del lado cliente y se reutiliza mientras siga siendo válida.
7. Los plays posteriores se firman con la session key y se envían al relay.
8. El relayer paga el gas.

Por eso el primer play puede requerir una firma, pero los siguientes no deberían hacerlo.

## Por Qué Playback Usa `buyPlayFor(songId, listener)`

Durante la integración apareció un problema importante de diseño.

La lógica original de `Wavecoin.buyPlay(songId)` cobraba usando:

- `balanceOf(msg.sender)`

Eso no funciona bien con una smart account separada, porque cuando la smart account ejecuta:

- `msg.sender` pasa a ser la smart account
- y deja de ser la wallet real del usuario

Eso obligaría a que la smart account tenga `WAVE`, que no es el modelo de producto buscado.

En Wave3 se quiere que:

- la cuenta real del usuario siga teniendo los `WAVE`
- el play quede atribuido al usuario real
- la smart account actúe solo como capa autorizada de ejecución

Para soportar eso, playback ahora usa:

- `buyPlayFor(uint256 songId, address listener)`

Eso permite:

- cobrarle a la address real del usuario
- atribuir el play a la address real del usuario
- seguir ejecutando a través de la smart account

## Por Qué la Smart Account se Autoriza como Operador Durante la Creación

La smart account se aprueba automáticamente como playback operator durante su creación.

Esta decisión se tomó por motivos de UX.

Si esa aprobación fuera un segundo paso explícito, el onboarding quedaría así:

1. crear smart account
2. aprobar smart account como operador
3. autorizar session key

Eso es técnicamente prolijo, pero demasiado pesado para el usuario.

En cambio, Wave3 registra ese permiso como parte del flujo de creación de cuenta, para que el onboarding se sienta como un único setup y no como varias operaciones desconectadas.

### Por Qué se Aceptó Esta Decisión

Esto genera cierto acoplamiento entre la factory y Wavecoin, pero se consideró aceptable porque:

- playback es la acción repetida más importante del producto
- el objetivo es minimizar al máximo la fricción inicial
- la factory se usa en un contexto específico de Wave3, no como paquete genérico de account abstraction

El tradeoff es intencional:

- un diseño algo más específico de la app
- una mejor experiencia de primer uso

## Session Keys

Las session keys son el mecanismo que elimina los popups repetidos de wallet.

Una session key:

- se genera del lado cliente
- se autoriza una vez por el owner
- queda restringida a un target y un selector
- tiene expiración y máximo número de llamadas

En Wave3, hoy se usa para acciones de playback.

Eso permite:

- una firma inicial de wallet
- ningún popup por cada play posterior
- límites explícitos sobre qué puede hacer esa sesión

## Beneficios para la UX

Las mejoras de UX son la razón principal por la que existe este sistema.

### 1. Menos Popups de Wallet

El usuario ya no necesita aprobar cada reproducción.

Eso hace que la app se sienta mucho más como una plataforma de streaming y mucho menos como un panel transaccional.

### 2. Playback Gasless

El relayer paga el gas, así que el usuario no necesita token nativo solo para escuchar.

### 3. Mejor Onboarding

La smart account se crea en segundo plano cuando hace falta, y el permiso de playback operator se resuelve dentro del mismo setup inicial.

### 4. Mejor Visibilidad del Estado

El frontend hoy expone mensajes como:

- `Creating your smart account...`
- `Authorizing your playback session...`
- `Preparing your gasless playback session...`
- `Sending gasless play transaction...`

Eso ayuda a que el usuario entienda qué está pasando durante la configuración inicial.

## Por Qué Este Diseño Sirve para Features de Suscripción

Las suscripciones son una de las razones más fuertes para mantener una arquitectura programable basada en smart accounts.

Aunque la implementación actual está enfocada en playback, la arquitectura ya es compatible con extensiones atadas a suscripción.

Ejemplos:

- permitir playback por sesión solo mientras la suscripción esté activa
- definir distintos `maxCalls` según el tier
- definir distintas duraciones de sesión según el plan
- habilitar acciones premium a través de otros selectores
- aplicar políticas distintas de sponsorship según el estado de suscripción

### Extensiones Prácticas

Este diseño permite agregar reglas como:

- usuarios free: cuota de reproducciones
- usuarios premium: sesiones más largas y más llamadas
- planes family: permisos más amplios
- trials: sesiones más cortas y límites menores

Esas reglas pueden validarse en distintas capas según el nivel de garantía que se quiera:

- reglas de UX en frontend
- validaciones en el relay
- validaciones on-chain

## Por Qué se Eligió una Smart Account Custom

Wave3 eligió una smart account custom en lugar de depender de un provider externo por una razón principal:

- desarrollo local-first

El equipo quiere poder construir y probar el sistema completo localmente con Hardhat.

Eso es una ventaja importante de la arquitectura actual porque:

- contratos, relay y frontend pueden probarse juntos
- no hay dependencia de bundlers o infraestructura externa
- el debugging local es más simple
- el equipo mantiene control total sobre el comportamiento del producto

Eso es especialmente valioso mientras el modelo del producto todavía está evolucionando.

## Tradeoffs Principales

Este enfoque trae beneficios claros, pero también costos claros.

### Pros

- mejor UX de playback
- experiencia gasless
- desarrollo local-first
- control fuerte sobre el comportamiento
- buena base para features por suscripción
- fácil de extender con lógica propia del producto

### Contras

- más código custom para mantener
- más piezas que en un flujo simple de wallet write
- el diseño de contratos tiene que alinearse con la ejecución delegada
- más responsabilidad backend en el relay

## Seguridad y Límites del Producto

El diseño actual restringe intencionalmente qué puede sponsorearse y qué puede ejecutar una session key.

Eso es importante porque cuanto más fluida es la UX, más importante es mantener límites fuertes.

Hoy esos límites incluyen:

- target restringido
- selector restringido
- `value = 0`
- máximo de llamadas
- expiración

Esos límites ayudan a sostener una UX más amigable sin transformar al relay o a la session key en un canal de ejecución irrestricto.

## Próximos Pasos Naturales

La base actual permite evolucionar hacia:

- políticas de sesión sensibles a suscripción
- límites y features por tier
- mejor UX de revocación y renovación
- extender el patrón a otros writes donde tenga sentido
- mejorar observabilidad del ciclo de vida de smart account y playback

## Resumen

Las smart accounts en Wave3 se incorporaron para resolver un problema de producto, no solo un problema técnico de blockchain.

El propósito es que reproducir música se sienta más fluido, rápido y gasless, manteniendo el control suficiente para agregar features premium más adelante.

Las decisiones más importantes fueron:

- usar smart accounts para evitar interacciones repetidas con la wallet
- usar session keys para acciones de playback repetidas
- mantener los `WAVE` en la cuenta real del usuario
- ejecutar playback como `buyPlayFor(songId, listener)`
- registrar la smart account como playback operator durante la creación
- mantener el sistema local-first y bajo control del equipo

Esa combinación deja una base fuerte para:

- mejor UX de música
- menos interrupciones
- customización futura por suscripción
- y un flujo de producto mucho más cercano al de una plataforma de streaming mainstream
