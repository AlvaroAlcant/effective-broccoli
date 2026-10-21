// ---------- Imágenes del modo Imágenes ----------
// ---------- Imágenes del modo Imágenes ----------
// em: emoji de reserva (se pinta si no hay internet)
// La imagen real es el SVG de Twemoji de esa emoji: la misma figura
// en todos los sistemas, con o sin conexión.
export const IMAGENES = [
    { es: "manzana",     en: "apple",      em: "🍎" },
    { es: "coche",       en: "car",        em: "🚗" },
    { es: "árbol",       en: "tree",       em: "🌳" },
    { es: "sol",         en: "sun",        em: "☀️" },
    { es: "luna",        en: "moon",       em: "🌙" },
    { es: "pez",         en: "fish",       em: "🐟" },
    { es: "gato",        en: "cat",        em: "🐱" },
    { es: "perro",       en: "dog",        em: "🐶" },
    { es: "pájaro",      en: "bird",       em: "🐦" },
    { es: "casa",        en: "house",      em: "🏠" },
    { es: "estrella",    en: "star",       em: "⭐" },
    { es: "fuego",       en: "fire",       em: "🔥" },
    { es: "agua",        en: "water",      em: "💧" },
    { es: "nieve",       en: "snow",       em: "❄️" },
    { es: "flor",        en: "flower",     em: "🌸" },
    { es: "pizza",       en: "pizza",      em: "🍕" },
    { es: "pan",         en: "bread",      em: "🍞" },
    { es: "leche",       en: "milk",       em: "🥛" },
    { es: "abeja",       en: "bee",        em: "🐝" },
    { es: "rana",        en: "frog",       em: "🐸" },
    { es: "mono",        en: "monkey",     em: "🐵" },
    { es: "globo",       en: "balloon",    em: "🎈" },
    { es: "regalo",      en: "gift",       em: "🎁" },
    { es: "balón",       en: "ball",       em: "⚽" },
    { es: "piano",       en: "piano",      em: "🎹" },
    { es: "guitarra",    en: "guitar",     em: "🎸" },
    { es: "libro",       en: "book",       em: "📚" },
    { es: "lápiz",       en: "pencil",     em: "✏️" },
    { es: "llave",       en: "key",        em: "🔑" },
    { es: "reloj",       en: "clock",      em: "⏰" },
    { es: "corona",      en: "crown",      em: "👑" },
    { es: "corazón",     en: "heart",      em: "❤️" },
    { es: "bici",        en: "bike",       em: "🚲" },
    { es: "barco",       en: "boat",       em: "⛵" },
    { es: "avión",       en: "plane",      em: "✈️" },
    { es: "cohete",      en: "rocket",     em: "🚀" },
    { es: "queso",       en: "cheese",     em: "🧀" },
    { es: "huevo",       en: "egg",        em: "🥚" },
    { es: "plátano",     en: "banana",     em: "🍌" },
    { es: "naranja",     en: "orange",     em: "🍊" },
    { es: "fresa",       en: "strawberry", em: "🍓" },
    { es: "sandía",      en: "watermelon", em: "🍉" },
    { es: "helado",      en: "icecream",   em: "🍦" },
    { es: "pastel",      en: "cake",       em: "🎂" },
    { es: "hamburguesa", en: "burger",     em: "🍔" },
    { es: "patatas",     en: "fries",      em: "🍟" },
    { es: "sombrero",    en: "hat",        em: "🎩" },
    { es: "dado",        en: "dice",       em: "🎲" },
    { es: "vela",        en: "candle",     em: "🕯️" },
    { es: "unicornio",   en: "unicorn",    em: "🦄" },
    { es: "tortuga",     en: "turtle",     em: "🐢" },
    { es: "mundo",       en: "earth",      em: "🌍" },
    { es: "cereza",      en: "cherry",     em: "🍒" },
    { es: "melocotón",   en: "peach",      em: "🍑" }
];

// SVG de Twemoji para una emoji (si la descarga falla se pinta la emoji)
export function emojiSrc(em) {
    const cps = Array.from(String(em))
        .filter(ch => ch !== "\u200d" && ch !== "\ufe0f")
        .map(ch => ch.codePointAt(0).toString(16))
        .join("-");
    return "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/" + cps + ".svg";
}
