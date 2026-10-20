// ---------- Evento de Halloween (fechas y modo Encantado) ----------
// ---------- Evento de Halloween ----------
// El evento empieza el 8 de octubre y termina el 3 de noviembre a
// las 12:00 (todos los años). Mientras dure, el logo y el menú se
// visten de Halloween y se abre la TIENDA DE EVENTO con tres
// artículos exclusivos: el fondo Five Nigths (fredi.gif, 1987
// monedas), el efecto de tecleo Sangre (666 monedas) y el modo de
// juego Truco o trato (2040 monedas). Cuando el evento termina, la
// tienda de evento se cierra, pero lo comprado se queda para siempre.
export const EVENT_MONTH = 9;         // octubre (los meses van de 0 a 11)
export const EVENT_DAY_START = 8;
export const EVENT_MONTH_END = 10;    // noviembre
export const EVENT_DAY_END = 3;
export const EVENT_HOUR_END = 12;
// Castigo de cada tecla fallada en el modo Truco o trato: se pierde
// el DOBLE de tiempo y de experiencia (2 segundos y 2 XP)
export const TT_TIME_PENALTY = 2;
export const TT_XP_PENALTY = 2;

export function eventStartDate(year) {
    return new Date(year, EVENT_MONTH, EVENT_DAY_START, 0, 0, 0, 0);
}

export function eventEndDate(year) {
    return new Date(year, EVENT_MONTH_END, EVENT_DAY_END, EVENT_HOUR_END, 0, 0, 0);
}

// ¿Está activo el evento de Halloween en esta fecha?
export function halloweenOn(now) {
    const d = now || new Date();
    return d >= eventStartDate(d.getFullYear()) &&
           d < eventEndDate(d.getFullYear());
}
