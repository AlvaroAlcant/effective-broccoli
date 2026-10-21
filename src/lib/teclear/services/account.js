// Cuentas de jugador: registro e inicio de sesión con perfiles en la
// nube (MantleDB), nombres reservados, sesión local, verificación
// humana antes de guardar y detección de escritura automática.
// La contraseña NUNCA se guarda: solo su resumen SHA-256 calculado con
// una sal aleatoria y miles de iteraciones. Los documentos son públicos,
// así que quien los descargue únicamente ve hashes ilegibles.
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang, t } from './i18n.js';
import * as identity from './identity.js';
import { ranking } from './ranking.svelte.js';
import { eco } from './economy.js';
import { prog } from './progression.js';
import {
    NAMES_URL, PROFILES_URL, NAMES_MAX, SEAL_SALT, NAME_MAX, PASS_MIN,
    MAX_SCORE, MAX_WORDS, PTS_PER_WORD, SCORE_BOOST, ADV_SCORE_SLACK,
    GAME_TIME, BONUS_TIME_ELPRICO
} from '../data/constants.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

// ---------- Roles de usuario ----------
// Rol de ADMINISTRADOR: acceso al panel de depuración visual y a las
// pruebas de eventos. El rol se reconoce por el nombre de la cuenta o
// por el nombre del jugador, normalizados con nameKey() (sin acentos y
// en minúsculas), así que «Alvaro», «ÁLVARO» o «alvaro» valen igual.
const ADMIN_NAMES = ["alvaro", "joshmiquel"];

// Código aleatorio de 4 caracteres que hay que escribir con teclas REALES
const VERIFY_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export class AccountService {
    // Elementos del panel (se inyectan al montar)
    perfil = null;
    accName = null;
    accPass = null;
    accPass2 = null;
    verifyInput = null;

    // Dependencias del juego (se inyectan con bind)
    applyLang = () => {};
    saveScore = () => {};
    getHits = () => 0;
    getGameDuration = () => 0;
    getAdvTimeGained = () => 0;

    // Telemetría de la partida: sirve para detectar escritura automática
    keyStamps = [];        // instante de cada tecla real pulsada
    inputEvents = 0;       // eventos "input" recibidos durante la partida
    trustedInput = 0;      // ... de ellos, llegados del teclado de verdad
    trustedKeys = 0;       // teclas reales (isTrusted) durante la partida
    pasteTried = 0;        // intentos de pegar texto en plena partida
    verifyTyped = "";      // lo tecleado con teclas REALES (no se puede rellenar a mano)

    bind({ perfil, accName, accPass, accPass2, verifyInput,
           applyLang, saveScore, getHits, getGameDuration, getAdvTimeGained }) {
        this.perfil = perfil;
        this.accName = accName;
        this.accPass = accPass;
        this.accPass2 = accPass2;
        this.verifyInput = verifyInput;
        if (applyLang) this.applyLang = applyLang;
        if (saveScore) this.saveScore = saveScore;
        if (getHits) this.getHits = getHits;
        if (getGameDuration) this.getGameDuration = getGameDuration;
        if (getAdvTimeGained) this.getAdvTimeGained = getAdvTimeGained;
    }

    // Reinicia la telemetría al empezar una partida
    resetTelemetry() {
        this.keyStamps = [];
        this.inputEvents = 0;
        this.trustedInput = 0;
        this.trustedKeys = 0;
        this.pasteTried = 0;
    }

    // ---------- Nombres reservados (uno por jugador) ----------
    // Documento aparte con la lista de nombres ya usados: nadie puede
    // repetir el nombre de otro jugador.
    loadLocalNames() {
        const data = storage.getJSON("teclear.nombres", null);
        return (data && Array.isArray(data.used)) ? data.used : [];
    }

    saveLocalNames(list) {
        storage.setJSON("teclear.nombres", { v: 1, used: list });
    }

    normalizeNames(list) {
        const byKey = {};
        (Array.isArray(list) ? list : []).forEach(raw => {
            if (!raw || typeof raw !== "object") return;
            const n = identity.cleanName(raw.n);
            const id = String(raw.id || "");
            const d = String(raw.d || "");
            if (!n || !id || id.length > 64 || !/^[A-Za-z0-9._-]+$/.test(id)) return;
            const k = identity.nameKey(n);
            if (!k) return;
            const prev = byKey[k];
            // Manda el registro más reciente; a igual fecha, el primero (remoto)
            if (!prev || d > prev.d) byKey[k] = { n: n, id: id, d: d };
        });
        return Object.keys(byKey)
            .map(k => byKey[k])
            .sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0))
            .slice(0, NAMES_MAX);
    }

    nameOwner(list, name) {
        const k = identity.nameKey(name);
        for (let i = 0; i < list.length; i++) {
            if (identity.nameKey(list[i].n) === k) return list[i].id;
        }
        return "";
    }

    fetchNames() {
        return ranking.rankFetch(NAMES_URL, { method: "GET" }).then(res => {
            if (!res.ok) {
                const err = new Error("HTTP " + res.status);
                // Solo el 404 permite recrear el documento; un error de red
                // o del servidor nunca debe interpretarse como lista vacía.
                err.notFound = (res.status === 404);
                throw err;
            }
            return res.json();
        }).then(data => (data && Array.isArray(data.used)) ? data.used : []);
    }

    pushNames(list) {
        return ranking.rankFetch(NAMES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ v: 1, used: list })
        }).then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
        });
    }

    // Reserva el nombre para este jugador: lo comprueba en la lista global,
    // lo registra y vuelve a comprobar por si otro jugador llegó antes.
    reserveName(name, myId) {
        const record = { n: name, id: myId, d: new Date().toISOString() };

        const finish = (remote, localOnly) => {
            const merged = this.normalizeNames(remote.concat(local));
            const owner = this.nameOwner(merged, name);
            if (owner && owner !== myId) return { taken: true };   // ya usado
            const next = this.normalizeNames(merged.concat([record]));
            this.saveLocalNames(next);
            if (localOnly) return { taken: false, local: true };
            return this.pushNames(next)
                .then(() => this.fetchNames())                    // se re-comprueba
                .then(fresh => ({
                    taken: this.nameOwner(this.normalizeNames(fresh), name) === myId ? false : true
                }))
                .catch(() => ({ taken: false, local: true }));
        };

        const local = this.loadLocalNames();
        return this.fetchNames()
            .catch(err => {
                // Sin documento todavía: se recrea con lo local
                if (err && err.notFound) return [];
                throw err;
            })
            .then(remote => finish(remote, false))
            .catch(() => finish([], true));   // sin conexión: solo comprobación local
    }

    // ---------- Perfiles de usuario ----------
    // Datos admisibles de un perfil: tipos correctos y valores dentro de
    // límites imposibles de superar jugando. Todo lo demás se descarta.
    cleanProfileData(raw) {
        const r = (raw && typeof raw === "object") ? raw : {};
        const rec = obj => ({
            es: identity.num(obj && obj.es, MAX_SCORE),
            en: identity.num(obj && obj.en, MAX_SCORE)
        });
        const recW = obj => ({
            es: identity.num(obj && obj.es, MAX_WORDS),
            en: identity.num(obj && obj.en, MAX_WORDS)
        });
        const list = (v, ids) => (Array.isArray(v)
            ? v.filter(x => typeof x === "string" && ids.indexOf(x) >= 0).slice(0, 30) : []);

        // Las listas son las COMPUESTAS (catálogo + items de evento):
        // sin ellas, un «Truco o trato» comprado desaparecería al
        // sincronizar el perfil fuera de temporada
        const st = list(r.owned, eco.all("font").map(s => s.id));
        if (st.indexOf("clasico") < 0) st.push("clasico");
        const bgs = list(r.bgs, eco.all("bg").map(b => b.id));
        if (bgs.indexOf("dark") < 0) bgs.push("dark");
        const exs = list(r.extras, eco.all("extra").map(x => x.id));
        const fxs = list(r.fxs, eco.all("fx").map(f => f.id));
        const eq = (typeof r.equipped === "string" && st.indexOf(r.equipped) >= 0) ? r.equipped : "clasico";
        const bg = (typeof r.bg === "string" && bgs.indexOf(r.bg) >= 0) ? r.bg : "dark";
        const fxEq = (typeof r.fx === "string" && fxs.indexOf(r.fx) >= 0) ? r.fx : "";
        const on = {};
        eco.all("extra").forEach(x => { on[x.id] = !!(r.extraOn && r.extraOn[x.id]) && exs.indexOf(x.id) >= 0; });

        return {
            coins: identity.num(r.coins, 10000000),
            xp: identity.num(r.xp, 1000000000),
            games: identity.num(r.games, 1000000),
            words: identity.num(r.words, 100000000),
            owned: st, equipped: eq,
            bgs: bgs, bg: bg,
            extras: exs, extraOn: on,
            fxs: fxs, fx: fxEq,
            best: rec(r.best),
            bestWords: recW(r.bestWords)
        };
    }

    // Marca del documento de perfiles: delata ediciones hechas a mano
    profilesSeal(users) {
        return identity.hash(SEAL_SALT + "|perfiles|" + JSON.stringify(users));
    }

    validProfile(raw) {
        if (!raw || typeof raw !== "object") return null;
        if (typeof raw.id !== "string" || typeof raw.n !== "string") return null;
        if (typeof raw.salt !== "string" || typeof raw.hash !== "string") return null;
        if (!/^[A-Za-z0-9._-]{1,64}$/.test(raw.id)) return null;
        const n = identity.cleanName(raw.n);
        if (!n || !identity.nameOk(n)) return null;
        if (!/^[0-9a-f]{16,128}$/.test(raw.salt)) return null;
        if (!/^[0-9a-f]{32,128}$/.test(raw.hash)) return null;
        const d = String(raw.d || "");
        if (d && (d.length > 30 || isNaN(new Date(d).getTime()))) return null;
        const last = String(raw.last || "");
        if (last && (last.length > 30 || isNaN(new Date(last).getTime()))) return null;
        return {
            id: raw.id, n: n, salt: raw.salt, hash: raw.hash,
            d: d, last: last, data: this.cleanProfileData(raw.data)
        };
    }

    loadProfilesLocal() {
        try {
            const doc = storage.getJSON("teclear.perfiles", null);
            if (!doc || !Array.isArray(doc.users)) return [];
            return doc.users.map(u => this.validProfile(u)).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    saveProfilesLocal(users) {
        try {
            const clean = users.map(u => this.validProfile(u)).filter(Boolean);
            storage.setJSON("teclear.perfiles", { v: 1, users: clean, c: this.profilesSeal(clean) });
            return clean;
        } catch (e) {
            return [];
        }
    }

    findProfile(users, name) {
        const k = identity.nameKey(name);
        for (let i = 0; i < users.length; i++) {
            if (identity.nameKey(users[i].n) === k) return users[i];
        }
        return null;
    }

    upsertProfile(users, rec) {
        const next = users.slice();
        let i = -1;
        for (let j = 0; j < next.length; j++) if (next[j].id === rec.id) i = j;
        if (i >= 0) next[i] = rec; else next.push(rec);
        return this.saveProfilesLocal(next);
    }

    fetchProfiles() {
        return ranking.rankFetch(PROFILES_URL, { method: "GET" }).then(res => {
            if (!res.ok) {
                const err = new Error("HTTP " + res.status);
                err.notFound = (res.status === 404);   // documento aún no creado
                throw err;
            }
            return res.json();
        }).then(data => {
            const users = (data && Array.isArray(data.users))
                ? data.users.map(u => this.validProfile(u)).filter(Boolean) : [];
            if (!data || data.c === undefined || String(data.c) !== this.profilesSeal(data.users || [])) {
                const err = new Error("sello");
                err.tampered = true;   // alguien editó el JSON a mano
                throw err;
            }
            return users;
        });
    }

    pushProfiles(users) {
        const clean = users.map(u => this.validProfile(u)).filter(Boolean);
        const body = { v: 1, users: clean, c: this.profilesSeal(clean) };
        return ranking.rankFetch(PROFILES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
        });
    }

    // Lee la nube; si falla (o el documento está alterado) se usa la copia
    // local de este dispositivo para poder seguir trabajando.
    profilesStage() {
        return this.fetchProfiles()
            .catch(err => {
                if (err && err.notFound) return [];   // aún no existe: se crea
                throw err;
            })
            .then(users => ({ users: users, offline: false }))
            .catch(err => ({
                users: this.loadProfilesLocal(),
                offline: true,
                tampered: !!(err && err.tampered)
            }));
    }

    // ---------- Datos que se guardan en la cuenta ----------
    readRec(key) {
        try {
            let v = storage.get(key);
            if (v === null && key === "mejorTecleo.es") v = storage.get("mejorTecleo");
            return parseInt(v || "0", 10) || 0;
        } catch (e) {
            return 0;
        }
    }

    snapshotData() {
        return this.cleanProfileData({
            coins: S.coins, xp: S.xp, games: S.gamesPlayed, words: S.wordsTotal,
            owned: S.owned, equipped: S.equipped,
            bgs: S.ownedBgs, bg: S.bg,
            extras: S.ownedExtras, extraOn: S.extraOn,
            fxs: S.ownedFx, fx: S.fxEquipped,
            best: { es: this.readRec("mejorTecleo.es"), en: this.readRec("mejorTecleo.en") },
            bestWords: { es: this.readRec("mejorPalabras.es"), en: this.readRec("mejorPalabras.en") }
        });
    }

    // Carga en el juego lo que trae la cuenta (monedas, estilos, récords…)
    applyData(raw) {
        const d = this.cleanProfileData(raw);
        S.coins = d.coins;
        S.xp = d.xp;
        S.gamesPlayed = d.games;
        S.wordsTotal = d.words;
        S.owned = d.owned;
        S.equipped = d.equipped;
        S.ownedBgs = d.bgs;
        S.bg = d.bg;
        S.ownedExtras = d.extras;
        S.extraOn = d.extraOn;
        S.ownedFx = d.fxs;
        S.fxEquipped = d.fx;
        storage.set("mejorTecleo.es", String(d.best.es));
        storage.set("mejorTecleo.en", String(d.best.en));
        storage.set("mejorPalabras.es", String(d.bestWords.es));
        storage.set("mejorPalabras.en", String(d.bestWords.en));
        storage.set("teclear.fondo", S.bg);
        eco.saveShop();
        prog.saveProfileStats();
        eco.applyStyle();
        eco.applyFx();
        this.applyLang();
        // Los logros completados siguen mandando su recompensa: si la
        // cuenta trae estilos o fondos sin los ganados jugando, se
        // vuelven a poner en su sitio
        ACHIEVEMENTS.forEach(a => {
            if (S.achData[a.id] && S.achData[a.id].done) prog.grantAchReward(a, true);
        });
    }

    // ---------- Sesión ----------
    loadSession() {
        try {
            const s = storage.getJSON("teclear.sesion", null);
            if (s && typeof s.id === "string" && typeof s.n === "string" && identity.nameOk(s.n)) {
                return { id: s.id, n: identity.cleanName(s.n) };
            }
        } catch (e) { /* sin almacenamiento disponible */ }
        return null;
    }

    saveSession(s) {
        try {
            if (s) storage.setJSON("teclear.sesion", s);
            else storage.remove("teclear.sesion");
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    // Guarda los datos actuales en la cuenta: siempre en local y, si hay
    // conexión, se suben a la nube. Se llama al terminar cada partida.
    saveProfile() {
        if (!S.accSession) return Promise.resolve({ saved: false, local: false });
        const data = this.snapshotData();
        const local = this.loadProfilesLocal();
        let i = -1;
        for (let j = 0; j < local.length; j++) if (local[j].id === S.accSession.id) i = j;
        if (i < 0) return Promise.resolve({ saved: false, local: false });

        const me = Object.assign({}, local[i], { data: data, last: new Date().toISOString() });
        this.saveProfilesLocal(this.upsertProfile(local, me));

        return this.fetchProfiles()
            .catch(err => {
                if (err && err.notFound) return [];
                throw err;
            })
            .then(remote => this.pushProfiles(this.upsertProfile(remote, me)))
            .then(() => ({ saved: true, local: false }))
            .catch(() => ({ saved: false, local: true }));
    }

    // ---------- Roles ----------
    esAdmin() {
        if (S.accSession && ADMIN_NAMES.indexOf(identity.nameKey(S.accSession.n)) >= 0) return true;
        return ADMIN_NAMES.indexOf(identity.nameKey(identity.loadPlayerName())) >= 0;
    }

    // ¿La CUENTA abierta es la del Administrador? A diferencia de
    // esAdmin() —que también vale por el nombre de este equipo y por eso
    // da dinero infinito—, los logros completados de regalo solo se
    // desbloquean teniendo la sesión abierta: quien juegue sin cuenta se
    // gana los suyos jugando, como cualquier alumno.
    esAdminSesion() {
        return !!(S.accSession && ADMIN_NAMES.indexOf(identity.nameKey(S.accSession.n)) >= 0);
    }

    // ---------- Panel de cuenta ----------
    // (El panel se dibuja solo leyendo G: aquí solo queda su lógica)
    setAccMsg(key, warn) {
        S.accMsgTxt = key ? t(key) : "";
        S.accMsgWarn = !!warn;
    }

    openAccount(mode) {
        if (S.state === "playing") return;
        if (mode && mode !== S.accMode) {
            S.accMode = mode;
            if (this.accPass2) this.accPass2.value = "";
            this.setAccMsg("", false);
        }
        S.accOpen = true;
        if (this.perfil && this.perfil.scrollIntoView)
            this.perfil.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    closeAccount() {
        S.accOpen = false;
    }

    toggleAccount(mode) {
        if (S.state === "playing") return;
        if (S.accOpen && (!mode || mode === S.accMode)) this.closeAccount();
        else this.openAccount(mode);
    }

    closeAccountOnPlay() {
        if (S.accOpen) this.closeAccount();
    }

    // Cambia entre registro y entrada dentro del panel de perfil
    accSwitchMode() {
        S.accMode = S.accMode === "reg" ? "login" : "reg";
        if (this.accPass2) this.accPass2.value = "";
        this.setAccMsg("", false);
    }

    // «Guardar ahora»: sube el progreso a la nube estando ya dentro
    accSaveProfile() {
        if (!S.accSession) { this.setAccMsg("accNoSession", true); return; }
        this.setAccMsg("accSaving", false);
        this.saveProfile().then(res2 => {
            this.setAccMsg(res2.saved ? "accSaved" : (res2.local ? "accSavedLocal" : "accNoSession"),
                !res2.saved && !res2.local);
        });
    }

    // ---------- Registrar / entrar / salir ----------
    finishAccount(res) {
        S.accBusy = false;
        return res;
    }

    accountFail(key) {
        this.finishAccount({ ok: false, key: key });
        this.setAccMsg(key, true);
        return { ok: false, key: key };
    }

    doRegister(name, pass, pass2) {
        if (S.accBusy) return Promise.resolve({ ok: false, key: "accExists" });
        if (!name || !identity.nameOk(name)) return Promise.resolve(this.accountFail("accNameBad"));
        if ((pass || "").length < PASS_MIN) return Promise.resolve(this.accountFail("accPassShort"));
        if (pass !== pass2) return Promise.resolve(this.accountFail("accPassDiff"));

        S.accBusy = true;
        this.setAccMsg("accSaving", false);

        const id = identity.profileId(name);
        const salt = identity.makeSalt();
        const hash = identity.derivePass(pass, salt);
        const record = {
            id: id, n: name, salt: salt, hash: hash,
            d: new Date().toISOString(), last: "", data: this.snapshotData()
        };

        return this.profilesStage().then(stage => {
            if (this.findProfile(stage.users, name)) throw { key: "accExists" };
            if (this.findProfile(this.loadProfilesLocal(), name)) throw { key: "accExists" };
            // El nombre también se reserva para el ranking: así tu puntuación
            // y tu cuenta comparten el mismo nombre y el mismo identificador.
            return this.reserveName(name, id).then(res => {
                if (res && res.taken) throw { key: "accExists" };
                if (stage.offline) {
                    this.saveProfilesLocal(this.upsertProfile(this.loadProfilesLocal(), record));
                    throw { key: "accSavedLocal", ok: true };
                }
                const next = this.upsertProfile(stage.users, record);
                return this.pushProfiles(next).then(() => next)
                    .catch(() => {
                        this.saveProfilesLocal(this.upsertProfile(this.loadProfilesLocal(), record));
                        throw { key: "accSavedLocal", ok: true };
                    });
            });
        }).then(() => {
            this.saveProfilesLocal(this.upsertProfile(this.loadProfilesLocal(), record));
            S.accSession = { id: id, n: name };
            this.saveSession(S.accSession);
            identity.savePlayerName(name);
            if (this.accPass) this.accPass.value = "";
            if (this.accPass2) this.accPass2.value = "";
            this.finishAccount({ ok: true, key: "accCreated" });
            this.setAccMsg("accCreated", false);
            ranking.refreshRanking();
            return { ok: true, key: "accCreated" };
        }).catch(err => {
            if (err && err.ok) {   // cuenta creada solo en este dispositivo
                S.accSession = { id: id, n: name };
                this.saveSession(S.accSession);
                identity.savePlayerName(name);
                if (this.accPass) this.accPass.value = "";
                if (this.accPass2) this.accPass2.value = "";
                this.finishAccount({ ok: true, key: err.key });
                this.setAccMsg(err.key, false);
                ranking.refreshRanking();
                return { ok: true, key: err.key };
            }
            return this.accountFail(err && err.key ? err.key : "accExists");
        });
    }

    doLogin(name, pass) {
        if (S.accBusy) return Promise.resolve({ ok: false, key: "accNoUser" });
        if (!name || !identity.nameOk(name)) return Promise.resolve(this.accountFail("accNameBad"));
        if (!pass) return Promise.resolve(this.accountFail("accPassShort"));

        S.accBusy = true;
        this.setAccMsg("accSaving", false);

        return this.profilesStage().then(stage => {
            const u = this.findProfile(stage.users, name);
            if (!u) throw { key: "accNoUser", offline: stage.offline };
            if (identity.derivePass(pass, u.salt) !== u.hash) throw { key: "accBadPass" };
            // Se queda la copia local de esta cuenta para poder entrar sin internet
            this.saveProfilesLocal(this.upsertProfile(stage.users, u));
            S.accSession = { id: u.id, n: u.n };
            this.saveSession(S.accSession);
            identity.savePlayerName(u.n);
            this.applyData(u.data);
            if (this.accPass) this.accPass.value = "";
            if (this.accPass2) this.accPass2.value = "";
            this.finishAccount({ ok: true, key: "accLoggedIn" });
            this.setAccMsg("accLoggedIn", false);
            ranking.refreshRanking();
            return { ok: true, key: "accLoggedIn", name: u.n };
        }).catch(err => {
            if (err && err.ok) return err;
            return this.accountFail(err && err.key ? err.key : "accNoUser");
        });
    }

    doLogout() {
        if (S.accBusy) return Promise.resolve({ ok: false });
        // Antes de salir se guardan los datos conseguidos hasta ahora
        return this.saveProfile().then(() => {
            S.accSession = null;
            this.saveSession(null);
            this.setAccMsg("accLoggedOut", false);
            ranking.refreshRanking();
            return { ok: true, key: "accLoggedOut" };
        });
    }

    submitAccount() {
        const name = identity.cleanName(this.accName ? this.accName.value : "");
        const pass = this.accPass ? this.accPass.value : "";
        if (S.accMode === "reg") {
            this.doRegister(name, pass, this.accPass2 ? this.accPass2.value : "");
        } else {
            this.doLogin(name, pass);
        }
    }

    // ---------- Verificación humana antes de guardar ----------
    // Código aleatorio de 4 caracteres que hay que escribir con teclas REALES.
    // La comprobación no mira el texto del campo (eso lo rellena un script en
    // un pistoletazo), sino las pulsaciones que han ido quedando registradas:
    // pegar el texto o rellenarlo con eventos sintéticos no sirve de nada.
    newVerifyCode() {
        let s = "";
        try {
            const buf = new Uint32Array(4);
            if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(buf);
            } else {
                for (let i = 0; i < 4; i++) buf[i] = Math.floor(Math.random() * 0xffffffff);
            }
            for (let i = 0; i < 4; i++) s += VERIFY_CHARS[buf[i] % VERIFY_CHARS.length];
        } catch (e) {
            for (let i = 0; i < 4; i++) s += VERIFY_CHARS[Math.floor(Math.random() * VERIFY_CHARS.length)];
        }
        S.verifyCode = s;
        this.verifyTyped = "";
        if (this.verifyInput) this.verifyInput.value = "";
    }

    verifyHuman() {
        if (!S.verifyCode) return false;
        return this.verifyTyped.trim().toLowerCase() === S.verifyCode.toLowerCase();
    }

    // Los eventos del campo de verificación llegan por la vista (G.a.verify*):
    // solo cuentan las teclas REALES — ni pegar ni rellenar por script valen
    verifyKey(e) {
        if (e.isTrusted && typeof e.key === "string") {
            if (e.key === "Backspace") this.verifyTyped = this.verifyTyped.slice(0, -1);
            else if (e.key.length === 1 && this.verifyTyped.length < 8) this.verifyTyped += e.key;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            this.saveScore();
        }
    }

    // Teclados virtuales (móvil): a veces no informan de la tecla pulsada
    // pero sí del texto que ha escrito la persona. Manda el valor real
    // del campo, que solo puede llenarse tecleando (pegar está bloqueado).
    verifyInputText(e) {
        if (e && e.isTrusted) {
            this.verifyTyped = String(this.verifyInput.value || "").slice(0, 8);
        }
    }

    // Pegar el código tampoco vale: hay que teclearlo
    verifyPaste(e) {
        e.preventDefault();
        S.rankMsgOff = true;
        S.rankMsgTxt = t("rankHuman");
    }

    // ---------- Control de escritura automática ----------
    // ¿Se está ejecutando en un navegador automatizado (Selenium, Puppeteer,
    // Playwright, headless, PhantomJS…)? Si es así, no se sube nada.
    automationSpotted() {
        try {
            if (navigator.webdriver === true) return true;
            if (/HeadlessChrome/.test(navigator.userAgent || "")) return true;
            const marcas = [
                "__webdriver_evaluate", "__driver_evaluate", "__selenium_evaluate",
                "__webdriver_unwrapped", "__driver_unwrapped", "__selenium_unwrapped",
                "__driver_func", "_phantom", "__nightmare", "callPhantom",
                "__playwright", "__pw_manual", "__lastWatir",
                "$cdc_asdjflasutopfhvcZLmcfl_", "domAutomation", "domAutomationController"
            ];
            for (let i = 0; i < marcas.length; i++) {
                if (window[marcas[i]] !== undefined) return true;
            }
            if (document["$cdc_asdjflasutopfhvcZLmcfl_"] !== undefined) return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    // Se registran las teclas reales de la partida. Un programa que escriba
    // solo deja pistas: ninguna tecla pulsada, eventos sintéticos (isTrusted),
    // ritmo imposible o puntuaciones que no corresponden a lo tecleado.
    // Acepta un estado alternativo para poder comprobar la lógica en los tests.
    checkAutoPlay(estado) {
        const val = (v, def) => (typeof v === "number" && isFinite(v)) ? v : def;
        const es = estado || {};
        const sc = val(es.score, S.score);
        const cp = val(es.completed, S.completed);
        const ht = val(es.hits, this.getHits());
        const ie = val(es.inputEvents, this.inputEvents);
        const ti = val(es.trustedInput, this.trustedInput);
        const tk = val(es.trustedKeys, this.trustedKeys);
        const pt = val(es.pasteTried, this.pasteTried);
        const du = val(es.duracion, this.getGameDuration());
        const ks = Array.isArray(es.keyStamps) ? es.keyStamps : this.keyStamps;
        const auto = (typeof es.automatizado === "boolean")
            ? es.automatizado : this.automationSpotted();

        // Habilidades del fondo admitidas en una partida normal: la de
        // Elprico alarga 15 s el cronómetro y la de Ia triplica los puntos.
        // En Aventura ningún fondo actúa, así que ahí ese extra vale cero.
        const fondo = typeof es.fondo === "string" ? es.fondo : S.bg;
        const modo = typeof es.modo === "string" ? es.modo : S.mode;
        const aventura = modo === "aventura";
        const supervivencia = modo === "supervivencia";
        const extra = (!aventura && fondo === "elprico") ? BONUS_TIME_ELPRICO : 0;

        // El modo Aventura empieza con 50 s y cada palabra regala tiempo,
        // así que la partida dura (y puntúa) bastante más de lo normal:
        // se admite todo el tiempo que las palabras han ido sumando.
        // El modo Supervivencia no tiene duración fija: se juega hasta
        // quedarse sin vidas, así que el tope es la duración REAL de la
        // partida (mínimo un partido completo de 60 s) y los topes de
        // ritmo se calculan sobre ese tiempo: una partida larga no es
        // sospechosa por sí sola, lo que no puede ser es un ritmo imposible.
        const ganado = val(es.tiempoExtra, aventura ? this.getAdvTimeGained() : 0);
        const margen = aventura ? ADV_SCORE_SLACK : 2000;
        const total = supervivencia
            ? Math.max(GAME_TIME + extra, du)
            : GAME_TIME + extra + ganado;

        const why = [];
        if (sc <= 0) return why;
        if (auto) why.push("entorno-automatizado");
        if (ie === 0) why.push("sin-teclas");
        // Escritura con eventos sintéticos: el teclado real marca isTrusted
        if (ie >= 3 && ti / ie < 0.8) why.push("eventos-sinteticos");
        if (ks.length >= 10 && tk / ks.length < 0.8) why.push("teclas-sinteticas");
        // El texto cambia sin que lleguen casi teclas: lo escribe un programa.
        // (El autocompletado, el swipe o el dictado de los teclados virtuales
        //  mandan eventos input sin keydown: por eso solo se señala cuando las
        //  teclas son casi inexistentes. Lo sintético ya lo cubre arriba.)
        if (ie >= 6 && ks.length * 3 < ie) why.push("sin-teclado");
        if (pt > 0) why.push("pegado");
        // La partida debería durar gameTime(): si dura mucho más, se congeló
        if (du > total + 15) why.push("partida-alargada");
        if (cp > total * 4) why.push("ritmo-imposible");
        if (ht / total > 25) why.push("velocidad-imposible");
        if (sc > cp * PTS_PER_WORD * SCORE_BOOST + margen) why.push("puntuacion-imposible");
        // Techo absoluto: 4 palabras/sg máximo durante toda la partida
        if (sc > total * 4 * PTS_PER_WORD * SCORE_BOOST + margen) why.push("puntuacion-demasiada-alta");

        if (ks.length >= 10) {
            const deltas = [];
            for (let i = 1; i < ks.length; i++) {
                deltas.push(ks[i] - ks[i - 1]);
            }
            deltas.sort((a, b) => a - b);
            const media = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            const mediana = deltas[Math.floor(deltas.length / 2)];
            const desv = Math.sqrt(deltas.reduce((a, b) => a + (b - media) * (b - media), 0) / deltas.length);
            const rapidas = deltas.filter(x => x < 18).length / deltas.length;
            if (mediana < 45) why.push("teclas-demasiado-rapidas");  // más de 22 teclas/sg
            if (rapidas > 0.3) why.push("rafagas");
            if (deltas.length >= 25 && desv < 3) why.push("ritmo-constante");
        }
        return why;
    }
}

export const acc = new AccountService();
