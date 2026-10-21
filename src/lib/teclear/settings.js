// Ajustes persistentes del juego: un único objeto en localStorage.
// Si se añaden más ajustes (idioma, fondo…) se guardan aquí también.
const STORAGE_KEY = "teclear.ajustes";

const DEFAULTS = {
    veyon: true,        // Modo Veyon activo por defecto
    abilityKey: "F1",   // Tecla reservada de la habilidad del fondo (Controles)
};

let cache = null;

function load() {
    if (cache) return cache;
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
        // Migración desde la clave suelta antigua: solo se respeta si el
        // jugador llegó a tocar el ajuste (si no, manda el nuevo default)
        const oldVeyon = localStorage.getItem("teclear.veyon");
        if (oldVeyon !== null && saved.veyon === undefined) {
            saved.veyon = oldVeyon === "1";
            localStorage.removeItem("teclear.veyon");
        }
    } catch (e) {
        // Sin almacenamiento (modo incógnito, etc.): se usan los defaults
        saved = {};
    }
    cache = { ...DEFAULTS, ...saved };
    return cache;
}

export function getSetting(key) {
    return load()[key];
}

export function setSetting(key, value) {
    load()[key] = value;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (e) { /* sin almacenamiento disponible */ }
}
