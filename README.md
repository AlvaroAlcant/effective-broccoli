# Minijuegos Web

Colección de minijuegos en HTML/CSS/JS estático, servida con GitHub Pages.

## Estructura

```
├── index.html               Teclea a la Velocidad (página principal)
├── EstesIA_Odyssey.html     Shooter arcade 2D
├── cafe.html                Máquina de café
├── assets/
│   ├── css/                 Una hoja de estilos por página
│   ├── js/                  Un script por página
│   └── img/                 Imágenes, GIFs y SVGs
└── .nojekyll                Desactiva Jekyll en GitHub Pages
```

## Desarrollo

Sin build: basta un servidor estático para probar en local.

```sh
python -m http.server 8000
# o
npx serve .
```

Convenciones:

- Cada página HTML en raíz enlaza `assets/css/<pagina>.css` y `assets/js/<pagina>.js`.
- Las imágenes se referencian como `assets/img/<archivo>` desde HTML/JS y `../img/<archivo>` desde CSS.
