// ---------- Registro de eventos ----------
// Cada evento es un dato: ventana de fechas, clase del <body>, la
// variante de Supervivencia que habilita y los artículos exclusivos de
// su tienda de evento. Arrancar/cerrar un evento = tocar SOLO esta tabla;
// el EventService la recorre sola.
export const EVENTS = {
    // El evento de Halloween empieza el 8 de octubre y termina el 3 de
    // noviembre a las 12:00 (todos los años). Mientras dure, el logo y el
    // menú se visten de Halloween y se abre la TIENDA DE EVENTO con tres
    // artículos exclusivos: el fondo Five Nigths (fredi.gif, 1987
    // monedas), el efecto de tecleo Sangre (666 monedas) y el modo de
    // juego Truco o trato (2040 monedas). Cuando el evento termina, la
    // tienda de evento se cierra, pero lo comprado se queda para siempre.
    halloween: {
        id: "halloween",
        bodyClass: "halloween",          // clase que viste el <body>
        supVariant: "encantado",         // variante que ofrece el selector
        shopItems: { bg: "fivenights", fx: "sangre", extra: "truco" },
        start: { month: 9, day: 8 },     // octubre (meses de 0 a 11)
        end:   { month: 10, day: 3, hour: 12 },  // 3 de noviembre, 12:00
    },
};

// Castigo de cada tecla fallada en el modo Truco o trato: se pierde
// el DOBLE de tiempo y de experiencia (2 segundos y 2 XP)
export const TT_TIME_PENALTY = 2;
export const TT_XP_PENALTY = 2;

export function eventStartDate(def, year) {
    return new Date(year, def.start.month, def.start.day, 0, 0, 0, 0);
}

export function eventEndDate(def, year) {
    return new Date(year, def.end.month, def.end.day, def.end.hour || 0, 0, 0);
}

// ¿Está activo el evento en esta fecha?
export function eventOn(def, now) {
    const d = now || new Date();
    return d >= eventStartDate(def, d.getFullYear()) &&
           d < eventEndDate(def, d.getFullYear());
}
