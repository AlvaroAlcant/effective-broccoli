# Minijuegos Web

Colección de minijuegos construida con **Svelte 5 + SvelteKit**, desplegada como sitio estático en GitHub Pages.

## Estructura

```
├── src/
│   ├── routes/
│   │   ├── +page.svelte        Teclea a la Velocidad (página principal)
│   │   ├── index.css
│   │   ├── cafe/
│   │   │   ├── +page.svelte    Máquina de café (runes)
│   │   │   └── cafe.css
│   │   └── odyssey/
│   │       ├── +page.svelte    EstesIA Odyssey (shooter 2D)
│   │       └── odyssey.css
│   ├── lib/
│   │   ├── teclear/
│   │   │   ├── engine.svelte.js    GameEngine — ciclo de juego, view-models, acciones
│   │   │   ├── state.svelte.js     S = $state compartido
│   │   │   ├── storage.js          StorageService (SSR-safe)
│   │   │   ├── settings.js         Ajustes persistidos (idioma, veyon…)
│   │   │   ├── spiders.js          Físicas de las arañas de Halloween
│   │   │   ├── data/               Datos estáticos: palabras, catálogo,
│   │   │   │                       i18n, logros, eventos, constantes…
│   │   │   ├── services/           fx, i18n, economy, progression,
│   │   │   │                       identity, ranking, account, events
│   │   │   ├── modes/              Clases de modo de juego — Tecleo,
│   │   │   │                       Supervivencia, Aventura, Adivinar, Imágenes
│   │   │   └── *.svelte            Componentes (Header, GameArea, Shop,
│   │   │                           Inventario, Logros, Ranking, Debug…)
│   │   ├── odyssey/            game.js (initOdyssey)
│   │   └── img/                Imágenes (se importan, Vite las sirve con hash)
│   └── app.html                + script inline anti-FOUC (tema antes del paint)
├── .github/workflows/deploy.yml
└── vite.config.js              Config de SvelteKit (adapter-static + base path)
```

## Arquitectura de Teclear

- **`GameEngine`** (`engine.svelte.js`): el motor. `engine.state` expone `S`
  directamente, `engine.<getter>` son view-models reactivos y
  `engine.actions` las acciones que usa la vista. `window.Teclea` queda
  como API de consola.
- **`S`** (`state.svelte.js`): `$state` compartido — toda la UI suscribe
  al estado real, sin proxies ni fachadas.
- **Modos de juego** (`modes/`): clases polimórficas sobre `GameMode`.
  `modes[S.mode]` despacha ganchos (`enter`, `tick`, `typeInput`,
  `onNewWord`, `boardView`, `multiplier`…) — añadir un modo es una clase
  nueva + una entrada en `modes/index.js`.
- **Servicios** (`services/`): singletones con dependencias inyectadas
  vía `bind()` desde `mount()`.
- **Eventos** (`data/events.js` + `services/events.svelte.js`): cada
  evento es un dato — ventana de fechas, clase del body, variante de
  Supervivencia y `items` exclusivos con su definición completa. El
  registro `KINDS` de `economy` compone catálogo + items de evento
  automáticamente (`eco.all(kind)`), así que un evento nuevo con tienda
  propia = una entrada en `events.js` y nada más.
- **Items** (`data/catalog.js` + `economy.js`): registro `KINDS` con una
  vía genérica `owns`/`itemOn`/`useItem`/`buyItem`/`shopCards` para
  fuentes, fondos, extras y efectos. Los artículos de evento se pagan en
  caramelos; los de logro se ganan, no se compran.
- **Admin / debug** (`Debug.svelte`): panel 🐞 visible solo para admins
  (`ADMIN_NAMES` en `services/account.js`). Recursos editables, tema,
  extras, forzado de evento, fondos de prueba y compra real de la tienda.
  `Teclea.testEvent(id)` fuerza un evento; `Teclea.clearEvent()` vuelve
  al calendario.

## Desarrollo

```sh
npm install
npm run dev       # http://localhost:5173/effective-broccoli/
npm run build     # genera build/
npm run preview   # sirve el build en http://localhost:4173/effective-broccoli/
```

## Deploy

`.github/workflows/deploy.yml` construye y publica en GitHub Pages en cada push a `main`.
Requiere **Settings → Pages → Source: GitHub Actions** en el repo.
`paths.base` está fijado a `/effective-broccoli` en `vite.config.js`.

## Convenciones

- Imports de código con `#lib/…` (subpath imports de `package.json`).
- Las imágenes se importan: `import logo from '#lib/img/x.png'` — Vite genera la URL correcta con base y hash.
- Un CSS por ruta, importado desde su `+page.svelte`.
- `teclear` no renderiza a mano: la UI son componentes Svelte suscritos a `S`; el DOM imperativo solo queda para canvas/físicas/integraciones de navegador.
- `odyssey` expone `initOdyssey()` desde `#lib/odyssey/game.js`, que la ruta llama en `onMount`.

## Estado de la migración

- [x] Estructura SvelteKit + adapter-static + deploy
- [x] `cafe` reescrito con runes (`$state`, `$derived`)
- [x] `teclear`: markup dividido en componentes
- [x] `teclear`: estado interno a `$state` compartido (`S`)
- [x] `teclear`: closure + Proxy `G` eliminados — `GameEngine` con view-models y acciones
- [x] `teclear`: modos de juego polimórficos (`modes/`)
- [x] `teclear`: servicios de dominio (economía, progresión, i18n, ranking, cuenta, eventos, fx)
- [x] `teclear`: eventos como datos + tienda de evento autocomponible + panel de debug de admin
- [x] `teclear`: anti-FOUC (tema aplicado antes del primer paint)
- [ ] `odyssey`: UI del overlay (menú, HUD) a runes
