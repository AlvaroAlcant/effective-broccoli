// ---------- Diccionario ----------
// Cada palabra que se completa en una partida se guarda aquí para
// siempre, agrupada por la lista de la que salió. Las secciones son las
// listas DESBLOQUEADAS: al comprar un modo en la tienda (o el fondo
// Calaca) el diccionario se amplía con sus palabras. Cada palabra NUEVA
// se puede cobrar una sola vez desde el panel: DIC_COIN monedas.
// Los datos viven en S.dicData (reactivo, para que el panel se pinte
// solo) y se persisten en localStorage. Las preguntas de «¿está
// desbloqueado?» y de idioma se resuelven aquí mismo, leyendo de
// economy y de i18n.
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang } from './i18n.js';
import { eco } from './economy.js';
import { DIC_GROUPS, DIC_COIN } from '../data/dictionary.js';
import {
    WORDS, MURCIANO_WORDS, PHP_WORDS, ANDALUZ_WORDS, MINECRAFT_WORDS,
    PICANTE, HALLOWEEN_WORDS, HUESO_WORDS
} from '../data/words.js';

export class DictionaryService {
    // ---------- Persistencia ----------
    // S.dicData: { grupo: { palabra: 0|1 } } — 0 = nueva sin cobrar,
    // 1 = cobrada. Al cargar solo se admiten grupos y palabras reales.
    load() {
        const raw = storage.getJSON("teclear.diccionario", null);
        const limpio = {};
        DIC_GROUPS.forEach(g => { limpio[g.id] = {}; });
        if (raw && typeof raw === "object") {
            DIC_GROUPS.forEach(g => {
                const src = raw[g.id];
                if (!src || typeof src !== "object") return;
                for (const w in src) {
                    if (typeof w !== "string" || w.length < 2 || w.length > 40) continue;
                    limpio[g.id][w] = src[w] ? 1 : 0;
                }
            });
        }
        S.dicData = limpio;
        this.save();
    }

    save() {
        storage.setJSON("teclear.diccionario", S.dicData);
    }

    // ---------- Grupos ----------
    // ¿Este grupo del diccionario está abierto ahora mismo? (los extras
    // y los fondos se compran en la tienda y quedan para siempre)
    abierto(g) {
        if (g.always) return true;
        if (g.extra) return eco.ownsExtra(g.extra);
        if (g.bg) return eco.owns("bg", g.bg);
        return false;
    }

    // ¿A qué lista pertenece esta palabra? Se comprueba de lo más
    // específico a lo general, pero SOLO entre los grupos abiertos: si
    // no, la palabra acabaría en una sección que todavía no existe.
    grupoDe(w) {
        const grupo = id => DIC_GROUPS.find(g => g.id === id);
        const prueba = (id, dentro) => {
            const g = grupo(id);
            return (dentro && g && this.abierto(g)) ? id : null;
        };
        let r;
        r = prueba("php", PHP_WORDS.includes(w));        if (r) return r;
        r = prueba("andaluz", ANDALUZ_WORDS.includes(w)); if (r) return r;
        r = prueba("cubico", MINECRAFT_WORDS.includes(w)); if (r) return r;
        r = prueba("picante", PICANTE.es.includes(w) || PICANTE.en.includes(w)); if (r) return r;
        r = prueba("truco", HALLOWEEN_WORDS.es.includes(w) || HALLOWEEN_WORDS.en.includes(w)); if (r) return r;
        r = prueba("hueso", HUESO_WORDS.es.includes(w) || HUESO_WORDS.en.includes(w)); if (r) return r;
        r = prueba("murciano", MURCIANO_WORDS.includes(w)); if (r) return r;
        return "normal";
    }

    // Tamaño total de la lista de un grupo (para el contador x / total)
    totalDe(id) {
        if (id === "normal") return WORDS.es.length + WORDS.en.length;
        if (id === "murciano") return MURCIANO_WORDS.length;
        if (id === "php") return PHP_WORDS.length;
        if (id === "andaluz") return ANDALUZ_WORDS.length;
        if (id === "cubico") return MINECRAFT_WORDS.length;
        if (id === "picante") return PICANTE.es.length + PICANTE.en.length;
        if (id === "truco") return HALLOWEEN_WORDS.es.length + HALLOWEEN_WORDS.en.length;
        if (id === "hueso") return HUESO_WORDS.es.length + HUESO_WORDS.en.length;
        return 0;
    }

    // ---------- Palabras ----------
    // Palabra completada en la partida: se guarda si no existía. Las
    // letras sueltas del Encantado (una letra) no son palabras y no
    // entran. Devuelve true si era nueva.
    add(w) {
        if (typeof w !== "string" || w.length < 2) return false;
        const g = this.grupoDe(w);
        const tabla = S.dicData[g] || (S.dicData[g] = {});
        if (Object.prototype.hasOwnProperty.call(tabla, w)) return false;   // ya estaba
        tabla[w] = 0;                    // nueva: pendiente de cobrar
        this.save();
        return true;
    }

    // Cobra la recompensa de una palabra: solo la primera vez. Devuelve
    // las monedas entregadas (0 si ya estaba cobrada o no existía).
    claim(g, w) {
        const tabla = S.dicData[g];
        if (!tabla || !Object.prototype.hasOwnProperty.call(tabla, w)) return 0;
        if (tabla[w] !== 0) return 0;    // repetida: no da más dinero
        tabla[w] = 1;
        this.save();
        eco.giveCoins(DIC_COIN);
        return DIC_COIN;
    }

    // ---------- Panel ----------
    // Secciones del panel: solo los grupos abiertos, con sus palabras
    // ordenadas y marcando cuáles están sin cobrar
    sections() {
        const en = uiLang() === "en";
        return DIC_GROUPS.filter(g => this.abierto(g)).map(g => {
            const tabla = S.dicData[g.id] || {};
            const claves = Object.keys(tabla).sort((a, b) => a.localeCompare(b, en ? "en" : "es"));
            let nuevas = 0;
            const palabras = claves.map(w => {
                const nueva = tabla[w] === 0;
                if (nueva) nuevas++;
                return { w, nueva };
            });
            return {
                id: g.id, icono: g.icono,
                nombre: en ? g.en : g.es,
                palabras, nuevas,
                total: this.totalDe(g.id)
            };
        });
    }

    // Palabras guardadas en total y cuántas quedan por cobrar
    totalPalabras() {
        let n = 0;
        for (const g of DIC_GROUPS) {
            const tabla = S.dicData[g.id];
            if (tabla) n += Object.keys(tabla).length;
        }
        return n;
    }

    pendientes() {
        let n = 0;
        for (const g of DIC_GROUPS) {
            const tabla = S.dicData[g.id];
            if (!tabla) continue;
            for (const w in tabla) if (tabla[w] === 0) n++;
        }
        return n;
    }
}

export const dic = new DictionaryService();
