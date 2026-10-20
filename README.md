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
│   │   ├── teclear/            Componentes de la página principal + game.js
│   │   ├── odyssey/            game.js (initOdyssey)
│   │   └── img/                Imágenes (se importan, Vite las sirve con hash)
│   └── app.html
├── .github/workflows/deploy.yml
└── vite.config.js              Config de SvelteKit (adapter-static + base path)
```

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
- Cada juego expone `init*()` desde `#lib/<juego>/game.js`, que la ruta llama en `onMount`.
- Los controladores (`game.js`) aún usan DOM imperativo internamente: se migran a runes/stores de forma incremental.

## Estado de la migración

- [x] Estructura SvelteKit + adapter-static + deploy
- [x] `cafe` reescrito con runes (`$state`, `$derived`)
- [x] `teclear`: markup dividido en componentes, controlador `initTeclear()`
- [x] `odyssey`: controlador `initOdyssey()`
- [ ] `teclear`: estado interno a runes/stores (puntuación, tienda, logros…)
- [ ] `odyssey`: UI del overlay (menú, HUD) a runes
