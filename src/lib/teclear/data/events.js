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

// Texto de la cuenta atrás hasta el final del evento ("⏳ 3d 4h 12m 8s").
// Lo comparten el estado inicial (para que la barra nazca ya con texto)
// y el tick del EventService.
export function eventCountTxt(def, now) {
    const d = now || new Date();
    const ms = eventEndDate(def, d.getFullYear()) - d;
    const dd = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return "⏳ " + dd + "d " + h + "h " + m + "m " + s + "s";
}

// Evento activo al arrancar: el override de admin (si lo hay) o el
// primero del registro que toque por fecha. Espejo del script inline de
// app.html y del EventService — mismo criterio en los tres sitios.
export function initialEventId(testId) {
    if (testId && EVENTS[testId]) return testId;
    for (const id in EVENTS) {
        if (eventOn(EVENTS[id])) return id;
    }
    return null;
}
