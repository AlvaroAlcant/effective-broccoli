import imgFranco from '#lib/img/Francisco_Franco_1930.jpg';
import imgElprico from '#lib/img/Elprico.png';
import imgEsteso from '#lib/img/esteso.jpg';

// ---------- Catálogo de la tienda ----------
// ---------- Estilos de letra de la tienda ----------
// font: pila de fuentes (la última siempre existe como reserva)
// cls: clase CSS que aplica el estilo (definida en el bloque de estilos)
export const FONT_STYLES = [
    { id: "clasico",  price: 0,   cls: "ff-clasico",  es: "Clásico",  en: "Classic",  font: 'Consolas, "Courier New", monospace' },
    { id: "moderno",  price: 25,  cls: "ff-moderno",  es: "Moderno",  en: "Modern",   font: '"Poppins", "Segoe UI", Arial, sans-serif' },
    { id: "elegante", price: 50,  cls: "ff-elegante", es: "Elegante", en: "Elegant",  font: 'Georgia, "Times New Roman", serif' },
    { id: "pixel",    price: 80,  cls: "ff-pixel",    es: "Pixel",    en: "Pixel",    font: '"Press Start 2P", Consolas, monospace' },
    { id: "comic",    price: 120, cls: "ff-comic",    es: "Cómic",    en: "Comic",    font: '"Comic Sans MS", "Comic Sans", cursive' },
    { id: "script",   price: 160, cls: "ff-manuscrito", es: "Manuscrito", en: "Script", font: '"Pacifico", "Brush Script MT", cursive' },
    { id: "neon",     price: 220, cls: "ff-neon",     es: "Neón",     en: "Neon",     font: '"Segoe UI", Arial, sans-serif' },
    { id: "oro",      price: 300, cls: "ff-oro",      es: "Oro",      en: "Gold",     font: 'Georgia, "Times New Roman", serif' },
    {
        // No se compra con monedas: es la RECOMPENSA del logro
        // "Shinyy" (price null = no está a la venta, ach = solo se
        // gana jugando). Una letra facetada como un diamante, con un
        // destello que la recorre sin parar.
        id: "shinyy", price: null, ach: true,
        cls: "ff-shinyy", es: "Shinyy", en: "Shinyy",
        font: '"Orbitron", "Segoe UI", Arial, sans-serif'
    }
];

// ---------- Fondos de pantalla de la tienda ----------
// price 0 = siempre disponible; el resto se compran con monedas
// icon: emoji de la miniatura cuando no hay imagen (Sopa de Letras
// se dibuja con el canvas animado de letras rebotando)
// desc*: habilidad única que da el fondo mientras está equipado
export const BACKGROUNDS = [
    { id: "dark",    price: 0,   es: "Oscuro",            en: "Dark",
      descEs: "Sin habilidad: partida normal.",            descEn: "No ability: a normal match.",
      img: "" },
    { id: "franco",  price: 120, es: "General",           en: "General",
      descEs: "Habilidad: doble de monedas en cada partida.", descEn: "Ability: double coins in every match.",
      img: imgFranco },
    { id: "elprico", price: 60,  es: "Elprico",           en: "Elprico",
      descEs: "Habilidad: empiezas con 15 segundos extra.",  descEn: "Ability: start with 15 extra seconds.",
      img: imgElprico },
    { id: "esteso",  price: 90,  es: "Ia",                en: "Ia",
      descEs: "Habilidad: las palabras de más de 7 letras dan triple de puntos y monedas.", descEn: "Ability: words over 7 letters give triple points and coins.",
      img: imgEsteso },
    { id: "sopa",    price: 550, es: "Sopa de Letras",    en: "Letter Soup",
      descEs: "Habilidad: cada palabra empieza con 2 letras ya puestas.", descEn: "Ability: every word starts with 2 letters already in place.",
      img: "", icon: "🔤" },
    {
        // No se compra con monedas: es la RECOMPENSA del logro
        // "Speedrunner" (price null = no está a la venta, ach = solo
        // se gana jugando). Pura estética: coches disparados.
        id: "carreras", price: null, ach: true, decor: true,
        es: "Circuito", en: "Race Track",
        descEs: "Coches que cruzan la pantalla a toda velocidad. ¡Recompensa del logro «Speedrunner»!",
        descEn: "Cars crossing the screen at full speed. Reward of the “Speedrunner” achievement!",
        img: "", icon: "🏁"
    },
    {
        // Igual que Circuito, pero con la lluvia binaria de Matrix
        id: "hacker", price: null, ach: true, decor: true,
        es: "Hacker", en: "Hacker",
        descEs: "Números binarios verdes cambiando sobre fondo negro. ¡Recompensa del logro «Hacker»!",
        descEn: "Changing green binary digits on a black background. Reward of the “Hacker” achievement!",
        img: "", icon: "💻"
    },
    // (Los fondos de evento, como «Five Nigths», se declaran en su
    //  registro de data/events.js — no aquí)
];

// ---------- Extras de la tienda ----------
// id: identificador guardado en localStorage · price: precio en monedas
// icon: vista previa de la tarjeta · desc*: texto de la tarjeta
// msgBuy/msgOn/msgOff: claves de texto de la tienda (i18n)
export const EXTRAS = [
    {
        id: "picante",
        price: 1000,
        icon: "🌶️",
        es: "Modo picante",
        en: "Spicy mode",
        descEs: "Palabras subidas de tono (+18) a mitad de cada partida.",
        descEn: "Risque (+18) words halfway through every match.",
        msgBuy: "shopBoughtExtra",
        msgOn: "shopEquippedExtraMsg",
        msgOff: "shopDeactivatedExtraMsg"
    },
    {
        id: "caos",
        price: 3333,
        icon: "🌀",
        es: "Modo Caos",
        en: "Chaos mode",
        descEs: "Mezcla palabras de todos los idiomas y modos en la misma partida, con letras de todo tipo.",
        descEn: "Mixes words from every language and mode in one match, all kinds of letters.",
        msgBuy: "shopBoughtCaos",
        msgOn: "shopEquippedCaosMsg",
        msgOff: "shopDeactivatedCaosMsg"
    },
    {
        id: "php",
        price: 199,
        icon: "🐘",
        es: "Modo Php",
        en: "Php mode",
        descEs: "Escribe palabras y funciones de PHP: formularios, peticiones web y programación orientada a objetos.",
        descEn: "Type PHP words and functions: forms, web requests and object-oriented programming.",
        msgBuy: "shopBoughtPhp",
        msgOn: "shopEquippedPhpMsg",
        msgOff: "shopDeactivatedPhpMsg"
    },
    {
        id: "espejo",
        price: 321,
        icon: "🪞",
        es: "Modo Espejo",
        en: "Mirror mode",
        descEs: "Las palabras aparecen del revés: tienes que escribirlas al revés, letra por letra.",
        descEn: "Words come out backwards: you must type them reversed, letter by letter.",
        msgBuy: "shopBoughtEspejo",
        msgOn: "shopEquippedEspejoMsg",
        msgOff: "shopDeactivatedEspejoMsg"
    },
    {
        id: "andaluz",
        price: 540,
        icon: "🫒",
        es: "Modo Andaluz",
        en: "Andalusian mode",
        descEs: "Palabras y expresiones típicas del dialecto andaluz: ¡sin apurar, que hay jartá!",
        descEn: "Words and sayings from the Andalusian dialect: watch out, they're tricky!",
        msgBuy: "shopBoughtAndaluz",
        msgOn: "shopEquippedAndaluzMsg",
        msgOff: "shopDeactivatedAndaluzMsg"
    },
    {
        id: "azar",
        price: 777,
        icon: "🎲",
        es: "Modo Al azar",
        en: "Random mode",
        descEs: "Cada partida elige uno o varios modos comprados al azar: nunca sabes qué te toca.",
        descEn: "Every match randomly picks one or more modes you own: you never know what's coming.",
        msgBuy: "shopBoughtAzar",
        msgOn: "shopEquippedAzarMsg",
        msgOff: "shopDeactivatedAzarMsg"
    },
    {
        id: "cubico",
        price: 2009,
        icon: "⛏️",
        es: "Modo Cúbico",
        en: "Cubic mode",
        descEs: "Palabras sacadas de Minecraft: mobes, bloques, objetos y dimensiones del juego.",
        descEn: "Words taken from Minecraft: mobs, blocks, items and game dimensions.",
        msgBuy: "shopBoughtCubico",
        msgOn: "shopEquippedCubicoMsg",
        msgOff: "shopDeactivatedCubicoMsg"
    },
    // (Los extras de evento, como «Truco o trato», se declaran en su
    //  registro de data/events.js — no aquí)
];

// La tienda enseña los modos de juego ordenados por precio,
// del más barato al más caro
EXTRAS.sort((a, b) => a.price - b.price);

// ---------- Efectos de tecleo de la tienda ----------
// id: se guarda en el localStorage · price: precio en monedas
// icon: etiqueta de texto del artículo (Fuego no usa emoji: su
//       art/shape dibuja la llama con CSS, en la tienda, en el
//       inventario y en el propio estallido de las letras)
// colors: colores de las chispas
// glyph: emoji que sale de vez en cuando con cada letra
// shape: forma de la partícula (dot | block | drop | flame)
// count/power/rise: cuántas partículas, hacia dónde y cuánto trepan
// life: milisegundos que vive cada partícula
// Al comprar se desbloquean para siempre y solo uno está activo
export const TYPE_EFFECTS = [
    {
        id: "fuego",
        price: 250,
        icon: "🔥",
        color: "#ff6a00",
        es: "Fuego",
        en: "Fire",
        descEs: "Chispas de fuego que trepan con cada letra que tecleas.",
        descEn: "Fire sparks that climb with every letter you type.",
        colors: ["#ff6a00", "#ff9f1c", "#ffcc33", "#ff3d00"],
        // Sin emoji: llama dibujada con CSS (forma de gota con el
        // núcleo caliente dentro) que trepa y parpadea al morir
        art: "flame", shape: "flame", glyph: null,
        count: 7, power: 70, rise: -70, size: 15, life: 750
    },
    {
        id: "estrellas",
        price: 500,
        icon: "⭐",
        color: "#ffd60a",
        es: "Estrellas",
        en: "Stars",
        descEs: "Estrellitas doradas que revolotean al escribir.",
        descEn: "Golden stars fluttering while you type.",
        colors: ["#ffd60a", "#ffe66d", "#fff3b0", "#ffea00"],
        glyph: "⭐", count: 8, power: 85, rise: -35, size: 15, life: 850
    },
    {
        id: "artificiales",
        price: 670,
        icon: "🎆",
        color: "#c77dff",
        es: "Fuegos artificiales",
        en: "Fireworks",
        descEs: "Ráfagas multicolor que estallan en todas direcciones.",
        descEn: "Multicolour bursts exploding in every direction.",
        colors: ["#ff4d6d", "#ffd60a", "#4cc9f0", "#b5e48c", "#c77dff"],
        glyph: "🎆", count: 16, power: 150, rise: -25, size: 16, life: 900
    },
    {
        id: "hielo",
        price: 840,
        icon: "❄️",
        color: "#7dd3fc",
        es: "Hielo",
        en: "Ice",
        descEs: "Cristales de hielo que caen con cada tecla.",
        descEn: "Ice crystals falling with every key.",
        colors: ["#7dd3fc", "#e0f2fe", "#38bdf8", "#a5f3fc"],
        glyph: "❄️", count: 8, power: 75, rise: 70, size: 15, life: 850
    },
    {
        id: "magia",
        price: 1100,
        icon: "🪄",
        color: "#e879f9",
        es: "Magia",
        en: "Magic",
        descEs: "Destellos mágicos rosas y violetas en cada letra.",
        descEn: "Pink and violet magic sparkles on every letter.",
        colors: ["#e879f9", "#c084fc", "#f0abfc", "#67e8f9"],
        glyph: "✨", count: 10, power: 95, rise: -50, size: 16, life: 900
    },
    // (Los efectos de evento, como «Sangre», se declaran en su registro
    //  de data/events.js — no aquí)
    {
        // No se compra con monedas: es la RECOMPENSA del logro
        // "Un poco de pólvora" (price null = no está a la venta).
        // Las partículas son cubos que salen despedidos como en la
        // explosión de un creeper de Minecraft: destello blanco,
        // humo gris y hierba verde por todos lados.
        id: "explosion",
        price: null,
        ach: true,
        icon: "💥",
        color: "#8ff05a",
        es: "Explosión",
        en: "Explosion",
        descEs: "Cubos y destellos que estallan como la explosión de un creeper de Minecraft. ¡Recompensa del logro «Un poco de pólvora»!",
        descEn: "Blocks and flashes bursting like a Minecraft creeper explosion. Reward of the “A bit of gunpowder” achievement!",
        colors: ["#ffffff", "#e9fff2", "#8ff05a", "#4ea52a", "#2f7a1e", "#c3cab8", "#7d8676"],
        glyph: "💥", glyphEvery: 6, count: 18, power: 175, rise: -25, size: 16, life: 950,
        shape: "block"
    }
];
