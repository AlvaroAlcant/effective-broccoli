// Progresión del jugador: récords por idioma, logros con sus
// recompensas y las estadísticas acumuladas (XP, partidas, palabras).
// Las recompensas se entregan a través de la economía (desbloquear
// un efecto o un estilo ES meterlo en el inventario).
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang, t } from './i18n.js';
import { eco } from './economy.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

export class ProgressionService {
    // ---------- Récord de puntos por idioma ----------
    loadBest() {
        let v = storage.get("mejorTecleo." + uiLang());
        if (v === null && uiLang() === "es") {
            v = storage.get("mejorTecleo"); // récord antiguo
        }
        return parseInt(v || "0", 10) || 0;
    }

    saveBest() {
        storage.set("mejorTecleo." + uiLang(), String(S.best));
    }

    // ---------- Récord personal de palabras escritas ----------
    loadBestWords() {
        const v = storage.get("mejorPalabras." + uiLang());
        return parseInt(v || "0", 10) || 0;
    }

    saveBestWords() {
        storage.set("mejorPalabras." + uiLang(), String(S.bestWords));
    }

    // ---------- Estadísticas acumuladas ----------
    loadProfileStats() {
        S.xp = storage.getInt("teclear.xp", 0);
        S.gamesPlayed = storage.getInt("teclear.partidas", 0);
        S.wordsTotal = storage.getInt("teclear.palabras", 0);
    }

    saveProfileStats() {
        storage.set("teclear.xp", String(S.xp));
        storage.set("teclear.partidas", String(S.gamesPlayed));
        storage.set("teclear.palabras", String(S.wordsTotal));
    }

    // ---------- Logros: progreso, recompensas y avisos ----------
    // Cada logro lleva su propio progreso (guardado en localStorage).
    // Al completarlo se entrega su recompensa: un efecto de tecleo que
    // no está a la venta en la tienda, solo se gana jugando.
    achLoad() {
        const raw = storage.getJSON("teclear.logros", null);
        if (raw && typeof raw === "object") S.achData = raw;

        // Solo se admiten logros conocidos, con números dentro de su rango
        const limpio = {};
        ACHIEVEMENTS.forEach(a => {
            const d = S.achData[a.id] || {};
            const hecho = !!d.done;
            let p = (typeof d.p === "number" && isFinite(d.p)) ? Math.floor(d.p) : 0;
            p = Math.max(0, Math.min(a.goal, p));
            limpio[a.id] = { p: hecho ? a.goal : p, done: hecho };
        });
        S.achData = limpio;
        this.achSave();
        // Un logro completado que hubiera perdido su recompensa la recupera
        ACHIEVEMENTS.forEach(a => {
            if (S.achData[a.id].done) this.grantAchReward(a, true);
        });
    }

    // El Administrador (Alvaro) lo tiene TODO hecho: es el profe y
    // necesita poder probarlo todo sin jugarlo. Solo contando con SU
    // CUENTA ABIERTA, no por el nombre del equipo (esAdmin() da dinero
    // infinito también a quien juegue aquí sin sesión). Lo llama el
    // motor tras cargar la sesión.
    grantAllAch() {
        ACHIEVEMENTS.forEach(a => { S.achData[a.id] = { p: a.goal, done: true }; });
        this.achSave();
        ACHIEVEMENTS.forEach(a => this.grantAchReward(a, true));
    }

    achSave() {
        storage.setJSON("teclear.logros", S.achData);
    }

    // Nombre de la recompensa, en el idioma vigente
    rewardLabel(ach) {
        return uiLang() === "es" ? ach.rewardEs : ach.rewardEn;
    }

    // Números grandes con su separador de miles (1.000.000 / 1,000,000)
    fmtNum(n) {
        try {
            return Number(n).toLocaleString(uiLang() === "es" ? "es-ES" : "en-US");
        } catch (e) {
            return String(n);
        }
    }

    // Entrega la recompensa: queda desbloqueada para siempre. Un efecto
    // de tecleo sale puesto en marcha al recibirlo; un estilo de letra
    // se aplica al tablero; un fondo de pantalla solo se desbloquea
    // (para no quitarte la habilidad del fondo que lleves puesto).
    grantAchReward(ach, silent) {
        const r = ach.reward;
        if (!r) return;

        if (r.type === "fx") {
            const nuevo = !S.ownedFx.includes(r.id);
            if (nuevo) S.ownedFx.push(r.id);
            if (nuevo || !eco.ownsFx(S.fxEquipped)) {
                S.fxEquipped = r.id;
                eco.saveShop();
                eco.applyFx();
            }
        } else if (r.type === "font") {
            if (!S.owned.includes(r.id)) {
                S.owned.push(r.id);
                S.equipped = r.id;    // recién ganado: sale aplicado
                eco.saveShop();
                eco.applyStyle();
            }
        } else if (r.type === "bg") {
            if (!S.ownedBgs.includes(r.id)) {
                S.ownedBgs.push(r.id);
                eco.saveShop();
            }
        }

        if (!silent) this.showAchToast(ach);
    }

    // Aviso emergente de un logro recién desbloqueado
    showAchToast(ach) {
        const toast = document.createElement("div");
        toast.className = "ach-toast";
        toast.setAttribute("role", "status");

        const icon = document.createElement("span");
        icon.className = "ach-toast-icon";
        icon.textContent = ach.icon;

        const txt = document.createElement("span");
        txt.textContent = t("achToast") + (uiLang() === "es" ? ach.es : ach.en) +
            t("achToastEnd") + this.rewardLabel(ach);

        toast.append(icon, txt);
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5200);
    }

    // Sube el progreso de un logro y lo completa si llega a su meta
    achAdd(id, n) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        const d = S.achData[id];
        if (!ach || !d || d.done) return;
        this.achSetP(ach, d, d.p + n);
    }

    // Anota una marca (por ejemplo la mejor puntuación de una partida o
    // las palabras escritas en 8 segundos): el progreso nunca baja, solo
    // se guarda el mejor intento.
    achBest(id, p) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        const d = S.achData[id];
        if (!ach || !d || d.done) return;
        if (p <= d.p) return;
        this.achSetP(ach, d, p);
    }

    // Fija el progreso de un logro, lo guarda y lo completa si llega a su meta
    achSetP(ach, d, p) {
        d.p = Math.max(0, Math.min(ach.goal, Math.floor(p)));
        const completo = d.p >= ach.goal;
        if (completo) d.done = true;
        this.achSave();
        if (completo) this.grantAchReward(ach, false);
    }
}

export const prog = new ProgressionService();
