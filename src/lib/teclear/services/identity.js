// Identidad del jugador: su id de dispositivo, el nombre con el que
// firma en el ranking, las comprobaciones de nombres y las primitivas
// criptográficas (SHA-256 + KDF) con las que se guardan las contraseñas.
// Son funciones puras sobre StorageService y S: sin estado propio salvo
// playerId, que se carga una vez al arrancar.
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { NAME_MAX, KDF_ROUNDS } from '../data/constants.js';

let playerId = "";   // identificador del jugador en este dispositivo

// Id corto y aleatorio para un jugador nuevo
export function makeId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

export function loadPlayerId() {
    if (playerId) return playerId;
    try {
        playerId = storage.get("teclear.jugador") || "";
        if (!playerId) {
            playerId = makeId();
            storage.set("teclear.jugador", playerId);
        }
    } catch (e) {
        playerId = makeId();
    }
    return playerId;
}

export function loadPlayerName() {
    try {
        return String(storage.get("teclear.nombre") || "").slice(0, NAME_MAX);
    } catch (e) {
        return "";
    }
}

export function savePlayerName(name) {
    try {
        storage.set("teclear.nombre", name);
    } catch (e) { /* sin almacenamiento disponible */ }
}

export function cleanName(v) {
    return String(v == null ? "" : v)
        .replace(/[\u0000-\u001f\u007f<>]/g, " ")  // controles y etiquetas HTML
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, NAME_MAX);
}

// Nombres que se admiten al escribirlos ahora mismo: letras (con o sin
// acento), números, espacios y algunos signos; nada de símbolos raros
export function nameOk(v) {
    try {
        const plano = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return /^[\w .'-]+$/.test(plano) && v.length > 0 && v.length <= NAME_MAX;
    } catch (e) {
        return /^[0-9A-Za-z .'-]+$/.test(v) && v.length > 0;
    }
}

// Clave de comparación: sin acentos, en minúsculas y con espacios juntos
export function nameKey(v) {
    const s = cleanName(v);
    try {
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    } catch (e) {
        return s.toLowerCase();
    }
}

// Id que firma las marcas: el de la cuenta si hay sesión, el del
// dispositivo si no
export function currentPlayerId() {
    return S.accSession ? S.accSession.id : loadPlayerId();
}

// Id de perfil a partir del nombre (determinista, sin acentos)
export function profileId(name) {
    return nameKey(name).replace(/[^a-z0-9._-]/g, "").slice(0, 32) || makeId();
}

// Número entero dentro de su rango (para saneado de perfiles)
export function num(v, max) {
    const n = Math.floor(Number(v));
    if (!isFinite(n) || n < 0) return 0;
    return Math.min(max, n);
}

// ---------- Integridad y criptografía ----------
// El documento del ranking es público: técnicamente CUALQUIER persona
// podría editarlo. Las huellas delatan cualquier cambio manual.
export function hash(raw) {
    let h = 5381;
    for (let i = 0; i < raw.length; i++) {
        h = (Math.imul(h, 33) ^ raw.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

// La contraseña NUNCA se guarda: solo su resumen SHA-256 calculado con
// una sal aleatoria y miles de iteraciones. El documento es público,
// así que quien lo descargue únicamente ve hashes ilegibles.
export function sha256hex(txt) {
    // 1) La cadena pasa a bytes UTF-8
    const bytes = [];
    for (let i = 0; i < txt.length; i++) {
        let c = txt.codePointAt(i);
        if (c > 0xFFFF) i++;
        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) bytes.push(0xC0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000) bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else bytes.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    // 2) Longitud en bits y relleno hasta un múltiplo de 64 bytes
    const bits = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bits / 4294967296);
    const lo = bits >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
        (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);

    // 3) Constantes y estado inicial del algoritmo
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Array(64);

    for (let off = 0; off < bytes.length; off += 64) {
        for (let i = 0; i < 16; i++) {
            const j = off + i * 4;
            w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) | 0;
        }
        for (let i = 16; i < 64; i++) {
            const a15 = w[i - 15], a2 = w[i - 2];
            const s0 = rotr(a15, 7) ^ rotr(a15, 18) ^ (a15 >>> 3);
            const s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = H[0], b = H[1], c2 = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c2) ^ (b & c2);
            const t2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0;
            d = c2; c2 = b; b = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c2) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    let out = "";
    for (let i = 0; i < 8; i++) out += (H[i] >>> 0).toString(16).padStart(8, "0");
    return out;
}

// Sal aleatoria de 16 bytes en hexadecimal
export function makeSalt() {
    let s = "";
    try {
        const buf = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(buf);
        else for (let i = 0; i < 16; i++) buf[i] = Math.floor(Math.random() * 256);
        for (let i = 0; i < 16; i++) s += buf[i].toString(16).padStart(2, "0");
    } catch (e) {
        for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
}

// Resumen de la contraseña: SHA-256 iterado con la sal (KDF casero)
export function derivePass(pass, salt) {
    let h = salt + "|" + pass;
    for (let i = 0; i < KDF_ROUNDS; i++) h = sha256hex(h);
    return h;
}

// Fórmula del KDF ANTERIOR a la v2.0 (commit a7141d4, 21/10/2026). Las
// cuentas creadas antes de esa fecha guardan su resumen con esta cadena,
// así que solo sirve para reconocerlas y migrarlas a la actual: sin ella
// esas contraseñas darían siempre «incorrecta» en cualquier equipo.
export function derivePassLegacy(pass, salt) {
    let h = salt;
    for (let i = 0; i < KDF_ROUNDS; i++) h = sha256hex(salt + "|" + i + "|" + pass + "|" + h);
    return h;
}
