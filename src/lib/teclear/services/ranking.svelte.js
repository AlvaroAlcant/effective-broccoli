// Ranking global: dos tableros (clásicos y Aventura) con el MISMO
// formato de fila (mismas columnas, mismos límites, mismas huellas y
// Top 10). Cada tabla tiene su documento en el servidor (MantleDB), su
// copia local y su estado de conexión.
//
// El documento es público: técnicamente CUALQUIER persona podría
// editarlo. Por eso esta página solo acepta lo que supera estos
// controles, de modo que una fila manipulada se ignora y desaparece:
//   · forma correcta (tipos, longitudes y modo de juego conocido)
//   · coherencia (con esas palabras no se pueden lograr esos puntos)
//   · huella de integridad (si cambia un dato, la huella no cuadra)
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang } from './i18n.js';
import { hash, cleanName, nameKey } from './identity.js';
import {
    RANK_URL, RANK_ADV_URL, RESETS_URL, RANK_MAX,
    RANK_TIMEOUT, SEAL_SALT, NAME_MAX,
    MAX_SCORE, MAX_WORDS, PTS_PER_WORD, SCORE_BOOST, ADV_SCORE_SLACK
} from '../data/constants.js';

const RANK_TABS = ["normal", "aventura"];

const RANK_TAB_CONF = {
    normal: {
        url: RANK_URL, ls: "teclear.ranking", box: "rankTabNormal",
        list: "rankList", empty: "rankEmpty", status: "rankStatus",
        title: "rankTitle", hint: "rankHint"
    },
    aventura: {
        url: RANK_ADV_URL, ls: "teclear.ranking.aventura", box: "rankTabAventura",
        list: "rankListAdv", empty: "rankEmptyAdv", status: "rankStatusAdv",
        title: "rankTitleAdv", hint: "rankHintAdv"
    }
};

export class RankingService {
    // Estado de cada tabla: filas válidas, conexión, aviso de alteración
    rankData = $state({
        normal: { entries: [], online: false, loaded: false, tampered: false },
        aventura: { entries: [], online: false, loaded: false, tampered: false }
    });
    rankResets = null;   // id → fecha: marcas anteriores no cuentan

    rankTabOf(m) {
        return m === "aventura" ? "aventura" : "normal";
    }

    // Modo que se etiqueta en el ranking: el murciano tecleado sigue
    // registrándose como "murciano", igual que hasta ahora.
    entryMode() {
        if (S.mode === "type" && S.lang === "mur") return "murciano";
        return S.mode;
    }

    // Petición con tiempo de espera: evita que la interfaz se quede colgada
    rankFetch(url, opts) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), RANK_TIMEOUT);
        return fetch(url, Object.assign({}, opts, { signal: ctrl.signal }))
            .finally(() => clearTimeout(timer));
    }

    loadLocalRanking(tab) {
        const data = storage.getJSON(RANK_TAB_CONF[tab].ls, null);
        return (data && Array.isArray(data.entries)) ? data.entries : [];
    }

    saveLocalRanking(entries, tab) {
        storage.setJSON(RANK_TAB_CONF[tab].ls, { v: 1, entries: entries });
    }

    // Huella de una fila: se guarda junto a los datos (campo "c")
    sealOf(e) {
        return hash(SEAL_SALT + "|" + e.id + "|" + e.n + "|" + e.s + "|" + e.w + "|" + e.m + "|" + e.d);
    }

    sealList(entries) {
        return entries.map(e => ({
            id: e.id, n: e.n, s: e.s, w: e.w, m: e.m, d: e.d, c: this.sealOf(e)
        }));
    }

    // Huella del documento entero: delata que el JSON fue editado a mano
    docSeal(entries) {
        return hash(SEAL_SALT + "|doc|" + JSON.stringify(entries));
    }

    // Huella del documento de reinicios (mismo sistema, otro prefijo)
    resetsSeal(cuerpo) {
        return hash(SEAL_SALT + "|resetos|" + JSON.stringify(cuerpo));
    }

    // Devuelve la fila si es válida; null si está corrupta o manipulada
    validEntry(raw) {
        if (!raw || typeof raw !== "object") return null;
        // Tipos estrictos: nada de números ni objetos disfrazados de texto
        if (typeof raw.id !== "string" || typeof raw.n !== "string") return null;
        if (typeof raw.s !== "number" || typeof raw.w !== "number") return null;
        if (raw.m !== undefined && typeof raw.m !== "string") return null;
        if (raw.d !== undefined && typeof raw.d !== "string") return null;
        if (raw.c !== undefined && typeof raw.c !== "string") return null;
        const id = raw.id;
        if (!id || id.length > 64 || !/^[A-Za-z0-9._-]+$/.test(id)) return null;
        const n = cleanName(raw.n) || "Anónimo";
        const s = Math.floor(raw.s);
        const w = Math.floor(raw.w);
        if (!isFinite(s) || !isFinite(w)) return null;
        if (s <= 0 || w <= 0) return null;
        if (s > MAX_SCORE || w > MAX_WORDS) return null;
        const m = String(raw.m || "type");
        if (["type", "guess", "murciano", "imagen", "aventura", "supervivencia"].indexOf(m) < 0) return null;
        const d = String(raw.d || "");
        if (d && (d.length > 30 || isNaN(new Date(d).getTime()))) return null;
        // Coherencia puntos ↔ palabras: imposible de lograr jugando.
        // Se admite el máximo con la habilidad de la partida más ventajosa
        // (el fondo Ia triplica los puntos de las palabras largas).
        // En el modo Aventura la ventaja "puntos x2" sube ese techo.
        const margen = m === "aventura" ? ADV_SCORE_SLACK : 2000;
        if (s > w * PTS_PER_WORD * SCORE_BOOST + margen) return null;
        // Huella de integridad (las filas antiguas, sin huella, se aceptan)
        if (raw.c !== undefined && String(raw.c) !== this.sealOf({ id: id, n: n, s: s, w: w, m: m, d: d })) {
            return null;
        }
        return { id: id, n: n, s: s, w: w, m: m, d: d };
    }

    // Limpia los datos, se queda con la MEJOR marca de cada jugador,
    // ordena de mayor a menor puntuación y recorta a las RANK_MAX primeras.
    // "resets" contiene las puntuaciones reiniciadas: cualquier marca de ese
    // jugador anterior a la fecha del reinicio se ignora (aunque esté guardada
    // en la copia local de su equipo).
    // "tab" separa los dos rankings: la tabla "normal" ignora las marcas de
    // Aventura (que son mucho más altas) y la de Aventura solo las suyas,
    // así cada tablero lleva sus propias partidas.
    normalizeRank(list, resets, tab) {
        const cortes = resets || this.rankResets || {};
        const soloAventura = tab === "aventura";
        const byId = {};
        (Array.isArray(list) ? list : []).forEach(raw => {
            const e = this.validEntry(raw);
            if (!e) return;                    // fila manipulada o corrupta
            if (soloAventura !== (e.m === "aventura")) return;   // otra tabla
            const lim = cortes[e.id] !== undefined ? cortes[e.id] : cortes["*"];
            if (lim) {
                const dd = e.d ? new Date(e.d).getTime() : NaN;
                if (!(dd > new Date(lim).getTime())) return;   // marca antigua
            }
            const prev = byId[e.id];
            if (!prev || e.s > prev.s || (e.s === prev.s && e.d > prev.d)) {
                byId[e.id] = e;
            } else if (e.d > prev.d) {
                prev.n = e.n;                  // el nombre más reciente manda
            }
        });
        return Object.values(byId)
            .sort((a, b) => b.s - a.s || b.w - a.w || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0))
            .slice(0, RANK_MAX);
    }

    fetchRanking(tab) {
        return this.rankFetch(RANK_TAB_CONF[tab].url, { method: "GET" }).then(res => {
            if (!res.ok) {
                const err = new Error("HTTP " + res.status);
                // 404 → el documento aún no existe: se puede recrear.
                // Cualquier otro fallo (429, 500, 503…) NO significa "vacío":
                // tratarlo como vacío borraría el ranking de todos, así que
                // simplemente se propaga y se reintenta sin subir nada.
                err.notFound = (res.status === 404);
                throw err;
            }
            return res.json();
        }).then(data => {
            const entries = (data && Array.isArray(data.entries)) ? data.entries : [];
            // Comprueba la huella del documento: si no cuadra, alguien lo editó
            this.rankData[tab].tampered = !!(data && data.c !== undefined &&
                String(data.c) !== this.docSeal(entries));
            if (data && data.c === undefined) this.rankData[tab].tampered = true; // aún sin sellar
            return entries;
        });
    }

    pushRanking(entries, tab) {
        const clean = this.sealList(entries);        // se sellan las filas al subir
        const body = { v: 1, entries: clean, c: this.docSeal(clean) };
        return this.rankFetch(RANK_TAB_CONF[tab].url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
        });
    }

    // ---------- Puntuaciones reiniciadas ----------
    // Documento aparte y de SOLO LECTURA para la página: contiene los
    // jugadores cuya marca se ha reiniciado. Como ningún juego escribe aquí,
    // no hay forma de que se borre desde la propia página.
    sanitizeResets(data) {
        const src = (data && typeof data === "object" && data.r && typeof data.r === "object")
            ? data.r : {};
        const out = {};
        let n = 0;
        Object.keys(src).forEach(id => {
            if (n >= 200) return;
            if (!id || id.length > 64 || !/^[A-Za-z0-9._*-]+$/.test(id)) return;
            const d = String(src[id] || "");
            if (!d || d.length > 30 || isNaN(new Date(d).getTime())) return;
            out[id] = d;
            n++;
        });
        return out;
    }

    fetchResets(force) {
        if (force) this.rankResets = null;
        if (this.rankResets) return Promise.resolve(this.rankResets);
        return this.rankFetch(RESETS_URL, { method: "GET" })
            .then(res => {
                if (!res.ok) { this.rankResets = {}; return {}; }  // sin documento
                return res.json();
            })
            .then(data => {
                // Sello del documento: si alguien lo editó a mano, no aplica
                const cuerpo = (data && data.r && typeof data.r === "object") ? data.r : {};
                if (data && data.c !== undefined && String(data.c) !== this.resetsSeal(cuerpo)) {
                    return this.rankResets || {};
                }
                if (!this.rankResets) this.rankResets = this.sanitizeResets(data);
                return this.rankResets;
            })
            .catch(() => (this.rankResets || {}));  // sin conexión: se vuelve a probar
    }

    // Descarga el ranking de la web y lo mezcla con la copia local.
    // Sin argumento se refrescan las dos tablas (global y Aventura).
    refreshRanking(tab) {
        const tabs = tab ? [tab] : RANK_TABS;
        return Promise.all(tabs.map(t2 => this.refreshRankTab(t2)));
    }

    refreshRankTab(tab) {
        const data = this.rankData[tab];
        const local = this.loadLocalRanking(tab);
        return this.fetchResets().then(() => this.fetchRanking(tab))
            .then(remote => {
                data.online = true;
                data.entries = this.normalizeRank(remote.concat(local), null, tab);
                this.saveLocalRanking(data.entries, tab);  // purga marcas reiniciadas
            })
            .catch(() => {
                data.online = false;
                data.entries = this.normalizeRank(local, null, tab);
                this.saveLocalRanking(data.entries, tab);
            })
            .then(() => {
                data.loaded = true;
            });
    }

    // Sube la puntuación al ranking de todos los jugadores.
    // Primero se guarda en local (nunca se pierde) y luego se reintenta la subida.
    // La tabla es la de su modo: una marca de Aventura jamás entra en el
    // ranking global ni al revés.
    uploadScore(entry) {
        const tab = this.rankTabOf(entry.m);
        const data = this.rankData[tab];
        data.online = false;
        data.loaded = true;

        const attempt = (triesLeft, fusiones) => {
            const rep = fusiones || 0;
            return this.fetchRanking(tab)
                .catch(err => {
                    // Solo el 404 ("todavía no hay documento") permite
                    // recrearlo con lo local. Un error de red o del servidor
                    // NO: en ese caso se propaga y no se sube nada todavía,
                    // para no borrar las marcas de los demás jugadores.
                    if (err && err.notFound) return [];
                    throw err;
                })
                .then(remote => {
                    const base = this.normalizeRank(remote, null, tab);
                    const merged = this.normalizeRank(
                        remote.concat(this.loadLocalRanking(tab), [entry]), null, tab);
                    // Red de seguridad: la subida nunca puede perder marcas
                    // que sí estaban en el servidor (si no caben en el top
                    // 10, merged.length ya es RANK_MAX y no se cumple esto).
                    if (base.length > merged.length && merged.length < RANK_MAX) {
                        throw new Error("merge-unsafe");
                    }
                    return this.pushRanking(merged, tab).then(() => {
                        data.entries = merged;
                        this.saveLocalRanking(merged, tab);
                        data.online = true;
                        // Si alguien subió a la vez y alguna marca del
                        // servidor ha desaparecido, se vuelve a fusionar.
                        if (rep >= 2) return undefined;
                        return this.fetchRanking(tab)
                            .then(r2 => {
                                const aqui = this.normalizeRank(
                                    Array.isArray(r2) ? r2 : [], null, tab);
                                const perdidas = base.filter(b =>
                                    !aqui.some(x => x.id === b.id));
                                if (perdidas.length) return attempt(2, rep + 1);
                            })
                            .catch(() => undefined);
                    });
                })
                .catch(() => {
                    if (triesLeft > 0) {
                        return new Promise(r => setTimeout(r, 600))
                            .then(() => attempt(triesLeft - 1));
                    }
                    data.online = false;
                });
        };

        return this.fetchResets().then(() => {
            data.entries = this.normalizeRank(
                this.loadLocalRanking(tab).concat([entry]), null, tab);
            this.saveLocalRanking(data.entries, tab);   // purga las marcas reiniciadas
            return attempt(2);
        });
    }

    rankDate(iso) {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        try {
            return d.toLocaleDateString(uiLang() === "es" ? "es-ES" : "en-GB");
        } catch (e) {
            return d.toLocaleDateString();
        }
    }
}

export const ranking = new RankingService();
