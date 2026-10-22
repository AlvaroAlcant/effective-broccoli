// ---------- Registro del diccionario ----------
// El diccionario guarda las palabras que el jugador va escribiendo,
// agrupadas por la lista de la que salieron. Cada grupo se ABRE cuando
// se desbloquea su contenido: los dos primeros van siempre y los demás
// esperan a que se compre su modo en la tienda (o su fondo de evento).
// Añadir una lista al diccionario = una entrada aquí + la lista en
// words.js; el servicio (services/dictionary.js) hace el resto.
export const DIC_COIN = 5;   // monedas que regala cada palabra nueva

export const DIC_GROUPS = [
    {   // Palabras del idioma activo (español, inglés o murciano)
        id: "normal", icono: "📖",
        es: "Palabras normales", en: "Normal words", always: true
    },
    {   // Giros del habla murciana (el idioma 🗣️ Murciano)
        id: "murciano", icono: "🗣️",
        es: "Palabras murcianas", en: "Murcian words", always: true
    },
    {   // Extras de la tienda: cada uno trae su propia lista de palabras
        id: "php", icono: "🐘", extra: "php",
        es: "Modo Php", en: "PHP mode"
    },
    {
        id: "andaluz", icono: "🫒", extra: "andaluz",
        es: "Modo Andaluz", en: "Andalusian mode"
    },
    {
        id: "cubico", icono: "⛏️", extra: "cubico",
        es: "Modo Cúbico", en: "Cubic mode"
    },
    {
        id: "picante", icono: "🌶️", extra: "picante",
        es: "Modo picante", en: "Spicy mode"
    },
    {   // Modo de evento: sus palabras de Halloween
        id: "truco", icono: "🎃", extra: "truco",
        es: "Truco o trato", en: "Trick or treat"
    },
    {   // Habilidad del fondo Calaca (tienda de evento)
        id: "hueso", icono: "🦴", bg: "calaca",
        es: "Baile calaca", en: "Bone dance"
    }
];
