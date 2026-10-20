import imgLogo from '#lib/img/estesoTeclea.png';
import { getSetting, setSetting } from './settings.js';
import { S } from './state.svelte.js';
import { storage } from './storage.js';
import {
    GAME_TIME, MAX_MISSES, SPEEDRUN_MS, BONUS_TIME_ELPRICO, SOUP_GIVEN,
    ADV_TIME, ADV_EVERY, ADV_EVERY_MAX, ADV_SPEED_STEP, ADV_SPEED_MAX, ADV_SCORE_SLACK,
    SUP_LIVES, SUP_TIME, SUP_TIME_MIN, SUP_TIME_STEP, SUP_SPEED_STEP, SUP_SPEED_MAX,
    SUP_XP_WORD, SUP_MAX_WORDS, SUP_GRACE, SUP_RAMP, SHOT_MS, SHOT_GAP,
    SUP_LANES_WIDE, SUP_LANES_NARROW,
    ENC_ALFABETO, ENC_CANDY_HIT, ENC_CANDY_FAIL, ENC_MAX_GHOSTS, ENC_MIN_TIME,
    ENC_GHOST_STEP, ENC_TIME_STEP, ENC_SPEED_STEP,
    RANK_URL, RANK_ADV_URL, NAMES_URL, RESETS_URL, RANK_MAX, NAMES_MAX,
    RANK_TIMEOUT, NAME_MAX, MAX_SCORE, MAX_WORDS, PTS_PER_WORD, SCORE_BOOST,
    SEAL_SALT, PROFILES_URL, PASS_MIN, KDF_ROUNDS
} from './data/constants.js';
import {
    WORDS, MURCIANO_WORDS, PICANTE, PHP_WORDS, ANDALUZ_WORDS,
    MINECRAFT_WORDS, HALLOWEEN_WORDS
} from './data/words.js';
import { IMAGENES, emojiSrc } from './data/images.js';
import { FONT_STYLES, BACKGROUNDS, EXTRAS, TYPE_EFFECTS } from './data/catalog.js';
import {
    EVENT_MONTH, EVENT_DAY_START, EVENT_MONTH_END, EVENT_DAY_END, EVENT_HOUR_END,
    TT_TIME_PENALTY, TT_XP_PENALTY, eventStartDate, eventEndDate, halloweenOn
} from './data/events.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { I18N } from './data/i18n.js';
import { VEYON_PLACEHOLDER, VEYON_FAVICON, VEYON_BGS } from './data/veyon.js';

// ---------- Fachada reactiva (runes) ----------
// Estado del juego expuesto a los componentes. Cada lectura de G.x la
// resuelve el proxy llamando a impl[x], que initTeclear() registra como
// una función que lee la variable $state real — así la lectura queda
// suscrita al dato que usa y Svelte re-renderiza solo lo que cambia.
// «rev» marca cuándo la fachada ya está lista: los componentes
// renderizan antes del onMount (donde corre initTeclear), así que sus
// primeras lecturas caen en los stubs; al subir rev se repintan solos.
const impl = {};
let rev = $state(0);
const STUBS = {
    t: k => k,
    owned: [], ownedBgs: [], ownedExtras: [], ownedFx: [],
    extraOn: {}, achData: {},
    // View-models que la vista recorre o desempaqueta antes de que la
    // fachada esté lista (SSR y primer render): formas vacías equivalentes
    boardView: { kind: "hint", txt: "" },
    missesView: { kind: "off", wrong: [] },
    res: {}, rank: {
        normal: { entries: [], online: false, loaded: false, tampered: false },
        aventura: { entries: [], online: false, loaded: false, tampered: false }
    },
    advChips: [], perkOpts: [],
    shopFonts: [], shopBgs: [], shopExtras: [], shopFxs: [], shopEvents: [],
    invSections: [], achCards: [], modeOptions: [], supOptions: [], bgChips: [],
    supMax: 0, maxMisses: 0,
    rankDate: () => "", a: {}
};
export const G = new Proxy({}, {
    get: (_, k) => {
        rev;   // toda lectura queda suscrita al momento «fachada lista»
        return k in impl ? impl[k]() : STUBS[k];
    }
});
        // TODO el juego vive dentro de este closure: las variables internas
        // (puntuación, palabras, teclas, contadores) no son accesibles desde la
        // consola del navegador, así que no se pueden manipular con comandos.
export function initTeclear() {



        // Experiencia que las teclas falladas se han tragado en la partida
        // en curso (se descuenta al acabar, en endGame)
        let ttXpLoss = 0;



        // ---------- Estado ----------
                 // es | en | mur (murciano)
        // ---------- Caramelos y variante Encantada (evento de Halloween) ----------
                   // caramelos guardados (moneda del evento)
                    // cambio de caramelos durante la partida
          // variante de Supervivencia: clasico | encantado
        let encTyped = 0;            // letras acertadas en la partida Encantada
               // type | guess | imagen | aventura | supervivencia
                 // dark | franco | elprico | esteso
          // Modo Veyon: oculta logo y fondos «General»/«Ia» (activo por defecto)
              // idle | playing | over
        
           // imagen en pantalla (modo Imágenes)
                  // modo adivinar: "start" | "hidden" | "found"
          // modo adivinar
                 // modo adivinar
        
        
        let hits = 0;           // teclas / letras acertadas
        let errors = 0;         // fallos
        
                // longitud aceptada en el modo tecleo
        
        let lastTick = 0;
        let timerId = null;
        
                 // récord personal de palabras escritas
                     // monedas acumuladas
                  // monedas ganadas en la partida actual
           // estilos comprados
          // estilo activo
           // fondos desbloqueados (Franco se compra)
              // extras comprados (picante, caos…)
        
        // Extras elegidos SOLO para la partida en curso (Modo Al azar):
        // null = se usa lo que haya en extraOn
        let extraRun = null;
                  // efectos de tecleo comprados
               // efecto de tecleo en uso ("" = ninguno)
        
              // panel de ranking abierto
            // panel de logros abierto
               // panel de inventario abierto
                  // id → { p: progreso, done: completado }
        let srAt = 0;              // instante en que arrancó la ventana del logro Speedrunner
        let srWords = 0;           // palabras escritas dentro de esa ventana de 8 segundos
          // evita guardar la puntuación dos veces
        let playerId = "";         // identificador del jugador en este dispositivo
        let savedScore = false;    // la puntuación de esta partida ya se ha guardado
        // Telemetría de la partida: sirve para detectar escritura automática
        let keyStamps = [];        // instante de cada tecla real pulsada
        let inputEvents = 0;       // eventos "input" recibidos durante la partida
        let trustedInput = 0;      // ... de ellos, llegados del teclado de verdad
        let trustedKeys = 0;       // teclas reales (isTrusted) durante la partida
        let pasteTried = 0;        // intentos de pegar texto en plena partida
        let rankResets = null;     // id → fecha: marcas anteriores no cuentan

        // ---------- Los dos rankings ----------
        // El juego mantiene dos tableros con el MISMO formato de fila (mismas
        // columnas, mismos límites, mismas huellas y Top 10): el global, para
        // los modos clásicos, y el del modo Aventura. Cada tabla tiene su
        // documento en el servidor, su copia local y su estado de conexión.
        const RANK_TABS = ["normal", "aventura"];
        function rankTabOf(m) {
            return m === "aventura" ? "aventura" : "normal";
        }
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
        // Tabla destacada del panel: al guardar una marca se resalta la suya
        
        // Estado de cada tabla: filas válidas, conexión, aviso de alteración
        const rankData = $state({
            normal: { entries: [], online: false, loaded: false, tampered: false },
            aventura: { entries: [], online: false, loaded: false, tampered: false }
        });
        let gameStartAt = 0;       // instante en que empezó la partida
        let gameDuration = 0;      // duración real de la partida (segundos)
           // código aleatorio de verificación humana
        let verifyTyped = "";      // lo tecleado con teclas REALES (no se puede rellenar a mano)

        // ---------- Estado del modo Aventura ----------
          // hay una ventaja en pantalla (el reloj no corre)
             // las tres ventajas sorteadas para elegir
        let pausedTotal = 0;       // ms que el reloj ha estado en pausa (elegir ventaja)
        let pausedAt = 0;          // instante en que empezó la pausa actual
        let advShield = 0;         // fallos que el escudo todavía absorbe
        let advShort = 0;          // palabras cortas que quedan por regalar
        let advFreeze = 0;         // fin de la congelación (performance.now)
        let advDouble = 0;         // fin del doble de puntos (performance.now)
        let advTurbo = 0;          // fin del turbo de tiempo (performance.now)
        let advCoins = 0;          // fin del doble de monedas (performance.now)
        let advRevive = 0;         // salvavidas guardados para el final
        let advTimeGained = 0;     // segundos ganados con las palabras
        let advGold = 0;           // fin de la "racha dorada" (multiplicador x5)
        let advGrace = 0;          // fin de la "indulgencia" (fallo sin perder racha)
        let advRelief = 0;         // palabras que no cuentan para subir de nivel
        let advReliefFrom = 0;     // completed en el momento del "remanso"
        let advPicks = 1;          // ventajas que se pueden elegir en esta parada
        let advExtraPick = 0;      // paradas dobles pendientes ("doble elección")
        let advStops = 0;          // paradas de ventaja ya celebradas
        let advNextPerk = ADV_EVERY;  // palabras escritas en las que toca parar

        // ---------- Estado del modo Supervivencia ----------
          // vidas que quedan (5 al empezar)
        // Palabras que hay ahora en pantalla. Cada una lleva lo suyo: la
        // palabra, las letras ya disparadas, su hueco y sus segundos restantes
        let supItems = [];
        // Reloj que repinta el campo de Supervivencia: los ítems mutan cada
        // tick (bajan, reciben letras), así que la vista se suscribe a este
        // contador y relee el array en cada pulso — sin proxies de por medio
        
        let supSerial = 0;       // id incremental de cada palabra en pantalla
        let supTarget = null;      // palabra a la que apunta el teclado
        let supStartAt = 0;        // instante en que empezó la partida (dificultad)

        // ---------- Perfil de usuario ----------
               // panel de perfil abierto
               // reg | login  (formulario que se está mostrando)
         // evita registrar/entrar dos veces a la vez
             // { id, n } de la cuenta con sesión abierta
                // aviso del formulario / datos
            // el aviso es de error (rojo)

        // ---------- Estado pintado por Svelte (la UI ya no se escribe a mano) ----------
            // línea de estado bajo el tablero
             // texto del botón principal (Jugar/…)
           // avisos de compra en la tienda
            // avisos de «usar» en el inventario
           // aviso junto al botón de guardar marca
        // el aviso es de rechazo (rojo)
           // panel de resultados visible
                  // { score,words,acc,ppm,coins,candy,xp,best,msg,record }
        // cuenta atrás del evento de Halloween
         // el evento está activo ahora mismo
        // frase del logo tras cada toque
          // la frase está visible (se apaga sola)
             // lo tecleado hasta ahora (letras del tablero)
            // la foto del modo Imágenes no ha cargado
                        // experiencia acumulada en todas las partidas
               // partidas terminadas
                // palabras escritas en total

        // Publicación del estado para los componentes: impl[k] devuelve
        // el valor actual del dato k leyendo las variables $state (los
        // derivados se reevalúan al cambiar cualquiera que lean dentro).
        Object.assign(impl, {
            lang:        () => S.lang,
            mode:        () => S.mode,
            state:       () => S.state,
            supVariant:  () => S.supVariant,
            bg:          () => S.bg,
            veyon:       () => S.veyon,
            score:       () => S.score,
            streak:      () => S.streak,
            completed:   () => S.completed,
            best:        () => S.best,
            bestWords:   () => S.bestWords,
            coins:       () => S.coins,
            coinsRun:    () => S.coinsRun,
            caramelos:   () => S.caramelos,
            candyRun:    () => S.candyRun,
            owned:       () => S.owned,
            equipped:    () => S.equipped,
            ownedBgs:    () => S.ownedBgs,
            ownedExtras: () => S.ownedExtras,
            extraOn:     () => S.extraOn,
            ownedFx:     () => S.ownedFx,
            fxEquipped:  () => S.fxEquipped,
            achData:     () => S.achData,
            xp:          () => S.xp,
            gamesPlayed: () => S.gamesPlayed,
            wordsTotal:  () => S.wordsTotal,
            shopOpen:    () => S.shopOpen,
            rankOpen:    () => S.rankOpen,
            logrosOpen:  () => S.logrosOpen,
            invOpen:     () => S.invOpen,
            accOpen:     () => S.accOpen,
            accMode:     () => S.accMode,
            accSession:  () => S.accSession,
            rankFocus:   () => S.rankFocus,
            t:           () => t,
            uiEn:        () => uiLang() === "en",
            subtitle:    () => S.mode === "imagen" ? t("subtitleI") :
                             S.mode === "guess" ? t("subtitleG") :
                             S.mode === "aventura" ? t("subtitleA") :
                             S.mode === "supervivencia" ? t("subtitleS") :
                             S.lang === "mur" ? t("subtitleM") : t("subtitleT"),
            streakTxt:   () => S.streak + " (x" + multiplier() + ")",
            level:       () => level(),
            timeTxt:     () => Math.max(0, Math.ceil(S.timeLeft)),
            timeLow:     () => S.state === "playing" &&
                             (S.mode === "supervivencia" ? S.timeLeft <= 4 : S.timeLeft <= 10),
            coinsTxt:    () => fmtCoins(S.coins),
            accHintTxt:  () => S.accSession ? t("accDataHint") : t("accHint"),
            btnRegTxt:   () => S.accSession ? t("btnProfile") : t("btnRegister"),
            candyTxt:    () => fmtCandy(S.caramelos),
            achCountTxt: () => Object.values(S.achData).filter(d => d.done).length +
                             "/" + ACHIEVEMENTS.length,
            invCountTxt: () => invItems().length,

            // ---------- Estado que la UI pinta directamente ----------
            statusTxt:   () => S.statusTxt,
            startTxt:    () => S.startTxt,
            shopMsgTxt:  () => S.shopMsgTxt,
            invMsgTxt:   () => S.invMsgTxt,
            rankMsgTxt:  () => S.rankMsgTxt,
            rankMsgOff:  () => S.rankMsgOff,
            accMsgTxt:   () => S.accMsgTxt,
            accMsgWarn:  () => S.accMsgWarn,
            res:         () => S.res,
            resOpen:     () => S.resOpen,
            verifyCode:  () => S.verifyCode,
            rankBusy:    () => S.rankBusy,
            savedScore:  () => savedScore,
            eventCountTxt: () => S.eventCountTxt,
            halloween:   () => S.halloween,
            logoPhraseTxt: () => S.logoPhraseTxt,
            logoShow:    () => S.logoShow,
            playing:     () => S.state === "playing",
            typingDis:   () => S.state !== "playing" || S.perkOpen,
            esAdmin:     () => esAdmin(),
            accBusy:     () => S.accBusy,
            accWhoTxt:   () => S.accSession ? t("accWho") + S.accSession.n : "-",
            accSubmitTxt:() => S.accMode === "reg" ? t("accSubmitReg") : t("accSubmitLogin"),
            accSwitchTxt:() => S.accMode === "reg" ? t("accSwitchToLogin") : t("accSwitchToReg"),
            rankWhoTxt:  () => S.accSession ? t("accRankWith") + S.accSession.n : t("accRankNo"),
            perkOpen:    () => S.perkOpen,
            perkOpts:    () => S.perkOpts,
            supTargetN:  () => supTarget ? supTarget.n : -1,
            supLives:    () => S.supLives,
            supMax:      () => SUP_LIVES,
            picErr:      () => S.picErr,

            // ---------- View-models (listas que la UI recorre) ----------
            // El tablero: qué tipo de contenido toca y sus datos
            boardView:   () => {
                if (S.state !== "playing") {
                    return { kind: "hint", txt: S.state === "over" ? t("boardEnd") : t("boardIdle") };
                }
                if (S.mode === "supervivencia") {
                    S.supTick;   // se repinta con cada pulso del campo
                    // Los ítems mutan en sitio (bajan, reciben letras), así que
                    // la vista recibe una COPIA de cada uno: al cambiar la
                    // referencia, el {#each} con clave vuelve a pintar la caja
                    return { kind: "sup",
                             items: supItems.map(it => ({
                                 n: it.n, w: it.w, typed: it.typed,
                                 shotFrom: it.shotFrom, lane: it.lane,
                                 span: it.span, y: it.y, fresh: it.fresh
                             })),
                             targetN: supTarget ? supTarget.n : -1,
                             enc: encOn(), shotMs: SHOT_MS, shotGap: SHOT_GAP };
                }
                if (S.mode === "imagen") {
                    return { kind: "img", em: S.currentImg ? S.currentImg.em : "🖼️",
                             src: S.currentImg ? emojiSrc(S.currentImg.em) : "" };
                }
                if (S.mode === "guess") {
                    const firstHidden = S.mask.indexOf("hidden");
                    return { kind: "letters", letters: S.word.split("").map((ch, i) => ({
                        ch: S.mask[i] === "hidden" ? "_" : ch,
                        cls: S.mask[i] === "hidden" ? "blank" + (i === firstHidden ? " cursor" : "")
                             : (S.mask[i] === "found" ? "ok" : "")
                    })) };
                }
                return { kind: "letters", letters: S.word.split("").map((ch, i) => ({
                    ch: ch,
                    cls: i < S.typedStr.length ? (S.typedStr[i] === ch ? "ok" : "bad")
                         : (i === S.typedStr.length ? "cursor" : "")
                })) };
            },
            // Vidas de Supervivencia / fallos de Adivinar, en el mismo hueco
            missesView:  () => {
                if (S.mode === "supervivencia") return { kind: "lives", n: S.supLives };
                if (S.mode === "guess") return { kind: "guess", n: S.misses, wrong: S.wrongLetters };
                return { kind: "off" };
            },
            maxMisses:   () => MAX_MISSES,
            // Efectos activos del modo Aventura (se recalculan con cada tick
            // porque leen timeLeft aunque no lo muestren)
            advChips:    () => {
                S.timeLeft;
                if (S.mode !== "aventura" || S.state !== "playing") return [];
                const chips = [{ txt: "⏱️ +" + timePerWord() + "s/" + t("advWord"), on: false }];
                const vel = tickSpeed();
                if (vel > 1.001) chips.push({ txt: "⏩ x" + vel.toFixed(1)
                    .replace(".", uiLang() === "es" ? "," : "."), on: true });
                if (advShield > 0) chips.push({ txt: "🛡️ x" + advShield, on: true });
                if (advShort > 0) chips.push({ txt: "🛤️ x" + advShort, on: true });
                if (advRevive > 0) chips.push({ txt: "🆘 x" + advRevive, on: true });
                const quedanRelief = Math.max(0, advRelief - (S.completed - advReliefFrom));
                if (quedanRelief > 0) chips.push({ txt: "🌊 x" + quedanRelief, on: true });
                const ahora = performance.now();
                if (ahora < advFreeze) chips.push({ txt: "❄️ " + Math.ceil((advFreeze - ahora) / 1000), on: true });
                if (ahora < advDouble) chips.push({ txt: "💥 x2 " + Math.ceil((advDouble - ahora) / 1000), on: true });
                if (ahora < advTurbo) chips.push({ txt: "🏃 x2s " + Math.ceil((advTurbo - ahora) / 1000), on: true });
                if (ahora < advCoins) chips.push({ txt: "🧲 x2🪙 " + Math.ceil((advCoins - ahora) / 1000), on: true });
                if (ahora < advGold) chips.push({ txt: "💎 x5 " + Math.ceil((advGold - ahora) / 1000), on: true });
                if (ahora < advGrace) chips.push({ txt: "😇 " + Math.ceil((advGrace - ahora) / 1000), on: true });
                return chips;
            },
            // Tarjetas de la tienda (compra; usarse es cosa del Inventario)
            shopFonts:   () => FONT_STYLES.map(st => ({
                id: st.id, cls: st.cls, font: st.font,
                name: uiLang() === "es" ? st.es : st.en,
                equipped: S.equipped === st.id,
                own: S.owned.includes(st.id), ach: !!st.ach,
                price: st.price, cant: !esAdmin() && S.coins < st.price
            })),
            shopBgs:     () => BACKGROUNDS
                .filter(b => !b.event || (!S.halloween && S.ownedBgs.includes(b.id)))
                .map(b => ({
                    id: b.id, icon: b.icon || "🌙",
                    img: veyonHiddenBg(b.id) ? VEYON_PLACEHOLDER : b.img,
                    name: uiLang() === "es" ? b.es : b.en,
                    desc: uiLang() === "es" ? b.descEs : b.descEn,
                    equipped: S.bg === b.id,
                    own: S.ownedBgs.includes(b.id), ach: !!b.ach,
                    price: b.price, cant: !esAdmin() && S.coins < b.price
                })),
            shopExtras:  () => EXTRAS
                .filter(x => !x.event || (!S.halloween && ownsExtra(x.id)))
                .map(x => ({
                    id: x.id, icon: x.icon,
                    name: uiLang() === "es" ? x.es : x.en,
                    desc: uiLang() === "es" ? x.descEs : x.descEn,
                    on: ownsExtra(x.id) && !!S.extraOn[x.id],
                    own: ownsExtra(x.id),
                    price: x.price, cant: !esAdmin() && S.coins < x.price
                })),
            shopFxs:     () => TYPE_EFFECTS
                .filter(f => !f.event || (!S.halloween && ownsFx(f.id)))
                .map(f => ({
                    id: f.id, icon: f.icon, art: f.art, color: f.color,
                    name: uiLang() === "es" ? f.es : f.en,
                    desc: uiLang() === "es" ? f.descEs : f.descEn,
                    on: ownsFx(f.id) && S.fxEquipped === f.id,
                    own: ownsFx(f.id), ach: !!f.ach,
                    price: f.price, cant: !esAdmin() && S.coins < f.price
                })),
            // Los tres artículos de la tienda de evento (Halloween)
            shopEvents:  () => {
                if (!S.halloween) return [];
                const en = uiLang() === "en";
                const out = [];
                const b = BACKGROUNDS.find(x => x.id === "fivenights");
                if (b) out.push({
                    kind: "bg", id: b.id, icon: b.icon || "📼",
                    name: en ? b.en : b.es, desc: en ? b.descEn : b.descEs,
                    img: b.img, equipped: S.bg === b.id,
                    own: S.ownedBgs.includes(b.id), price: b.price,
                    cant: !esAdmin() && S.caramelos < b.price
                });
                const f = fxById("sangre");
                if (f) out.push({
                    kind: "fx", id: f.id, icon: f.icon, color: f.color,
                    name: en ? f.en : f.es, desc: en ? f.descEn : f.descEs,
                    on: ownsFx(f.id) && S.fxEquipped === f.id,
                    own: ownsFx(f.id), price: f.price,
                    cant: !esAdmin() && S.caramelos < f.price
                });
                const x = EXTRAS.find(e => e.id === "truco");
                if (x) out.push({
                    kind: "extra", id: x.id, icon: x.icon,
                    name: en ? x.en : x.es, desc: en ? x.descEn : x.descEs,
                    on: ownsExtra(x.id) && !!S.extraOn[x.id],
                    own: ownsExtra(x.id), price: x.price,
                    cant: !esAdmin() && S.caramelos < x.price
                });
                return out;
            },
            // Inventario seccionado (mismas secciones que la tienda + evento)
            invSections: () => {
                const items = invItems();
                const esEvento = it => S.halloween && it.event;
                return [
                    { key: "event", title: t("invEventTitle"),
                      items: items.filter(esEvento) },
                    { key: "font", title: t("invFontsTitle"),
                      items: items.filter(it => it.tipo === "font" && !esEvento(it)) },
                    { key: "bg", title: t("invBgsTitle"),
                      items: items.filter(it => it.tipo === "bg" && !esEvento(it)) },
                    { key: "extra", title: t("invExtrasTitle"),
                      items: items.filter(it => it.tipo === "extra" && !esEvento(it)) },
                    { key: "fx", title: t("invFxTitle"),
                      items: items.filter(it => it.tipo === "fx" && !esEvento(it)) }
                ];
            },
            // Tarjetas del panel de logros
            achCards:    () => ACHIEVEMENTS.map(a => {
                const d = S.achData[a.id] || { p: 0, done: false };
                return {
                    id: a.id, icon: a.icon,
                    name: uiLang() === "es" ? a.es : a.en,
                    desc: uiLang() === "es" ? a.descEs : a.descEn,
                    p: d.p, goal: a.goal,
                    pct: Math.round((d.p / a.goal) * 100),
                    done: !!d.done, reward: rewardLabel(a)
                };
            }),
            // Las dos tablas de ranking y quién soy en ellas
            rank:        () => rankData,
            myId:        () => currentPlayerId(),
            rankDate:    () => rankDate,
            // Desplegables de variantes (extras de Tecleo / Supervivencia)
            modeOptions: () => [{ v: "", txt: t("modeClassic") }]
                .concat(EXTRAS.filter(x => ownsExtra(x.id))
                    .map(x => ({ v: x.id, txt: x.icon + " " + (uiLang() === "es" ? x.es : x.en) }))),
            modeSel:     () => activeExtraId(),
            modeSelDis:  () => EXTRAS.every(x => !ownsExtra(x.id)) ||
                             S.mode !== "type" || S.state === "playing",
            modeSelTitle:() => EXTRAS.every(x => !ownsExtra(x.id)) ? t("modeSelectEmpty")
                             : (S.mode !== "type" ? t("modeSelectOff") : t("modeSelectHint")),
            supOptions:  () => {
                const out = [{ v: "clasico", txt: t("supVarClasico") }];
                if (S.halloween) out.push({ v: "encantado", txt: t("supVarEncantado") });
                return out;
            },
            supSelDis:   () => S.mode !== "supervivencia" || S.state === "playing",
            supSelTitle: () => S.mode !== "supervivencia" ? t("supSelectOff") : t("supVarHint"),
            // Chips de fondos comprados (fila de Apariencia)
            bgChips:     () => BACKGROUNDS
                .filter(b => b.id !== "dark" && b.id !== "franco" && S.ownedBgs.includes(b.id))
                .map(b => ({
                    id: b.id,
                    hidden: veyonHiddenBg(b.id),
                    label: (b.id === "elprico" ? "😎 " : b.icon ? b.icon + " " : "🎨 ") +
                           (uiLang() === "es" ? b.es : b.en),
                    active: S.bg === b.id
                })),
            francoHidden:() => veyonHiddenBg("franco"),
            veyonImg:    () => VEYON_PLACEHOLDER,
            a:           () => A
        });
        rev++;   // fachada lista: los componentes pasan de stubs a datos

        // Acciones que la UI invoca (G.a.x): la mutación sigue siendo cosa
        // del juego; el componente solo llama y Svelte repinta lo que cambie.
        const A = {
            setLang: setLang,
            setMode: setMode,
            setBg: setBg,
            chooseExtra: chooseExtra,
            setSupVariant: setSupVariant,
            toggleVeyon: () => setVeyon(!S.veyon),
            toggleShop: toggleShop,
            toggleInv: toggleInv,
            toggleLogros: toggleLogros,
            toggleRanking: () => toggleRanking(),
            toggleAccount: toggleAccount,
            closeAccount: closeAccount,
            submitAccount: submitAccount,
            accSwitchMode: accSwitchMode,
            accSave: accSaveProfile,
            accOut: () => doLogout(),
            buyStyle: id => buyStyle(FONT_STYLES.find(s => s.id === id)),
            buyBg: id => buyBg(BACKGROUNDS.find(b => b.id === id)),
            buyExtra: id => buyExtra(EXTRAS.find(x => x.id === id)),
            buyFx: id => buyFx(fxById(id)),
            startGame: startGame,
            saveScore: saveScore,
            choosePerk: choosePerk,
            supAim: n => {
                supAim(supItems.find(x => x.n === n));
                if (typing) typing.focus();
            },
            verifyKey: verifyKey,
            verifyInput: verifyInputText,
            verifyPaste: verifyPaste,
            picError: () => { S.picErr = true; },
            showLogoPhrase: showLogoPhrase
        };

        // El murciano es un dialecto: los textos, récords y fechas se guardan
        // igual que en español, pero las palabras salen del diccionario murciano.
        const uiLang = () => (S.lang === "mur" ? "es" : S.lang);
        const t = k => I18N[uiLang()][k];

        // Modo que se etiqueta en el ranking: el murciano tecleado sigue
        // registrándose como "murciano", igual que hasta ahora.
        function entryMode() {
            if (S.mode === "type" && S.lang === "mur") return "murciano";
            return S.mode;
        }

        // ---------- Elementos ----------
        // Solo quedan los nodos que el juego toca de verdad: los paneles para
        // llevarlos a la vista, el tablero (sacudida y disparos) y los campos
        // cuyo valor se lee o se rellena. Todo lo demás lo pinta Svelte.
        const stage = document.getElementById("stage");
        const board = document.getElementById("board");
        const typing = document.getElementById("typing");
        const logros = document.getElementById("logros");
        const inventario = document.getElementById("inventario");
        const perfil = document.getElementById("perfil");
        const accName = document.getElementById("accName");
        const accPass = document.getElementById("accPass");
        const accPass2 = document.getElementById("accPass2");
        const ranking = document.getElementById("ranking");
        const verifyInput = document.getElementById("verifyInput");
        // ---------- Récord por idioma ----------
        function loadBest() {
            try {
                let v = storage.get("mejorTecleo." + uiLang());
                if (v === null && uiLang() === "es") {
                    v = storage.get("mejorTecleo"); // récord antiguo
                }
                return parseInt(v || "0", 10) || 0;
            } catch (e) {
                return 0;
            }
        }

        function saveBest() {
            try {
                storage.set("mejorTecleo." + uiLang(), String(S.best));
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // ---------- Récord personal de palabras escritas ----------
        function loadBestWords() {
            try {
                const v = storage.get("mejorPalabras." + uiLang());
                return parseInt(v || "0", 10) || 0;
            } catch (e) {
                return 0;
            }
        }

        function saveBestWords() {
            try {
                storage.set("mejorPalabras." + uiLang(), String(S.bestWords));
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // ---------- Ranking global ----------
        // El ranking vive en un JSON público: todos los visitantes leen y escriben
        // el mismo documento, de modo que la lista es común a todo el mundo.
        // Mientras tanto se guarda una copia en este dispositivo por si no hay internet.

        // Petición con tiempo de espera: evita que la interfaz se quede colgada
        function rankFetch(url, opts) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), RANK_TIMEOUT);
            return fetch(url, Object.assign({}, opts, { signal: ctrl.signal }))
                .finally(() => clearTimeout(timer));
        }

        function makeId() {
            if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
            return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
        }

        // Identificador fijo del jugador: así su mejor marca no ocupa dos puestos
        function loadPlayerId() {
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

        function loadPlayerName() {
            try {
                return String(storage.get("teclear.nombre") || "").slice(0, NAME_MAX);
            } catch (e) {
                return "";
            }
        }

        function savePlayerName(name) {
            try {
                storage.set("teclear.nombre", name);
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        function loadLocalRanking(tab) {
            try {
                const data = storage.getJSON(RANK_TAB_CONF[tab].ls, null);
                return (data && Array.isArray(data.entries)) ? data.entries : [];
            } catch (e) {
                return [];
            }
        }

        function saveLocalRanking(entries, tab) {
            try {
                storage.setJSON(RANK_TAB_CONF[tab].ls, { v: 1, entries: entries });
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // ---------- Integridad de los datos ----------
        // El documento del ranking es público: técnicamente CUALQUIER persona
        // podría editarlo. Por eso esta página solo acepta lo que supera estos
        // controles, de modo que una fila manipulada se ignora y desaparece:
        //   · forma correcta (tipos, longitudes y modo de juego conocido)
        //   · coherencia (con esas palabras no se pueden lograr esos puntos)
        //   · huella de integridad (si cambia un dato, la huella no cuadra)
        function hash(raw) {
            let h = 5381;
            for (let i = 0; i < raw.length; i++) {
                h = (Math.imul(h, 33) ^ raw.charCodeAt(i)) >>> 0;
            }
            return h.toString(36);
        }

        // Huella de una fila: se guarda junto a los datos (campo "c")
        function sealOf(e) {
            return hash(SEAL_SALT + "|" + e.id + "|" + e.n + "|" + e.s + "|" + e.w + "|" + e.m + "|" + e.d);
        }

        function sealList(entries) {
            return entries.map(e => ({
                id: e.id, n: e.n, s: e.s, w: e.w, m: e.m, d: e.d, c: sealOf(e)
            }));
        }

        // Huella del documento entero: delata que el JSON fue editado a mano
        function docSeal(entries) {
            return hash(SEAL_SALT + "|doc|" + JSON.stringify(entries));
        }

        // Huella del documento de reinicios (mismo sistema, otro prefijo)
        function resetsSeal(cuerpo) {
            return hash(SEAL_SALT + "|resetos|" + JSON.stringify(cuerpo));
        }

        function cleanName(v) {
            return String(v == null ? "" : v)
                .replace(/[\u0000-\u001f\u007f<>]/g, " ")  // controles y etiquetas HTML
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, NAME_MAX);
        }

        // Nombres que se admiten al escribirlos ahora mismo: letras (con o sin
        // acento), números, espacios y algunos signos; nada de símbolos raros
        function nameOk(v) {
            try {
                const plano = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return /^[\w .'-]+$/.test(plano) && v.length > 0 && v.length <= NAME_MAX;
            } catch (e) {
                return /^[0-9A-Za-z .'-]+$/.test(v) && v.length > 0;
            }
        }

        // Devuelve la fila si es válida; null si está corrupta o manipulada
        function validEntry(raw) {
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
            if (raw.c !== undefined && String(raw.c) !== sealOf({ id: id, n: n, s: s, w: w, m: m, d: d })) {
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
        function normalizeRank(list, resets, tab) {
            const cortes = resets || rankResets || {};
            const soloAventura = tab === "aventura";
            const byId = {};
            (Array.isArray(list) ? list : []).forEach(raw => {
                const e = validEntry(raw);
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

        function fetchRanking(tab) {
            return rankFetch(RANK_TAB_CONF[tab].url, { method: "GET" }).then(res => {
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
                rankData[tab].tampered = !!(data && data.c !== undefined &&
                    String(data.c) !== docSeal(entries));
                if (data && data.c === undefined) rankData[tab].tampered = true; // aún sin sellar
                return entries;
            });
        }

        function pushRanking(entries, tab) {
            const clean = sealList(entries);        // se sellan las filas al subir
            const body = { v: 1, entries: clean, c: docSeal(clean) };
            return rankFetch(RANK_TAB_CONF[tab].url, {
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
        function sanitizeResets(data) {
            const src = (data && typeof data === "object" && data.r && typeof data.r === "object")
                ? data.r : {};
            const out = {};
            let n = 0;
            Object.keys(src).forEach(id => {
                if (n >= 200) return;
                // "*" = reinicio GLOBAL: ninguna marca anterior a esa fecha cuenta
                if (id !== "*" && !/^[A-Za-z0-9._-]{1,64}$/.test(id)) return;
                const iso = String(src[id] || "");
                if (!iso || iso.length > 30 || isNaN(new Date(iso).getTime())) return;
                out[id] = iso;
                n++;
            });
            return out;
        }

        function fetchResets(force) {
            if (force) rankResets = null;
            if (rankResets) return Promise.resolve(rankResets);
            return rankFetch(RESETS_URL, { method: "GET" })
                .then(res => {
                    if (!res.ok) { rankResets = {}; return {}; }  // sin documento
                    return res.json();
                })
                .then(data => {
                    const cuerpo = (data && data.r && typeof data.r === "object") ? data.r : {};
                    // Sello del documento: si alguien lo editó a mano, no aplica
                    if (data && data.c !== undefined && String(data.c) !== resetsSeal(cuerpo)) {
                        return rankResets || {};
                    }
                    if (!rankResets) rankResets = sanitizeResets(data);
                    return rankResets;
                })
                .catch(() => (rankResets || {}));  // sin conexión: se vuelve a probar
        }

        // ---------- Nombres reservados (uno por jugador) ----------
        // Documento aparte con la lista de nombres ya usados: nadie puede
        // repetir el nombre de otro jugador.
        function loadLocalNames() {
            try {
                const data = storage.getJSON("teclear.nombres", null);
                return (data && Array.isArray(data.used)) ? data.used : [];
            } catch (e) {
                return [];
            }
        }

        function saveLocalNames(list) {
            try {
                storage.setJSON("teclear.nombres", { v: 1, used: list });
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // Clave de comparación: sin acentos, en minúsculas y con espacios juntos
        function nameKey(v) {
            const s = cleanName(v);
            try {
                return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            } catch (e) {
                return s.toLowerCase();
            }
        }

        function normalizeNames(list) {
            const byKey = {};
            (Array.isArray(list) ? list : []).forEach(raw => {
                if (!raw || typeof raw !== "object") return;
                const n = cleanName(raw.n);
                const id = String(raw.id || "");
                const d = String(raw.d || "");
                if (!n || !id || id.length > 64 || !/^[A-Za-z0-9._-]+$/.test(id)) return;
                const k = nameKey(n);
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

        function nameOwner(list, name) {
            const k = nameKey(name);
            for (let i = 0; i < list.length; i++) {
                if (nameKey(list[i].n) === k) return list[i].id;
            }
            return "";
        }

        function fetchNames() {
            return rankFetch(NAMES_URL, { method: "GET" }).then(res => {
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

        function pushNames(list) {
            return rankFetch(NAMES_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ v: 1, used: list })
            }).then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
            });
        }

        // Reserva el nombre para este jugador: lo comprueba en la lista global,
        // lo registra y vuelve a comprobar por si otro jugador llegó antes.
        function reserveName(name, myId) {
            const record = { n: name, id: myId, d: new Date().toISOString() };

            function finish(remote, localOnly) {
                const merged = normalizeNames(remote.concat(local));
                const owner = nameOwner(merged, name);
                if (owner && owner !== myId) return { taken: true };   // ya usado
                const next = normalizeNames(merged.concat([record]));
                saveLocalNames(next);
                if (localOnly) return { taken: false, local: true };
                return pushNames(next)
                    .then(() => fetchNames())                    // se re-comprueba
                    .then(fresh => ({
                        taken: nameOwner(normalizeNames(fresh), name) === myId ? false : true
                    }))
                    .catch(() => ({ taken: false, local: true }));
            }

            const local = loadLocalNames();
            return fetchNames()
                .catch(err => {
                    // Sin documento todavía: se recrea con lo local
                    if (err && err.notFound) return [];
                    throw err;
                })
                .then(remote => finish(remote, false))
                .catch(() => finish([], true));   // sin conexión: solo comprobación local
        }

        // ---------- Perfiles de usuario (registro e inicio de sesión) ----------
        // La contraseña NUNCA se guarda: solo su resumen SHA-256 calculado con
        // una sal aleatoria y miles de iteraciones. El documento es público,
        // así que quien lo descargue únicamente ve hashes ilegibles.

        function sha256hex(txt) {
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
        function makeSalt() {
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

        // Resumen de la contraseña: mismo código con la sal, repetido muchas
        // veces. Ralentiza muchísimo un ataque por fuerza bruta del JSON.
        function derivePass(pass, salt) {
            let h = salt;
            for (let i = 0; i < KDF_ROUNDS; i++) h = sha256hex(salt + "|" + i + "|" + pass + "|" + h);
            return h;
        }

        // Identificador estable de la cuenta: el mismo desde cualquier equipo
        function profileId(name) {
            return sha256hex("perfil|" + nameKey(name)).slice(0, 32);
        }

        function num(v, max) {
            const n = Math.floor(Number(v));
            return (isFinite(n) && n > 0) ? Math.min(n, max) : 0;
        }

        // Datos admisibles de un perfil: tipos correctos y valores dentro de
        // límites imposibles de superar jugando. Todo lo demás se descarta.
        function cleanProfileData(raw) {
            const r = (raw && typeof raw === "object") ? raw : {};
            const rec = obj => ({
                es: num(obj && obj.es, MAX_SCORE),
                en: num(obj && obj.en, MAX_SCORE)
            });
            const recW = obj => ({
                es: num(obj && obj.es, MAX_WORDS),
                en: num(obj && obj.en, MAX_WORDS)
            });
            const list = (v, ids) => (Array.isArray(v)
                ? v.filter(x => typeof x === "string" && ids.indexOf(x) >= 0).slice(0, 30) : []);

            const st = list(r.owned, FONT_STYLES.map(s => s.id));
            if (st.indexOf("clasico") < 0) st.push("clasico");
            const bgs = list(r.bgs, BACKGROUNDS.map(b => b.id));
            if (bgs.indexOf("dark") < 0) bgs.push("dark");
            const exs = list(r.extras, EXTRAS.map(x => x.id));
            const fxs = list(r.fxs, TYPE_EFFECTS.map(f => f.id));
            const eq = (typeof r.equipped === "string" && st.indexOf(r.equipped) >= 0) ? r.equipped : "clasico";
            const bg = (typeof r.bg === "string" && bgs.indexOf(r.bg) >= 0) ? r.bg : "dark";
            const fxEq = (typeof r.fx === "string" && fxs.indexOf(r.fx) >= 0) ? r.fx : "";
            const on = {};
            EXTRAS.forEach(x => { on[x.id] = !!(r.extraOn && r.extraOn[x.id]) && exs.indexOf(x.id) >= 0; });

            return {
                coins: num(r.coins, 10000000),
                xp: num(r.xp, 1000000000),
                games: num(r.games, 1000000),
                words: num(r.words, 100000000),
                owned: st, equipped: eq,
                bgs: bgs, bg: bg,
                extras: exs, extraOn: on,
                fxs: fxs, fx: fxEq,
                best: rec(r.best),
                bestWords: recW(r.bestWords)
            };
        }

        // Marca del documento de perfiles: delata ediciones hechas a mano
        function profilesSeal(users) {
            return hash(SEAL_SALT + "|perfiles|" + JSON.stringify(users));
        }

        function validProfile(raw) {
            if (!raw || typeof raw !== "object") return null;
            if (typeof raw.id !== "string" || typeof raw.n !== "string") return null;
            if (typeof raw.salt !== "string" || typeof raw.hash !== "string") return null;
            if (!/^[A-Za-z0-9._-]{1,64}$/.test(raw.id)) return null;
            const n = cleanName(raw.n);
            if (!n || !nameOk(n)) return null;
            if (!/^[0-9a-f]{16,128}$/.test(raw.salt)) return null;
            if (!/^[0-9a-f]{32,128}$/.test(raw.hash)) return null;
            const d = String(raw.d || "");
            if (d && (d.length > 30 || isNaN(new Date(d).getTime()))) return null;
            const last = String(raw.last || "");
            if (last && (last.length > 30 || isNaN(new Date(last).getTime()))) return null;
            return {
                id: raw.id, n: n, salt: raw.salt, hash: raw.hash,
                d: d, last: last, data: cleanProfileData(raw.data)
            };
        }

        function loadProfilesLocal() {
            try {
                const doc = storage.getJSON("teclear.perfiles", null);
                if (!doc || !Array.isArray(doc.users)) return [];
                return doc.users.map(validProfile).filter(Boolean);
            } catch (e) {
                return [];
            }
        }

        function saveProfilesLocal(users) {
            try {
                const clean = users.map(validProfile).filter(Boolean);
                storage.setJSON("teclear.perfiles", { v: 1, users: clean, c: profilesSeal(clean) });
                return clean;
            } catch (e) {
                return [];
            }
        }

        function findProfile(users, name) {
            const k = nameKey(name);
            for (let i = 0; i < users.length; i++) {
                if (nameKey(users[i].n) === k) return users[i];
            }
            return null;
        }

        function upsertProfile(users, rec) {
            const next = users.slice();
            let i = -1;
            for (let j = 0; j < next.length; j++) if (next[j].id === rec.id) i = j;
            if (i >= 0) next[i] = rec; else next.push(rec);
            return saveProfilesLocal(next);
        }

        function fetchProfiles() {
            return rankFetch(PROFILES_URL, { method: "GET" }).then(res => {
                if (!res.ok) {
                    const err = new Error("HTTP " + res.status);
                    err.notFound = (res.status === 404);   // documento aún no creado
                    throw err;
                }
                return res.json();
            }).then(data => {
                const users = (data && Array.isArray(data.users))
                    ? data.users.map(validProfile).filter(Boolean) : [];
                if (!data || data.c === undefined || String(data.c) !== profilesSeal(data.users || [])) {
                    const err = new Error("sello");
                    err.tampered = true;   // alguien editó el JSON a mano
                    throw err;
                }
                return users;
            });
        }

        function pushProfiles(users) {
            const clean = users.map(validProfile).filter(Boolean);
            const body = { v: 1, users: clean, c: profilesSeal(clean) };
            return rankFetch(PROFILES_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }).then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
            });
        }

        // Lee la nube; si falla (o el documento está alterado) se usa la copia
        // local de este dispositivo para poder seguir trabajando.
        function profilesStage() {
            return fetchProfiles()
                .catch(err => {
                    if (err && err.notFound) return [];   // aún no existe: se crea
                    throw err;
                })
                .then(users => ({ users: users, offline: false }))
                .catch(err => ({
                    users: loadProfilesLocal(),
                    offline: true,
                    tampered: !!(err && err.tampered)
                }));
        }

        // ---------- Datos que se guardan en la cuenta ----------
        function readRec(key) {
            try {
                let v = storage.get(key);
                if (v === null && key === "mejorTecleo.es") v = storage.get("mejorTecleo");
                return parseInt(v || "0", 10) || 0;
            } catch (e) {
                return 0;
            }
        }

        function snapshotData() {
            return cleanProfileData({
                coins: S.coins, xp: S.xp, games: S.gamesPlayed, words: S.wordsTotal,
                owned: S.owned, equipped: S.equipped,
                bgs: S.ownedBgs, bg: S.bg,
                extras: S.ownedExtras, extraOn: S.extraOn,
                fxs: S.ownedFx, fx: S.fxEquipped,
                best: { es: readRec("mejorTecleo.es"), en: readRec("mejorTecleo.en") },
                bestWords: { es: readRec("mejorPalabras.es"), en: readRec("mejorPalabras.en") }
            });
        }

        // Carga en el juego lo que trae la cuenta (monedas, estilos, récords…)
        function applyData(raw) {
            const d = cleanProfileData(raw);
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
            try {
                storage.set("mejorTecleo.es", String(d.best.es));
                storage.set("mejorTecleo.en", String(d.best.en));
                storage.set("mejorPalabras.es", String(d.bestWords.es));
                storage.set("mejorPalabras.en", String(d.bestWords.en));
                storage.set("teclear.fondo", S.bg);
            } catch (e) { /* sin almacenamiento disponible */ }
            saveShop();
            saveProfileStats();
            applyStyle();
            applyFx();
            applyLang();
            // Los logros completados siguen mandando su recompensa: si la
            // cuenta trae estilos o fondos sin los ganados jugando, se
            // vuelven a poner en su sitio
            ACHIEVEMENTS.forEach(a => {
                if (S.achData[a.id] && S.achData[a.id].done) grantAchReward(a, true);
            });
        }

        function loadProfileStats() {
            try {
                S.xp = parseInt(storage.get("teclear.xp") || "0", 10) || 0;
                S.gamesPlayed = parseInt(storage.get("teclear.partidas") || "0", 10) || 0;
                S.wordsTotal = parseInt(storage.get("teclear.palabras") || "0", 10) || 0;
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        function saveProfileStats() {
            try {
                storage.set("teclear.xp", String(S.xp));
                storage.set("teclear.partidas", String(S.gamesPlayed));
                storage.set("teclear.palabras", String(S.wordsTotal));
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // ---------- Sesión ----------
        function loadSession() {
            try {
                const s = storage.getJSON("teclear.sesion", null);
                if (s && typeof s.id === "string" && typeof s.n === "string" && nameOk(s.n)) {
                    return { id: s.id, n: cleanName(s.n) };
                }
            } catch (e) { /* sin almacenamiento disponible */ }
            return null;
        }

        function saveSession(s) {
            try {
                if (s) storage.setJSON("teclear.sesion", s);
                else storage.remove("teclear.sesion");
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // Id con el que este jugador aparece en el ranking: el de su cuenta si
        // tiene sesión, y en caso contrario el fijo de este dispositivo.
        function currentPlayerId() {
            return S.accSession ? S.accSession.id : loadPlayerId();
        }

        // Guarda los datos actuales en la cuenta: siempre en local y, si hay
        // conexión, se suben a la nube. Se llama al terminar cada partida.
        function saveProfile() {
            if (!S.accSession) return Promise.resolve({ saved: false, local: false });
            const data = snapshotData();
            const local = loadProfilesLocal();
            let i = -1;
            for (let j = 0; j < local.length; j++) if (local[j].id === S.accSession.id) i = j;
            if (i < 0) return Promise.resolve({ saved: false, local: false });

            const me = Object.assign({}, local[i], { data: data, last: new Date().toISOString() });
            saveProfilesLocal(upsertProfile(local, me));

            return fetchProfiles()
                .catch(err => {
                    if (err && err.notFound) return [];
                    throw err;
                })
                .then(remote => pushProfiles(upsertProfile(remote, me)))
                .then(() => ({ saved: true, local: false }))
                .catch(() => ({ saved: false, local: true }));
        }

        // ---------- Roles de usuario ----------
        // Alvaro tiene el rol de ADMINISTRADOR: dinero infinito para poder
        // probarlo todo. El rol se reconoce por el nombre de la cuenta o por
        // el nombre del jugador, normalizados con nameKey() (sin acentos y en
        // minúsculas), así que «Alvaro», «ÁLVARO» o «alvaro» valen igual.
        const ADMIN_NAMES = ["alvaro"];

        function esAdmin() {
            if (S.accSession && ADMIN_NAMES.indexOf(nameKey(S.accSession.n)) >= 0) return true;
            return ADMIN_NAMES.indexOf(nameKey(loadPlayerName())) >= 0;
        }

        // Cómo se pintan las cantidades de dinero en pantalla: los
        // administradores ven ∞ porque pueden comprar lo que quieran sin
        // gastar. Su saldo real no se toca: solo se oculta el número.
        function fmtCoins(n) {
            return esAdmin() ? "∞" : String(n);
        }

        // ---------- Panel de cuenta ----------
        // (El panel se dibuja solo leyendo G: aquí solo queda su lógica)
        function setAccMsg(key, warn) {
            S.accMsgTxt = key ? t(key) : "";
            S.accMsgWarn = !!warn;
        }

        function openAccount(mode) {
            if (S.state === "playing") return;
            if (mode && mode !== S.accMode) {
                S.accMode = mode;
                if (accPass2) accPass2.value = "";
                setAccMsg("", false);
            }
            S.accOpen = true;
            if (perfil.scrollIntoView) perfil.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        function closeAccount() {
            S.accOpen = false;
        }

        function toggleAccount(mode) {
            if (S.state === "playing") return;
            if (S.accOpen && (!mode || mode === S.accMode)) closeAccount();
            else openAccount(mode);
        }

        function closeAccountOnPlay() {
            if (S.accOpen) closeAccount();
        }

        // Cambia entre registro y entrada dentro del panel de perfil
        function accSwitchMode() {
            S.accMode = S.accMode === "reg" ? "login" : "reg";
            if (accPass2) accPass2.value = "";
            setAccMsg("", false);
        }

        // «Guardar ahora»: sube el progreso a la nube estando ya dentro
        function accSaveProfile() {
            if (!S.accSession) { setAccMsg("accNoSession", true); return; }
            setAccMsg("accSaving", false);
            saveProfile().then(res2 => {
                setAccMsg(res2.saved ? "accSaved" : (res2.local ? "accSavedLocal" : "accNoSession"),
                    !res2.saved && !res2.local);
            });
        }

        // ---------- Registrar / entrar / salir ----------
        function finishAccount(res) {
            S.accBusy = false;
            return res;
        }

        function accountFail(key) {
            finishAccount({ ok: false, key: key });
            setAccMsg(key, true);
            return { ok: false, key: key };
        }

        function doRegister(name, pass, pass2) {
            if (S.accBusy) return Promise.resolve({ ok: false, key: "accExists" });
            if (!name || !nameOk(name)) return Promise.resolve(accountFail("accNameBad"));
            if ((pass || "").length < PASS_MIN) return Promise.resolve(accountFail("accPassShort"));
            if (pass !== pass2) return Promise.resolve(accountFail("accPassDiff"));

            S.accBusy = true;
            setAccMsg("accSaving", false);

            const id = profileId(name);
            const salt = makeSalt();
            const hash = derivePass(pass, salt);
            const record = {
                id: id, n: name, salt: salt, hash: hash,
                d: new Date().toISOString(), last: "", data: snapshotData()
            };

            return profilesStage().then(stage => {
                if (findProfile(stage.users, name)) throw { key: "accExists" };
                if (findProfile(loadProfilesLocal(), name)) throw { key: "accExists" };
                // El nombre también se reserva para el ranking: así tu puntuación
                // y tu cuenta comparten el mismo nombre y el mismo identificador.
                return reserveName(name, id).then(res => {
                    if (res && res.taken) throw { key: "accExists" };
                    if (stage.offline) {
                        saveProfilesLocal(upsertProfile(loadProfilesLocal(), record));
                        throw { key: "accSavedLocal", ok: true };
                    }
                    const next = upsertProfile(stage.users, record);
                    return pushProfiles(next).then(() => next)
                        .catch(() => {
                            saveProfilesLocal(upsertProfile(loadProfilesLocal(), record));
                            throw { key: "accSavedLocal", ok: true };
                        });
                });
            }).then(() => {
                saveProfilesLocal(upsertProfile(loadProfilesLocal(), record));
                S.accSession = { id: id, n: name };
                saveSession(S.accSession);
                savePlayerName(name);
                if (accPass) accPass.value = "";
                if (accPass2) accPass2.value = "";
                finishAccount({ ok: true, key: "accCreated" });
                setAccMsg("accCreated", false);
                refreshRanking();
                return { ok: true, key: "accCreated" };
            }).catch(err => {
                if (err && err.ok) {   // cuenta creada solo en este dispositivo
                    S.accSession = { id: id, n: name };
                    saveSession(S.accSession);
                    savePlayerName(name);
                    if (accPass) accPass.value = "";
                    if (accPass2) accPass2.value = "";
                    finishAccount({ ok: true, key: err.key });
                    setAccMsg(err.key, false);
                    refreshRanking();
                    return { ok: true, key: err.key };
                }
                return accountFail(err && err.key ? err.key : "accExists");
            });
        }

        function doLogin(name, pass) {
            if (S.accBusy) return Promise.resolve({ ok: false, key: "accNoUser" });
            if (!name || !nameOk(name)) return Promise.resolve(accountFail("accNameBad"));
            if (!pass) return Promise.resolve(accountFail("accPassShort"));

            S.accBusy = true;
            setAccMsg("accSaving", false);

            return profilesStage().then(stage => {
                const u = findProfile(stage.users, name);
                if (!u) throw { key: "accNoUser", offline: stage.offline };
                if (derivePass(pass, u.salt) !== u.hash) throw { key: "accBadPass" };
                // Se queda la copia local de esta cuenta para poder entrar sin internet
                saveProfilesLocal(upsertProfile(stage.users, u));
                S.accSession = { id: u.id, n: u.n };
                saveSession(S.accSession);
                savePlayerName(u.n);
                applyData(u.data);
                if (accPass) accPass.value = "";
                if (accPass2) accPass2.value = "";
                finishAccount({ ok: true, key: "accLoggedIn" });
                setAccMsg("accLoggedIn", false);
                refreshRanking();
                return { ok: true, key: "accLoggedIn", name: u.n };
            }).catch(err => {
                if (err && err.ok) return err;
                return accountFail(err && err.key ? err.key : "accNoUser");
            });
        }

        function doLogout() {
            if (S.accBusy) return Promise.resolve({ ok: false });
            // Antes de salir se guardan los datos conseguidos hasta ahora
            return saveProfile().then(() => {
                S.accSession = null;
                saveSession(null);
                setAccMsg("accLoggedOut", false);
                refreshRanking();
                return { ok: true, key: "accLoggedOut" };
            });
        }

        function submitAccount() {
            const name = cleanName(accName ? accName.value : "");
            const pass = accPass ? accPass.value : "";
            if (S.accMode === "reg") {
                doRegister(name, pass, accPass2 ? accPass2.value : "");
            } else {
                doLogin(name, pass);
            }
        }

        // (los clics del panel de cuenta los llaman los componentes vía G.a)

        // ---------- Verificación humana antes de guardar ----------
        // Código aleatorio de 4 caracteres que hay que escribir con teclas REALES.
        // La comprobación no mira el texto del campo (eso lo rellena un script en
        // un pistoletazo), sino las pulsaciones que han ido quedando registradas:
        // pegar el texto o rellenarlo con eventos sintéticos no sirve de nada.
        const VERIFY_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

        function newVerifyCode() {
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
            verifyTyped = "";
            if (verifyInput) verifyInput.value = "";
        }

        function verifyHuman() {
            if (!S.verifyCode) return false;
            return verifyTyped.trim().toLowerCase() === S.verifyCode.toLowerCase();
        }

        // Los eventos del campo de verificación llegan por la vista (G.a.verify*):
        // solo cuentan las teclas REALES — ni pegar ni rellenar por script valen
        function verifyKey(e) {
            if (e.isTrusted && typeof e.key === "string") {
                if (e.key === "Backspace") verifyTyped = verifyTyped.slice(0, -1);
                else if (e.key.length === 1 && verifyTyped.length < 8) verifyTyped += e.key;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                saveScore();
            }
        }

        // Teclados virtuales (móvil): a veces no informan de la tecla pulsada
        // pero sí del texto que ha escrito la persona. Manda el valor real
        // del campo, que solo puede llenarse tecleando (pegar está bloqueado).
        function verifyInputText(e) {
            if (e && e.isTrusted) {
                verifyTyped = String(verifyInput.value || "").slice(0, 8);
            }
        }

        // Pegar el código tampoco vale: hay que teclearlo
        function verifyPaste(e) {
            e.preventDefault();
            S.rankMsgOff = true;
            S.rankMsgTxt = t("rankHuman");
        }

        // ---------- Control de escritura automática ----------
        // ¿Se está ejecutando en un navegador automatizado (Selenium, Puppeteer,
        // Playwright, headless, PhantomJS…)? Si es así, no se sube nada.
        function automationSpotted() {
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
        function checkAutoPlay(estado) {
            const val = (v, def) => (typeof v === "number" && isFinite(v)) ? v : def;
            const es = estado || {};
            const sc = val(es.score, S.score);
            const cp = val(es.completed, S.completed);
            const ht = val(es.hits, hits);
            const ie = val(es.inputEvents, inputEvents);
            const ti = val(es.trustedInput, trustedInput);
            const tk = val(es.trustedKeys, trustedKeys);
            const pt = val(es.pasteTried, pasteTried);
            const du = val(es.duracion, gameDuration);
            const ks = Array.isArray(es.keyStamps) ? es.keyStamps : keyStamps;
            const auto = (typeof es.automatizado === "boolean")
                ? es.automatizado : automationSpotted();

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
            const ganado = val(es.tiempoExtra, aventura ? advTimeGained : 0);
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

        // Descarga el ranking de la web y lo mezcla con la copia local.
        // Sin argumento se refrescan las dos tablas (global y Aventura).
        function refreshRanking(tab) {
            const tabs = tab ? [tab] : RANK_TABS;
            return Promise.all(tabs.map(refreshRankTab));
        }

        function refreshRankTab(tab) {
            const data = rankData[tab];
            const local = loadLocalRanking(tab);
            return fetchResets().then(() => fetchRanking(tab))
                .then(remote => {
                    data.online = true;
                    data.entries = normalizeRank(remote.concat(local), null, tab);
                    saveLocalRanking(data.entries, tab);  // purga marcas reiniciadas
                })
                .catch(() => {
                    data.online = false;
                    data.entries = normalizeRank(local, null, tab);
                    saveLocalRanking(data.entries, tab);
                })
                .then(() => {
                    data.loaded = true;
                });
        }

        // Sube la puntuación al ranking de todos los jugadores.
        // Primero se guarda en local (nunca se pierde) y luego se reintenta la subida.
        // La tabla es la de su modo: una marca de Aventura jamás entra en el
        // ranking global ni al revés.
        function uploadScore(entry) {
            const tab = rankTabOf(entry.m);
            const data = rankData[tab];
            data.online = false;
            data.loaded = true;

            function attempt(triesLeft, fusiones) {
                const rep = fusiones || 0;
                return fetchRanking(tab)
                    .catch(err => {
                        // Solo el 404 ("todavía no hay documento") permite
                        // recrearlo con lo local. Un error de red o del servidor
                        // NO: en ese caso se propaga y no se sube nada todavía,
                        // para no borrar las marcas de los demás jugadores.
                        if (err && err.notFound) return [];
                        throw err;
                    })
                    .then(remote => {
                        const base = normalizeRank(remote, null, tab);
                        const merged = normalizeRank(
                            remote.concat(loadLocalRanking(tab), [entry]), null, tab);
                        // Red de seguridad: la subida nunca puede perder marcas
                        // que sí estaban en el servidor (si no caben en el top
                        // 10, merged.length ya es RANK_MAX y no se cumple esto).
                        if (base.length > merged.length && merged.length < RANK_MAX) {
                            throw new Error("merge-unsafe");
                        }
                        return pushRanking(merged, tab).then(() => {
                            data.entries = merged;
                            saveLocalRanking(merged, tab);
                            data.online = true;
                            // Si alguien subió a la vez y alguna marca del
                            // servidor ha desaparecido, se vuelve a fusionar.
                            if (rep >= 2) return undefined;
                            return fetchRanking(tab)
                                .then(r2 => {
                                    const aqui = normalizeRank(
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
            }

            return fetchResets().then(() => {
                data.entries = normalizeRank(
                    loadLocalRanking(tab).concat([entry]), null, tab);
                saveLocalRanking(data.entries, tab);   // purga las marcas reiniciadas
                return attempt(2);
            });
        }

        function rankDate(iso) {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return "";
            try {
                return d.toLocaleDateString(uiLang() === "es" ? "es-ES" : "en-GB");
            } catch (e) {
                return d.toLocaleDateString();
            }
        }

        // Dibuja las dos tablas: la global (modos clásicos) y la de Aventura.
        // Ambas muestran los MISMOS datos: posición, nombre, puntos, palabras
        // y fecha; solo cambia el documento del que salen las filas.
        // (Las dos tablas de ranking las pinta Svelte desde G.rank; aquí
        //  solo queda abrir/cerrar el panel y refrescar los datos)
        function toggleRanking(tab) {
            if (S.state === "playing") return;
            S.rankOpen = !S.rankOpen;
            if (S.rankOpen) {
                refreshRanking();
                // Si se guarda una marca, su tabla se resalta (una partida de
                // Aventura se mira en el ranking de Aventura, no en el global)
                if (tab) S.rankFocus = tab;
                // El panel queda por debajo: se lleva a la vista para que se note
                if (ranking.scrollIntoView) {
                    ranking.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
        }

        // ---------- Monedas y tienda: persistencia ----------
        function loadShop() {
            try {
                S.coins = parseInt(storage.get("teclear.monedas") || "0", 10) || 0;
                const o = storage.getJSON("teclear.estilos", null);
                if (Array.isArray(o) && o.length) S.owned = o;
                const eq = storage.get("teclear.estilo");
                if (eq && S.owned.includes(eq)) S.equipped = eq;
                const ob = storage.getJSON("teclear.fondos", null);
                if (Array.isArray(ob) && ob.length) {
                    S.ownedBgs = ob;
                } else if (storage.get("teclear.fondos") === null &&
                           storage.get("teclear.fondo") === "franco") {
                    // Migración: quien ya usaba el fondo de Franco antes de la tienda lo conserva
                    S.ownedBgs = ["dark", "franco"];
                }
                const ex = storage.getJSON("teclear.extras", null);
                if (Array.isArray(ex)) S.ownedExtras = ex;
                const rawOn = storage.get("teclear.extrasOn");
                if (rawOn) {
                    const eo = JSON.parse(rawOn);
                    if (eo && typeof eo === "object") S.extraOn = eo;
                } else if (storage.get("teclear.picante") === "1") {
                    S.extraOn.picante = true;   // clave antigua del modo picante
                }
                const fo = storage.getJSON("teclear.efectosTecleo", null);
                if (Array.isArray(fo)) S.ownedFx = fo;
                const feq = storage.get("teclear.efectoTecleo");
                if (feq) S.fxEquipped = feq;
            } catch (e) {
                S.coins = 0;
                S.owned = ["clasico"];
                S.equipped = "clasico";
                S.ownedBgs = ["dark"];
                S.ownedExtras = [];
                S.extraOn = { picante: false, caos: false, php: false, espejo: false, andaluz: false, azar: false, cubico: false };
                extraRun = null;
                S.ownedFx = [];
                S.fxEquipped = "";
            }
            if (!S.owned.includes("clasico")) S.owned.push("clasico");
            if (!S.ownedBgs.includes("dark")) S.ownedBgs.push("dark");
            // Solo se admiten extras conocidos y comprados: nada de marcas raras
            S.ownedExtras = S.ownedExtras.filter(id => EXTRAS.some(x => x.id === id));
            EXTRAS.forEach(x => {
                if (!S.ownedExtras.includes(x.id)) S.extraOn[x.id] = false;
                S.extraOn[x.id] = !!S.extraOn[x.id];
            });
            // Mismo criterio para los efectos de tecleo: solo los comprados
            S.ownedFx = S.ownedFx.filter(id => TYPE_EFFECTS.some(f => f.id === id));
            if (!S.ownedFx.includes(S.fxEquipped)) S.fxEquipped = "";
        }

        function saveShop() {
            try {
                storage.set("teclear.monedas", String(S.coins));
                storage.setJSON("teclear.estilos", S.owned);
                storage.set("teclear.estilo", S.equipped);
                storage.setJSON("teclear.fondos", S.ownedBgs);
                storage.setJSON("teclear.extras", S.ownedExtras);
                storage.setJSON("teclear.extrasOn", S.extraOn);
                storage.set("teclear.picante", S.extraOn.picante ? "1" : "0");
                storage.setJSON("teclear.efectosTecleo", S.ownedFx);
                storage.set("teclear.efectoTecleo", S.fxEquipped);
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // ---------- Caramelos: la moneda del evento de Halloween ----------
        // Se cargan y se guardan aparte del dinero normal; si el
        // almacenamiento falla, a cero. Nunca bajan de 0.
        function loadCandy() {
            try {
                S.caramelos = parseInt(storage.get("teclear.caramelos") || "0", 10) || 0;
            } catch (e) { S.caramelos = 0; }
            if (S.caramelos < 0) S.caramelos = 0;
        }

        function saveCandy() {
            try {
                storage.set("teclear.caramelos", String(S.caramelos));
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // Los caramelos en pantalla: ∞ para el Administrador, como el dinero
        function fmtCandy(n) {
            return esAdmin() ? "∞" : String(n);
        }

        // Suma (o resta) caramelos. El contador nunca baja de cero: fallar
        // con 0 caramelos en el modo Encantado NO mueve el número.
        function giveCandy(n) {
            if (!n) return;
            const antes = Math.max(0, S.caramelos);
            S.caramelos = Math.max(0, S.caramelos + n);
            // La partida actual apunta el saldo neto para los resultados
            if (S.state === "playing") S.candyRun += S.caramelos - antes;
            saveCandy();
        }

        // Cobra el precio de un artículo de la tienda. Los artículos del
        // EVENTO se pagan en CARAMELOS (con la misma cifra que costaban en
        // monedas); el resto, en monedas. El Administrador no gasta.
        function cobra(item) {
            const ev = !!item.event;
            const saldo = ev ? S.caramelos : S.coins;
            if (!esAdmin() && saldo < item.price) {
                S.shopMsgTxt = ev ? t("shopNoCandy") : t("shopNoMoney");
                return false;
            }
            if (esAdmin()) return true;
            if (ev) {
                S.caramelos = Math.max(0, S.caramelos - item.price);   // se pagan en caramelos
                saveCandy();
            } else {
                S.coins -= item.price;                              // se pagan en monedas
            }
            return true;
        }

        // Otorga monedas por cada palabra completada sin errores.
        // La cantidad sube con la racha (x1 … x5), igual que los puntos
        function giveCoins(n) {
            S.coins += n;
            S.coinsRun += n;
            // Logro «Shinyy»: cuenta el dinero ganado en TOTAL, sumando lo
            // que entra (gastar en la tienda no resta del progreso)
            achAdd("shinyy", n);
            // Caramelos del evento: se ganan en TODOS los modos junto a las
            // monedas y con la MISMA cantidad (los gasta la tienda de evento)
            giveCandy(n);
            saveShop();
        }

        function styleById(id) {
            return FONT_STYLES.find(s => s.id === id) || FONT_STYLES[0];
        }

        // Aplica el estilo equipado al tablero y a la entrada
        function applyStyle() {
            const st = styleById(S.equipped);
            FONT_STYLES.forEach(s => document.body.classList.remove(s.cls));
            document.body.classList.add(st.cls);
        }

        function setEquipped(id) {
            if (!S.owned.includes(id)) return;
            S.equipped = id;
            saveShop();
            applyStyle();
            invSay(t("shopEquippedMsg"));
        }

        function buyStyle(st) {
            if (S.owned.includes(st.id)) return;   // ya está en el Inventario
            // Los estilos ganados con un logro no se compran con monedas
            if (st.ach) {
                S.shopMsgTxt = t("achNeed");
                return;
            }
            if (!esAdmin() && S.coins < st.price) {
                S.shopMsgTxt = t("shopNoMoney");
                return;
            }
            if (!esAdmin()) S.coins -= st.price;   // el Administrador no gasta
            S.owned.push(st.id);
            // La compra solo DESBLOQUEA: quién se pone se elige en el Inventario
            saveShop();
            S.shopMsgTxt = t("shopBought");
        }

        // ---------- Extras de juego (picante, caos, php…) ----------
        // Cada extra comprado pasa a ser una variante del modo Tecleo y se
        // elige en el menú desplegable de al lado del botón "⌨️ Tecleo".
        function ownsExtra(id) {
            return S.ownedExtras.includes(id);
        }

        function extraActive(id) {
            // Los extras de la tienda son variantes del modo Tecleo: fuera de
            // él no actúan (ni en Adivinar, ni en Imágenes, ni en Aventura,
            // ni en Supervivencia), aunque sigan elegidos en el menú
            if (S.mode !== "type") return false;
            if (!ownsExtra(id)) return false;
            // Durante una partida el Modo Al azar manda sobre extraOn
            if (extraRun) return !!extraRun[id];
            return !!S.extraOn[id];
        }

        // Extra elegido en el desplegable ("", si se juega al Tecleo clásico).
        // Manda el gusto guardado (extraOn), no si ahora actúa: el menú sigue
        // enseñando la variante elegida aunque el modo actual no sea Tecleo.
        function activeExtraId() {
            const x = EXTRAS.find(e => ownsExtra(e.id) && S.extraOn[e.id]);
            return x ? x.id : "";
        }

        // ---------- Variante del modo Supervivencia ----------
        // "Clásico" es la supervivencia de siempre (palabras que bajan) y
        // "Encantado" es la variante del evento: letras con fantasmas que
        // solo dan caramelos. Se elige en el desplegable de al lado del
        // botón "🛡️ Supervivencia", igual que las variantes de Tecleo.
        function encOn() {
            return S.mode === "supervivencia" && S.supVariant === "encantado";
        }

        function setSupVariant(v) {
            if (S.state === "playing") return;
            S.supVariant = (v === "encantado" && halloweenOn()) ? "encantado" : "clasico";
            try {
                storage.set("teclear.supVariante", S.supVariant);
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // Marca en el body qué extras actúan ahora (ilumina el tablero)
        function applyExtras() {
            EXTRAS.forEach(x => {
                document.body.classList.toggle(x.id + "-on", extraActive(x.id));
            });
        }

        function setExtra(id, on) {
            if (!ownsExtra(id) || S.state === "playing") return;
            // Solo una variante activa: usar una apaga las demás
            if (on) {
                EXTRAS.forEach(x => S.extraOn[x.id] = (x.id === id));
            } else {
                S.extraOn[id] = false;
            }
            saveShop();
            applyExtras();
            const x = EXTRAS.find(e => e.id === id);
            if (x) invSay(t(on ? x.msgOn : x.msgOff));
        }

        // Solo puede haber una variante de Tecleo activa a la vez: al elegir
        // una en el menú se apagan las demás
        function chooseExtra(id) {
            if (S.state === "playing") return;
            EXTRAS.forEach(x => S.extraOn[x.id] = (x.id === id));
            saveShop();
            applyExtras();
            const x = EXTRAS.find(e => e.id === id);
            S.shopMsgTxt = x ? t(x.msgOn) : t("modeClassicMsg");
        }

        function buyExtra(x) {
            if (ownsExtra(x.id)) return;   // ya está en el Inventario
            if (!cobra(x)) return;
            S.ownedExtras.push(x.id);
            // La compra solo DESBLOQUEA: activarla se hace en el Inventario
            saveShop();
            applyExtras();     // el nuevo extra entra en el menú de variantes
            S.shopMsgTxt = t(x.msgBuy);
        }

        // ---------- Efectos de tecleo (chispas con cada letra) ----------
        function fxById(id) {
            return TYPE_EFFECTS.find(f => f.id === id) || null;
        }

        function ownsFx(id) {
            return !!id && S.ownedFx.includes(id);
        }

        // El efecto comprado y puesto en uso (null si no hay ninguno)
        function activeFx() {
            const f = fxById(S.fxEquipped);
            return f && ownsFx(f.id) ? f : null;
        }

        // Deja el color del efecto activo en <body>: ahí lo cogen el
        // resplandor del campo de entrada y las tarjetas de la tienda
        function applyFx() {
            TYPE_EFFECTS.forEach(f => {
                document.body.classList.toggle("fx-" + f.id, !!activeFx() && S.fxEquipped === f.id);
            });
        }

        // Pone un efecto en uso (id vacío lo apaga); solo uno a la vez.
        // Como la tienda ya no selecciona, esta acción vive en el Inventario
        function setFx(id) {
            if (S.state === "playing") return;
            if (id && !ownsFx(id)) return;
            S.fxEquipped = id || "";
            saveShop();
            applyFx();
            invSay(t(S.fxEquipped ? "shopEquippedFxMsg" : "shopDeactivatedFxMsg"));
        }

        function buyFx(f) {
            // Los efectos ganados con un logro no se compran con monedas
            if (f.ach || ownsFx(f.id)) return;   // ya está en el Inventario
            if (!cobra(f)) return;
            S.ownedFx.push(f.id);
            // La compra solo DESBLOQUEA: ponerlo en uso se hace en el Inventario
            saveShop();
            S.shopMsgTxt = t("shopBoughtFx");
        }

        // ---------- Evento de Halloween: temática y tienda de evento ----------
        // La tienda de evento solo existe mientras dura el evento (8 de
        // octubre – 3 de noviembre): tres tarjetas exclusivas que reutilizan
        // la compra de su sección normal (fondo, efecto de tecleo y modo de
        // juego). Al terminar el evento la sección se cierra sola y los
        // artículos comprados siguen en sus secciones normales, desbloqueados.
        let halloweenTimer = null;   // cuenta atrás del evento

        // Viste de Halloween la página según la fecha (barra de evento,
        // caramelos y tienda de evento las muestra Svelte leyendo G.halloween)
        function applyHalloween() {
            S.halloween = halloweenOn();
            document.body.classList.toggle("halloween", S.halloween);
            // Al acabar el evento desaparece la variante Encantada del menú
            if (S.supVariant === "encantado" && !S.halloween && S.state !== "playing") {
                S.supVariant = "clasico";
            }
            if (S.halloween) {
                tickHalloween();
                // Si el evento termina con la página abierta, la barra y la
                // tienda de evento se cierran solas en el próximo segundo
                if (!halloweenTimer) halloweenTimer = setInterval(tickHalloween, 1000);
            }
        }

        // Cuenta atrás hasta el final del evento (3 de noviembre a las 12:00)
        function tickHalloween() {
            const ahora = new Date();
            if (!halloweenOn(ahora)) {
                clearInterval(halloweenTimer);
                halloweenTimer = null;
                applyHalloween();            // se apaga la temática…
                return;
            }
            const fin = eventEndDate(ahora.getFullYear());
            const ms = fin - ahora;
            const d = Math.floor(ms / 86400000);
            const h = Math.floor((ms % 86400000) / 3600000);
            const m = Math.floor((ms % 3600000) / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            S.eventCountTxt = "⏳ " + d + "d " + h + "h " + m + "m " + s + "s";
        }

        function toggleShop() {
            if (S.state === "playing") return;
            S.shopOpen = !S.shopOpen;
            if (S.shopOpen) S.shopMsgTxt = "";
        }

        // ---------- Logros: progreso, recompensas y panel ----------
        // Cada logro lleva su propio progreso (guardado en localStorage).
        // Al completarlo se entrega su recompensa: un efecto de tecleo que
        // no está a la venta en la tienda, solo se gana jugando.
        function achLoad() {
            try {
                const raw = storage.getJSON("teclear.logros", null);
                if (raw && typeof raw === "object") S.achData = raw;
            } catch (e) { /* sin almacenamiento disponible */ }

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
            achSave();
            // Un logro completado que hubiera perdido su recompensa la recupera
            ACHIEVEMENTS.forEach(a => {
                if (S.achData[a.id].done) grantAchReward(a, true);
            });
        }

        function achSave() {
            try {
                storage.setJSON("teclear.logros", S.achData);
            } catch (e) { /* sin almacenamiento disponible */ }
        }

        // Nombre de la recompensa, en el idioma vigente
        function rewardLabel(ach) {
            return uiLang() === "es" ? ach.rewardEs : ach.rewardEn;
        }

        // Números grandes con su separador de miles (1.000.000 / 1,000,000)
        function fmtNum(n) {
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
        function grantAchReward(ach, silent) {
            const r = ach.reward;
            if (!r) return;

            if (r.type === "fx") {
                const nuevo = !S.ownedFx.includes(r.id);
                if (nuevo) S.ownedFx.push(r.id);
                if (nuevo || !ownsFx(S.fxEquipped)) {
                    S.fxEquipped = r.id;
                    saveShop();
                    applyFx();
                }
            } else if (r.type === "font") {
                if (!S.owned.includes(r.id)) {
                    S.owned.push(r.id);
                    S.equipped = r.id;    // recién ganado: sale aplicado
                    saveShop();
                    applyStyle();
                }
            } else if (r.type === "bg") {
                if (!S.ownedBgs.includes(r.id)) {
                    S.ownedBgs.push(r.id);
                    saveShop();
                }
            }

            if (!silent) showAchToast(ach);
        }

        // Aviso emergente de un logro recién desbloqueado
        function showAchToast(ach) {
            const toast = document.createElement("div");
            toast.className = "ach-toast";
            toast.setAttribute("role", "status");

            const icon = document.createElement("span");
            icon.className = "ach-toast-icon";
            icon.textContent = ach.icon;

            const txt = document.createElement("span");
            txt.textContent = t("achToast") + (uiLang() === "es" ? ach.es : ach.en) +
                t("achToastEnd") + rewardLabel(ach);

            toast.append(icon, txt);
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5200);
        }

        // Sube el progreso de un logro y lo completa si llega a su meta
        function achAdd(id, n) {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            const d = S.achData[id];
            if (!ach || !d || d.done) return;
            achSetP(ach, d, d.p + n);
        }

        // Anota una marca (por ejemplo la mejor puntuación de una partida o
        // las palabras escritas en 8 segundos): el progreso nunca baja, solo
        // se guarda el mejor intento.
        function achBest(id, p) {
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            const d = S.achData[id];
            if (!ach || !d || d.done) return;
            if (p <= d.p) return;
            achSetP(ach, d, p);
        }

        // Fija el progreso de un logro, lo guarda y lo completa si llega a su meta
        function achSetP(ach, d, p) {
            d.p = Math.max(0, Math.min(ach.goal, Math.floor(p)));
            const completo = d.p >= ach.goal;
            if (completo) d.done = true;
            achSave();
            if (completo) grantAchReward(ach, false);
        }

        function toggleLogros() {
            if (S.state === "playing") return;
            S.logrosOpen = !S.logrosOpen;
            if (S.logrosOpen && logros.scrollIntoView) {
                // El panel queda por debajo: se lleva a la vista para que se note
                logros.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }

        // El panel de logros se cierra al empezar una partida
        function closeLogrosOnPlay() {
            if (!S.logrosOpen) return;
            S.logrosOpen = false;
        }

        // ---------- Inventario: todo lo comprado y todo lo ganado ----------
        // El inventario no guarda datos aparte: se recalcula a partir de lo
        // que ya posees (estilos, fondos, extras y efectos), así que nunca
        // se queda desfasado. Para saber de dónde sale cada artículo se
        // comprueba su definición: los marcados con "ach" son recompensas
        // de logros y el resto se compran en la tienda. Se enseñan también
        // los artículos del EVENTO de Halloween que ya poseas, aunque la
        // tienda de evento esté cerrada: el inventario es para siempre.
        // Además es aquí donde se SELECCIONA lo que está en uso, porque la
        // tienda ya solo compra.

        // Aviso del panel: los mensajes de «elegir artículo» van aquí (la
        // tienda se queda los de compra)
        function invSay(txt) {
            S.invMsgTxt = txt;
        }

        // Devuelve la lista completa de artículos con su estado:
        // { tipo, id, nombre, icono, img, enUso, deLogro, event, usar, apagar }
        function invItems() {
            const en = uiLang() === "en";
            const out = [];

            FONT_STYLES.forEach(s => {
                if (!S.owned.includes(s.id)) return;
                out.push({
                    tipo: "font", id: s.id,
                    nombre: en ? s.en : s.es,
                    icono: "🔤", img: "", previewFont: s.font, cls: s.cls,
                    enUso: S.equipped === s.id,
                    deLogro: !!s.ach, event: false,
                    // Un estilo nunca se apaga: siempre hay alguno puesto
                    usar: () => setEquipped(s.id), apagar: null
                });
            });

            BACKGROUNDS.forEach(b => {
                if (!S.ownedBgs.includes(b.id)) return;
                out.push({
                    tipo: "bg", id: b.id,
                    nombre: en ? b.en : b.es,
                    icono: b.icon || "🖼️",
                    // Con el Modo Veyon, «General» e «Ia» enseñan la imagen de
                    // repuesto, igual que en la tienda y en el selector
                    img: veyonHiddenBg(b.id) ? VEYON_PLACEHOLDER : b.img,
                    enUso: S.bg === b.id,
                    deLogro: !!b.ach, event: !!b.event,
                    // Igual que los estilos: siempre hay un fondo puesto
                    usar: () => setBgEquipped(b.id), apagar: null
                });
            });

            EXTRAS.forEach(x => {
                if (!S.ownedExtras.includes(x.id)) return;
                out.push({
                    tipo: "extra", id: x.id,
                    nombre: en ? x.en : x.es,
                    icono: x.icon, img: "",
                    enUso: !!S.extraOn[x.id],
                    deLogro: !!x.ach, event: !!x.event,
                    // Un extra sí se apaga: vuelve el Tecleo clásico
                    usar: () => setExtra(x.id, true),
                    apagar: () => setExtra(x.id, false)
                });
            });

            TYPE_EFFECTS.forEach(f => {
                if (!S.ownedFx.includes(f.id)) return;
                out.push({
                    tipo: "fx", id: f.id,
                    nombre: en ? f.en : f.es,
                    icono: f.icon, img: "", art: f.art,
                    enUso: S.fxEquipped === f.id,
                    deLogro: !!f.ach, event: !!f.event,
                    // Un efecto también se apaga: sin chispas al teclear
                    usar: () => setFx(f.id),
                    apagar: () => setFx("")
                });
            });

            return out;
        }

        function toggleInv() {
            if (S.state === "playing") return;
            S.invOpen = !S.invOpen;
            if (S.invOpen) {
                S.invMsgTxt = "";   // aviso de la acción anterior
                // El panel queda por debajo: se lleva a la vista para que se note
                if (inventario.scrollIntoView) {
                    inventario.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
        }

        // El panel de inventario se cierra al empezar una partida
        function closeInvOnPlay() {
            if (!S.invOpen) return;
            S.invOpen = false;
        }

        // ---------- Idioma y modo ----------
        // applyLang ya no repinta la interfaz (eso lo hace Svelte leyendo G):
        // solo sincroniza lo que vive fuera de los componentes — el <html>,
        // las clases de fondo del <body>, los canvas y los récords cargados.
        function applyLang() {
            document.documentElement.lang = uiLang();
            document.title = t("docTitle");

            // En Aventura no se juega con fondos: el cuerpo lleva el fondo
            // propio del modo (sin habilidad)
            const sinFondos = S.mode === "aventura";
            BACKGROUNDS.forEach(b => {
                document.body.classList.toggle("bg-" + b.id, !sinFondos && S.bg === b.id);
            });
            document.body.classList.toggle("bg-aventura", sinFondos);
            syncLetterSoup(!sinFondos && S.bg === "sopa");   // letras rebotando solo con ese fondo
            syncHacker(!sinFondos && S.bg === "hacker");     // binario verde solo con ese fondo

            S.best = loadBest();
            S.bestWords = loadBestWords();
            applyExtras();   // acento de color de los extras activos

            // Textos según el estado actual de la partida
            if (S.state === "idle") {
                S.statusTxt = t("statusIdle");
                S.startTxt = t("btnStart");
            } else if (S.state === "over") {
                S.statusTxt = t("statusEnd");
                S.startTxt = t("btnAgain");
            }

            applyHalloween();   // temática del evento (solo en Halloween)
        }

        function setLang(next) {
            if (S.lang === next || S.state === "playing") return;
            S.lang = next;
            applyLang();
        }

        function setMode(next) {
            if (S.mode === next || S.state === "playing") return;
            S.mode = next;
            applyLang();
        }

        // (los botones de idioma, modo y fondo llaman a G.a.setX desde la vista)

        // ---------- Fondo de pantalla ----------
        function setBg(next) {
            // La habilidad del fondo no se puede cambiar a mitad de partida
            if (S.state === "playing" || S.bg === next || !S.ownedBgs.includes(next)) return;
            S.bg = next;
            try {
                storage.set("teclear.fondo", S.bg);
            } catch (e) { /* sin almacenamiento disponible */ }
            applyLang();
        }

        // ---------- Modo Veyon ----------
        // El botón «Modo Veyon» oculta el icono de estesoTeclea (el logo de
        // la cabecera) y las imágenes de los fondos «General» (franco) e
        // «Ia» (esteso): se ve el fondo liso de la página. Solo se tapa la
        // vista, así que la habilidad de cada fondo sigue actuando.
        // ¿Este fondo se tapa con el Modo Veyon?
        function veyonHiddenBg(id) {
            return S.veyon && VEYON_BGS.includes(id);
        }

        function applyVeyon() {
            document.body.classList.toggle("veyon-on", S.veyon);
            // Icono de la ventana (pestaña): con el modo activo deja de
            // verse el de estesoTeclea y se pone el de repuesto
            document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')
                .forEach(l => { l.href = S.veyon ? VEYON_FAVICON : imgLogo; });
        }

        function setVeyon(next) {
            S.veyon = !!next;
            setSetting("veyon", S.veyon);
            applyVeyon();
        }

        // ---------- Fondo "Sopa de Letras": letras que rebotan ----------
        // Un lienzo fijo, por detrás de todo el contenido, lleno de teclas
        // sueltas: cada letra se mueve y rebota contra las demás y contra
        // los bordes de la ventana. Solo funciona con este fondo activo.
        const SOUP_CHARS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789";
        const SOUP_COLORS = ["#5eead4", "#14b8a6", "#ffd76a", "#f0abfc", "#3882f6", "#e8ecf4"];
        const SOUP_SPEED = 62;        // velocidad base (píxeles/segundo)
        const SOUP_DENSITY = 26000;   // píxeles cuadrados por letra
        let soupCanvas = null;
        let soupCtx = null;
        let soupLetters = [];
        let soupOn = false;
        let soupRaf = 0;
        let soupPrev = 0;
        let soupDpr = 1;
        let soupW = 0;
        let soupH = 0;

        function soupReduced() {
            return !!(window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        }

        function sizeSoupCanvas() {
            if (!soupCanvas) return;
            soupDpr = Math.min(window.devicePixelRatio || 1, 2);
            soupW = window.innerWidth;
            soupH = window.innerHeight;
            soupCanvas.width = Math.max(1, Math.round(soupW * soupDpr));
            soupCanvas.height = Math.max(1, Math.round(soupH * soupDpr));
        }

        function soupCount() {
            return Math.max(16, Math.min(48, Math.round(soupW * soupH / SOUP_DENSITY)));
        }

        function buildSoup() {
            const total = soupCount();
            soupLetters = [];
            for (let i = 0; i < total; i++) {
                const size = 22 + Math.random() * 20;
                const r = size * .62;   // radio de choque de la tecla
                soupLetters.push({
                    ch: SOUP_CHARS.charAt(Math.floor(Math.random() * SOUP_CHARS.length)),
                    col: SOUP_COLORS[i % SOUP_COLORS.length],
                    size: size,
                    r: r,
                    x: r + Math.random() * Math.max(1, soupW - 2 * r),
                    y: r + Math.random() * Math.max(1, soupH - 2 * r),
                    vx: (Math.random() < .5 ? -1 : 1) * SOUP_SPEED * (.5 + Math.random() * .8),
                    vy: (Math.random() * 2 - 1) * SOUP_SPEED,
                    a: .16 + Math.random() * .30   // opacidad de la tecla
                });
            }
        }

        function soupStep(dt) {
            const L = soupLetters;
            let i, j, p;

            // 1) Avance y rebote contra las paredes
            for (i = 0; i < L.length; i++) {
                p = L[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
                else if (p.x > soupW - p.r) { p.x = soupW - p.r; p.vx = -Math.abs(p.vx); }
                if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
                else if (p.y > soupH - p.r) { p.y = soupH - p.r; p.vy = -Math.abs(p.vy); }
            }

            // 2) Choque entre letras: se separan e intercambian velocidades
            for (i = 0; i < L.length; i++) {
                const a = L[i];
                for (j = i + 1; j < L.length; j++) {
                    const b = L[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const min = a.r + b.r;
                    const d2 = dx * dx + dy * dy;
                    if (d2 >= min * min || d2 === 0) continue;
                    const d = Math.sqrt(d2);
                    const nx = dx / d, ny = dy / d;
                    const push = (min - d) / 2 + .1;
                    a.x -= nx * push; a.y -= ny * push;
                    b.x += nx * push; b.y += ny * push;
                    const along = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                    if (along <= 0) continue;
                    a.vx -= along * nx; a.vy -= along * ny;
                    b.vx += along * nx; b.vy += along * ny;
                }
            }

            // 3) Ninguna tecla se queda quieta del todo
            for (i = 0; i < L.length; i++) {
                p = L[i];
                if (Math.sqrt(p.vx * p.vx + p.vy * p.vy) < 25) {
                    const ang = Math.random() * Math.PI * 2;
                    p.vx = Math.cos(ang) * 45;
                    p.vy = Math.sin(ang) * 45;
                }
            }
        }

        function soupRoundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        function soupDraw() {
            if (!soupCtx) return;
            const ctx = soupCtx;
            ctx.setTransform(soupDpr, 0, 0, soupDpr, 0, 0);
            ctx.clearRect(0, 0, soupW, soupH);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (let i = 0; i < soupLetters.length; i++) {
                const p = soupLetters[i];
                const box = p.size * 1.12;
                // la tecla
                ctx.globalAlpha = p.a;
                soupRoundRect(ctx, p.x - box / 2, p.y - box / 2, box, box, p.size * .26);
                ctx.fillStyle = "#141b2a";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = p.col;
                ctx.stroke();
                // la letra grabada encima
                ctx.globalAlpha = Math.min(1, p.a + .55);
                ctx.fillStyle = p.col;
                ctx.font = "700 " + Math.round(p.size * .54) +
                    "px Consolas, 'Courier New', monospace";
                ctx.fillText(p.ch, p.x, p.y + 1);
            }
            ctx.globalAlpha = 1;
        }

        function soupTick(now) {
            soupRaf = 0;
            if (!soupOn || document.hidden) return;
            const dt = Math.min(.05, Math.max(0, (now - soupPrev) / 1000)) || .016;
            soupPrev = now;
            soupStep(dt);
            soupDraw();
            soupRaf = requestAnimationFrame(soupTick);
        }

        function startSoup() {
            if (soupRaf || !soupOn) return;
            soupPrev = performance.now();
            soupRaf = requestAnimationFrame(soupTick);
        }

        function stopSoup() {
            if (soupRaf) cancelAnimationFrame(soupRaf);
            soupRaf = 0;
        }

        // La llama applyLang() cada vez que cambia el fondo activo
        function syncLetterSoup(active) {
            soupOn = !!active;
            if (!soupOn) {
                stopSoup();
                if (soupCanvas) soupCanvas.style.display = "none";
                return;
            }
            if (!soupCanvas) {
                soupCanvas = document.createElement("canvas");
                soupCanvas.id = "soupCanvas";
                soupCanvas.setAttribute("aria-hidden", "true");
                document.body.appendChild(soupCanvas);
                soupCtx = soupCanvas.getContext("2d");
            }
            soupCanvas.style.display = "block";
            sizeSoupCanvas();
            if (!soupLetters.length) buildSoup();
            if (soupReduced()) {   // sin movimiento si el sistema lo pide
                stopSoup();
                soupDraw();
                return;
            }
            startSoup();
        }

        // Al cambiar el tamaño de la ventana se recolocan las letras
        window.addEventListener("resize", function () {
            if (!soupOn) return;
            sizeSoupCanvas();
            if (Math.abs(soupCount() - soupLetters.length) > 6) {
                buildSoup();
            } else {
                for (let i = 0; i < soupLetters.length; i++) {
                    const p = soupLetters[i];
                    p.x = Math.min(Math.max(p.x, p.r), Math.max(p.r, soupW - p.r));
                    p.y = Math.min(Math.max(p.y, p.r), Math.max(p.r, soupH - p.r));
                }
            }
            if (soupReduced() || document.hidden) soupDraw();
            else startSoup();
        });

        // Pestaña oculta: se apaga la animación y al volver se reanuda
        document.addEventListener("visibilitychange", function () {
            if (!soupOn) return;
            if (document.hidden) stopSoup();
            else if (soupReduced()) soupDraw();
            else startSoup();
        });

        // ---------- Fondo "Hacker": números binarios que cambian ----------
        // Un muro de ceros y unos verdes sobre negro. Como la lluvia de
        // Matrix pero en horizontal: los dígitos se van cambiando solos.
        // Solo funciona con este fondo activo (lo llama applyLang).
        let hackBox = null;      // el <div> fijo con el binario
        let hackTimer = 0;       // id del intervalo (0 = parado)
        let hackOn = false;      // ¿está activo este fondo?
        let hackChars = [];      // los dígitos de la pantalla, uno a uno
        let hackCols = 0;
        let hackRows = 0;
        const HACK_W = 11.2;     // píxeles que ocupa cada carácter
        const HACK_H = 18;       // píxeles de alto de cada fila

        // Vuelve a rellenar la pantalla con dígitos al azar (al cambiar de
        // tamaño la rejilla no cuadraría, así que se recalcula)
        function hackBuild() {
            if (!hackBox) return;
            hackCols = Math.max(8, Math.ceil(window.innerWidth / HACK_W));
            hackRows = Math.max(6, Math.ceil(window.innerHeight / HACK_H));
            hackChars = new Array(hackCols * hackRows);
            for (let i = 0; i < hackChars.length; i++) {
                hackChars[i] = Math.random() < .5 ? "0" : "1";
            }
            hackPaint();
        }

        function hackPaint() {
            if (!hackBox) return;
            const filas = [];
            for (let r = 0; r < hackRows; r++) {
                filas.push(hackChars.slice(r * hackCols, (r + 1) * hackCols).join(""));
            }
            hackBox.textContent = filas.join("\n");
        }

        // Cada paso cambia un puñado de dígitos al azar
        function hackTick() {
            if (document.hidden || !hackOn) return;
            const n = Math.max(1, Math.round(hackChars.length * .05));
            for (let i = 0; i < n; i++) {
                hackChars[Math.floor(Math.random() * hackChars.length)] =
                    Math.random() < .5 ? "0" : "1";
            }
            hackPaint();
        }

        function hackStop() {
            if (hackTimer) clearInterval(hackTimer);
            hackTimer = 0;
        }

        // La llama applyLang() cada vez que cambia el fondo activo
        function syncHacker(active) {
            hackOn = !!active;
            hackStop();
            if (!hackOn) {
                if (hackBox) hackBox.style.display = "none";
                return;
            }
            if (!hackBox) {
                hackBox = document.createElement("div");
                hackBox.id = "hackBg";
                hackBox.setAttribute("aria-hidden", "true");
                document.body.appendChild(hackBox);
            }
            hackBox.style.display = "block";
            hackBuild();
            // Sin parpadeo si el sistema pide movimiento reducido
            if (soupReduced() || document.hidden) return;
            hackTimer = setInterval(hackTick, 90);
        }

        // El binario se recoloca al cambiar el tamaño de la ventana
        window.addEventListener("resize", function () {
            if (hackOn) hackBuild();
        });

        // Pestaña oculta: se apaga el parpadeo y al volver se reanuda
        document.addEventListener("visibilitychange", function () {
            if (!hackOn) return;
            if (document.hidden) hackStop();
            else if (!hackTimer && !soupReduced()) hackTimer = setInterval(hackTick, 90);
        });

        function setBgEquipped(id) {
            if (S.state === "playing" || !S.ownedBgs.includes(id)) return;
            S.bg = id;
            try {
                storage.set("teclear.fondo", S.bg);
            } catch (e) { /* sin almacenamiento disponible */ }
            applyLang();
            invSay(t("shopEquippedBgMsg"));
        }

        function buyBg(b) {
            if (S.ownedBgs.includes(b.id)) return;   // ya está en el Inventario
            // Los fondos ganados con un logro no se compran con monedas
            if (b.ach) {
                S.shopMsgTxt = t("achNeed");
                return;
            }
            if (!cobra(b)) return;
            S.ownedBgs.push(b.id);
            // La compra solo DESBLOQUEA: usarse se hace en el Inventario
            saveShop();
            S.shopMsgTxt = t("shopBoughtBg");
        }

        // ---------- Utilidades ----------
        function level() {
            // En el modo Aventura la dificultad sube más deprisa: con cada
            // palabra escrita toca antes una más larga y menos pistas.
            // La ventaja "remanso" descuenta palabras para que no suba tanto.
            if (S.mode === "aventura") {
                return 1 + Math.floor(Math.max(0, S.completed - advRelief) / 3);
            }
            // En Supervivencia manda el RELOJ, no lo que se escribe: los
            // primeros segundos todo va muy despacio (nivel 1) y a partir de
            // ahí sube un nivel cada SUP_RAMP segundos, con lo que las
            // palabras caen más deprisa, tardan menos en recorrer el tablero
            // y caben más a la vez en pantalla.
            if (S.mode === "supervivencia") {
                return 1 + Math.floor(Math.max(0, supElapsed() - SUP_GRACE) / SUP_RAMP);
            }
            return 1 + Math.floor(S.completed / 5);
        }

        // ---------- Modo Aventura ----------
        // Segundos que regala cada palabra: van bajando a medida que sube el
        // nivel, así que las palabras dan menos tiempo justo cuando son más largas.
        function timePerWord() {
            const base = Math.max(1, 4 - Math.floor((level() - 1) / 3));
            // Ventaja "turbo": durante unos segundos cada palabra dobla su tiempo
            return performance.now() < advTurbo ? base * 2 : base;
        }

        // Velocidad a la que corre el reloj: en Aventura va acelerando con el
        // nivel (hasta el doble), así que el tiempo se consume cada vez más
        // deprisa justo cuando las palabras son más largas y valen menos.
        // En el resto de modos el reloj siempre va a velocidad normal.
        function tickSpeed() {
            if (S.mode !== "aventura") return 1;
            const extra = (level() - 1) * ADV_SPEED_STEP;
            return Math.min(ADV_SPEED_MAX, 1 + extra);
        }

        // ---------- Modo Supervivencia ----------
        // Segundos que lleva corriendo la partida. Es el que manda la
        // dificultad: al principio todo va muy despacio y con el tiempo el
        // nivel va subiendo y las palabras bajan cada vez más deprisa.
        function supElapsed() {
            return supStartAt > 0 ? (Date.now() - supStartAt) / 1000 : 0;
        }

        // Segundos que tarda una palabra en recorrer el tablero de arriba
        // abajo: van bajando con el nivel, así que cada vez hay que disparar
        // sus letras más deprisa antes de que toque el fondo.
        function supWordTime() {
            // Modo Encantado: cada letra que aciertas hace que los fantasmas
            // siguientes bajen antes (nunca por debajo de ENC_MIN_TIME)
            if (encOn()) {
                const base = SUP_TIME - encTyped * ENC_TIME_STEP;
                return Math.max(ENC_MIN_TIME, Math.round(base * 10) / 10);
            }
            const base = SUP_TIME - (level() - 1) * SUP_TIME_STEP;
            return Math.max(SUP_TIME_MIN, Math.round(base * 10) / 10);
        }

        // Velocidad a la que bajan las palabras: acelera con el nivel hasta el
        // doble, de modo que TODAS bajan cada vez más deprisa justo cuando son
        // más largas y sus letras dan más trabajo.
        function supSpeed() {
            // En el modo Encantado la aceleración la marcan las LETRAS
            // acertadas, no el reloj: escribir más hace a los fantasmas más
            // rápidos (hasta el mismo tope de doble velocidad)
            const extra = encOn()
                ? encTyped * ENC_SPEED_STEP
                : (level() - 1) * SUP_SPEED_STEP;
            return Math.min(SUP_SPEED_MAX, 1 + extra);
        }

        // Segundos que le quedan a una palabra antes de tocar el fondo
        function supLeft(it) {
            return Math.max(0, (1 - it.y) * it.span / supSpeed());
        }

        // Palabras que pueden estar en pantalla a la vez: se empieza con una
        // y el tope va subiendo con el NIVEL (que crece con el tiempo), así
        // que la pantalla se va llenando según pasan los segundos.
        function supMaxWords() {
            // Modo Encantado: los fantasmas salen según lo que ESCRIBES (al
            // principio pocos, y crece el tope con cada letra acertada)
            if (encOn()) return Math.min(ENC_MAX_GHOSTS, 2 + Math.floor(encTyped / ENC_GHOST_STEP));
            return Math.min(SUP_MAX_WORDS, 1 + Math.floor((level() - 1) / 2));
        }

        // Palabras que faltan para la próxima parada de ventaja: el hueco va
        // creciendo de dos en dos palabras cada vez que se para, hasta
        // ADV_EVERY_MAX, de modo que las ventajas salen cada vez menos a menudo.
        // (Las dos primeras paradas siguen siendo a las 5 y a las 10 palabras)
        function perkEvery() {
            return Math.min(ADV_EVERY + Math.floor(advStops / 2), ADV_EVERY_MAX);
        }

        // Suma segundos al cronómetro (palabras y ventajas del modo Aventura)
        function gainTime(sec) {
            S.timeLeft += sec;
            advTimeGained += sec;
            showSeconds(sec);
        }

        // Aviso flotante de los segundos ganados (celeste, sobre el tablero)
        function showSeconds(sec) {
            const p = document.createElement("div");
            p.className = "points time";
            p.textContent = "+" + sec + "s";
            stage.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }

        // Banque de ventajas (17 en total): cada ADV_EVERY palabras se sortean
        // tres y el jugador se queda con una. El texto va en castellano y en inglés.
        const ADVENTURE_PERKS = [
            {
                id: "tiempo", icon: "⏱️",
                es: "+10 segundos", en: "+10 seconds",
                descEs: "Diez segundos más en el cronómetro.", descEn: "Ten more seconds on the clock.",
                apply: function () { gainTime(10); }
            },
            {
                id: "escudo", icon: "🛡️",
                es: "Escudo", en: "Shield",
                descEs: "Absorbe tu próximo fallo: ni puntos ni racha.", descEn: "Absorbs your next mistake: no points or streak lost.",
                apply: function () { advShield++; }
            },
            {
                id: "congelar", icon: "❄️",
                es: "Tiempo congelado", en: "Frozen clock",
                descEs: "El cronómetro no baja durante 6 segundos.", descEn: "The clock does not tick for 6 seconds.",
                apply: function () { advFreeze = performance.now() + 6000; }
            },
            {
                id: "doble", icon: "💥",
                es: "Puntos x2", en: "Double points",
                descEs: "Duplica tus puntos durante 15 segundos.", descEn: "Doubles your points for 15 seconds.",
                apply: function () { advDouble = performance.now() + 15000; }
            },
            {
                id: "turbo", icon: "🏃",
                es: "Turbo", en: "Turbo",
                descEs: "10 segundos en los que cada palabra dobla el tiempo que regala.", descEn: "10 seconds where every word gives double time.",
                apply: function () { advTurbo = performance.now() + 10000; }
            },
            {
                id: "monedas2", icon: "🧲",
                es: "Monedas dobles", en: "Double coins",
                descEs: "15 segundos ganando el doble de monedas en cada palabra.", descEn: "15 seconds earning double coins on every word.",
                apply: function () { advCoins = performance.now() + 15000; }
            },
            {
                id: "salvavidas", icon: "🆘",
                es: "Salvavidas", en: "Lifeline",
                descEs: "Si el cronómetro llega a cero, salta a 15 segundos.", descEn: "If the clock reaches zero, it jumps to 15 seconds.",
                apply: function () { advRevive++; }
            },
            {
                id: "regalada", icon: "🎁",
                es: "Palabra regalada", en: "Free word",
                descEs: "La palabra de delante se completa sola si no la tocas.", descEn: "The word in front of you completes itself if you leave it alone.",
                apply: function () {
                    const w = S.word;
                    let intentos = 0;
                    // Espera a que se cierre la parada (una doble "doble
                    // elección" puede dejar la ventana abierta un rato)
                    const intento = function () {
                        if (S.state !== "playing") return;
                        if (S.perkOpen && intentos++ < 40) { setTimeout(intento, 300); return; }
                        if (S.perkOpen) return;
                        if (S.word !== w || typing.value.length > 0) return;
                        S.statusTxt = t("statusFreeWord");
                        completeWord();
                    };
                    setTimeout(intento, 600);
                }
            },
            {
                id: "suerte", icon: "🎲",
                es: "Suerte del todo", en: "Wild card",
                descEs: "Te toca otra ventaja al azar del banque.", descEn: "You get another random advantage from the deck.",
                apply: function () {
                    const otras = ADVENTURE_PERKS.filter(p => p.id !== "suerte");
                    otras[Math.floor(Math.random() * otras.length)].apply();
                }
            },
            {
                id: "monedas", icon: "🪙",
                es: "+25 monedas", en: "+25 coins",
                descEs: "Te llevas 25 monedas al instante.", descEn: "You get 25 coins right away.",
                apply: function () { giveCoins(25); showCoin(25); }
            },
            {
                id: "racha", icon: "🔥",
                es: "Racha +5", en: "Streak +5",
                descEs: "Tu racha sube de golpe cinco palabras.", descEn: "Your streak jumps five words ahead.",
                apply: function () { S.streak += 5; }
            },
            {
                id: "corto", icon: "🛤️",
                es: "Camino corto", en: "Short cut",
                descEs: "Las próximas 3 palabras serán cortas.", descEn: "The next 3 words will be short ones.",
                apply: function () { advShort += 3; }
            },
            {
                id: "dobleEleccion", icon: "🎒",
                es: "Doble elección", en: "Double pick",
                descEs: "Tu próxima parada es doble: te llevas dos ventajas seguidas.", descEn: "Your next stop is a double one: you get two advantages in a row.",
                apply: function () { advExtraPick++; }
            },
            {
                id: "remanso", icon: "🌊",
                es: "Remanso", en: "Lull",
                descEs: "Las próximas 12 palabras no cuentan para subir de nivel: bajan las palabras y sube el tiempo por palabra.", descEn: "The next 12 words don't count toward the level: easier words and more time each.",
                apply: function () { advRelief += 12; advReliefFrom = S.completed; }
            },
            {
                id: "dorada", icon: "💎",
                es: "Racha dorada", en: "Golden streak",
                descEs: "15 segundos con el multiplicador en x5, aunque falles.", descEn: "15 seconds with the multiplier at x5, even if you miss.",
                apply: function () { advGold = performance.now() + 15000; }
            },
            {
                id: "bolsa", icon: "🧧",
                es: "Bolsa de monedas", en: "Coin pouch",
                descEs: "Monedas al instante: diez veces tu racha actual (mínimo 20).", descEn: "Coins right away: ten times your current streak (at least 20).",
                apply: function () {
                    const n = Math.max(20, S.streak * 10);
                    giveCoins(n);
                    showCoin(n);
                }
            },
            {
                id: "indulgencia", icon: "😇",
                es: "Indulgencia", en: "Grace",
                descEs: "15 segundos en los que fallar no rompe tu racha (sí resta 5 puntos).", descEn: "15 seconds where missing doesn't break your streak (still -5 points).",
                apply: function () { advGrace = performance.now() + 15000; }
            }
        ];

        // Reparte tres ventajas distintas al azar entre las que elegir
        function sortPerks() {
            const pool = ADVENTURE_PERKS.slice();
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = pool[i];
                pool[i] = pool[j];
                pool[j] = tmp;
            }
            return pool.slice(0, 3);
        }

        // Abre la parada de la aventura: mientras el jugador elige, el reloj
        // no corre y la entrada de texto queda bloqueada.
        function openPerkChoice() {
            if (S.state !== "playing") return;
            // Segunda ventaja de una parada doble ("doble elección"): la
            // ventana sigue abierta y solo hacen falta otras tres al azar
            if (S.perkOpen) { S.perkOpts = sortPerks(); return; }
            advPicks = advExtraPick > 0 ? 2 : 1;
            advExtraPick = 0;
            S.perkOpts = sortPerks();
            S.perkOpen = true;
            pausedAt = Date.now();
            typing.blur();
            S.statusTxt = t("perkTitle");
        }

        // Aplica la ventaja elegida y devuelve el control al jugador
        function choosePerk(p) {
            if (!S.perkOpen) return;
            const segunda = advPicks > 1;   // la parada deja otra ventaja más
            if (segunda) {
                advPicks--;
            } else {
                advPicks = 1;
                S.perkOpen = false;
                pausedTotal += Date.now() - pausedAt;   // la pausa no cuenta como partida
                pausedAt = 0;
            }
            p.apply();
            const nombre = p.icon + " " + (uiLang() === "en" ? p.en : p.es);
            if (segunda) {
                openPerkChoice();          // se sortean tres ventajas más
                S.statusTxt = t("perkSecond") + nombre;
            } else {
                typing.focus();
                S.statusTxt = t("perkChosen") + nombre;
            }
            updateHud();   // refresca el tiempo y los efectos activos
        }

        // Lista de la que sale la siguiente palabra. Con el modo picante
        // activado, aproximadamente la mitad de las palabras de la partida
        // salen de la lista subida de tono (+18) del idioma en juego.
        // Con el modo Caos se mezclan todos los idiomas y modos a la vez.
        // Con el modo Php, Andaluz o Cúbico activo, su lista se usa sola
        // (o se mezcla con la del idioma si también están picante/caos).
        // Con el modo Espejo, cada palabra se da del revés: hay que escribirla
        // al revés, letra por letra.
        // Con el modo Al azar, la lista sale de los extras que la partida
        // haya elegido al empezar (extraRun).
        // (El modo Imágenes no usa estas listas: la palabra es la de la imagen.)
        function wordPool() {
            // Palabras que aportan los extras con lista propia (php, andaluz, cubico)
            const propias = [];
            if (extraActive("php")) propias.push(PHP_WORDS);
            if (extraActive("andaluz")) propias.push(ANDALUZ_WORDS);
            if (extraActive("cubico")) propias.push(MINECRAFT_WORDS);
            // Modo Truco o trato (evento de Halloween): palabras terroríficas
            if (extraActive("truco")) {
                propias.push(S.lang === "en" ? HALLOWEEN_WORDS.en : HALLOWEEN_WORDS.es);
            }

            let pool;
            if (extraActive("caos")) {
                // Caos: todo mezclado, listas propias incluidas
                pool = WORDS.es.concat(WORDS.en, MURCIANO_WORDS);
                if (extraActive("picante")) pool = pool.concat(PICANTE.es, PICANTE.en);
                propias.forEach(l => { pool = pool.concat(l); });
                return pool;
            }
            const base = S.lang === "mur" ? MURCIANO_WORDS : WORDS[S.lang];
            // Si hay alguna lista propia, la partida se juega con ella (y con
            // el idioma, para dar variedad), salvo que solo esté la lista propia
            if (propias.length) {
                // Si el Al azar sortea dos modos con lista propia, se juega con las dos
                pool = [];
                propias.forEach(l => { pool = pool.concat(l); });
                // Se añade algo del idioma para no repetir siempre lo mismo
                for (let i = 0; i < Math.min(10, base.length); i++) {
                    if (Math.random() < 0.35) pool.push(base[i]);
                }
                return pool;
            }
            if (!extraActive("picante")) return base;
            const spicy = S.lang === "mur" ? PICANTE.es : PICANTE[S.lang];
            return Math.random() < 0.5 ? spicy : base;
        }

        // Modo Espejo: la palabra se muestra y se pide del revés
        function mirrorWord(w) {
            return w.split("").reverse().join("");
        }

        // Modo Al azar: al empezar la partida se elige uno o varios extras
        // comprados (nunca el propio azar) y se aplican solo durante ese juego
        function rollRandomExtras() {
            const candidatos = EXTRAS.filter(x => x.id !== "azar" && ownsExtra(x.id));
            extraRun = { azar: true };
            if (candidatos.length === 0) return [];
            // Un tercio de las veces, dos extras a la vez
            const dobles = candidatos.length > 1 && Math.random() < 0.34;
            const elegidos = [];
            const copia = candidatos.slice();
            const n = dobles ? 2 : 1;
            for (let k = 0; k < n && copia.length; k++) {
                const i = Math.floor(Math.random() * copia.length);
                elegidos.push(copia[i].id);
                extraRun[copia[i].id] = true;
                copia.splice(i, 1);
            }
            return elegidos;
        }

        // ---------- Modo Imágenes ----------
        // Palabra que nombra la imagen, según el idioma elegido
        function imageWord(im) {
            return uiLang() === "en" ? im.en : im.es;
        }

        // Elige una imagen cuya palabra encaje con el nivel actual
        function nextImageWord() {
            const lvl = level();
            const cabe = w => {
                if (lvl <= 1) return w.length <= 5;
                if (lvl <= 3) return w.length <= 7;
                if (lvl <= 6) return w.length >= 5;
                return w.length >= 6;
            };
            let pool = IMAGENES.filter(im => cabe(imageWord(im)));
            if (pool.length === 0) pool = IMAGENES;

            let im;
            do {
                im = pool[Math.floor(Math.random() * pool.length)];
            } while (im === S.currentImg && pool.length > 1);
            S.currentImg = im;
            S.picErr = false;   // imagen nueva: de momento se confía en que cargue
            return imageWord(im);
        }

        function nextWord() {
            if (S.mode === "imagen") return nextImageWord();
            const list = wordPool();
            const lvl = level();
            let pool;
            // Ventaja "camino corto" del modo Aventura: palabras cortas
            if (S.mode === "aventura" && advShort > 0) {
                advShort--;
                pool = list.filter(w => w.length <= 5);
            } else if (lvl <= 1) pool = list.filter(w => w.length <= 5);
            else if (lvl <= 3) pool = list.filter(w => w.length <= 7);
            else if (lvl <= 6) pool = list.filter(w => w.length >= 5);
            else pool = list.filter(w => w.length >= 6);

            if (pool.length === 0) pool = list;

            let w;
            do {
                w = pool[Math.floor(Math.random() * pool.length)];
            } while (w === S.word && pool.length > 1);
            // Modo Espejo: la palabra se pide del revés
            return extraActive("espejo") ? mirrorWord(w) : w;
        }

        function multiplier() {
            // Ventaja "racha dorada": mientras dura, el multiplicador se
            // queda clavado en su máximo aunque la racha se caiga
            if (S.mode === "aventura" && performance.now() < advGold) return 5;
            return Math.min(1 + Math.floor(S.streak / 4), 5);
        }

        // ---------- Habilidades de los fondos ----------
        // Cada fondo comprado tiene una pasiva distinta que solo actúa
        // mientras está equipado y mientras dura la partida.
        function bgPower(id) {
            // En el modo Aventura no actúa ningún fondo: el modo lleva el suyo
            if (S.mode === "aventura") return false;
            return S.bg === id && S.ownedBgs.includes(id);
        }

        // Duración de la partida: el fondo Elprico regala 15 segundos extra
        function gameTime() {
            return GAME_TIME + (bgPower("elprico") ? BONUS_TIME_ELPRICO : 0);
        }

        // Habilidad de Sopa de Letras: letras que la palabra trae ya puestas
        // (nunca tantas como para completar la palabra de golpe)
        function soupGiven() {
            if (!bgPower("sopa")) return 0;
            return Math.min(SOUP_GIVEN, Math.max(0, S.word.length - 1));
        }

        // Texto de la habilidad del fondo equipado (vacío si no tiene ninguna)
        function bgPowerDesc() {
            const b = BACKGROUNDS.find(x => x.id === S.bg);
            // Los fondos de decoración (Circuito, Hacker) no aportan nada:
            // son puro adorno ganado con un logro
            if (!b || b.decor || b.id === "dark") return "";
            return uiLang() === "es" ? b.descEs : b.descEn;
        }

        // Modo adivinar: descubre algunas letras de la palabra en cuanto sale
        function soupReveal() {
            const give = soupGiven();
            if (!give) return;
            const hidden = [];
            for (let i = 0; i < S.mask.length; i++) {
                if (S.mask[i] === "hidden") hidden.push(i);
            }
            // Se deja siempre alguna letra por descubrir: si no, la palabra
            // no podría completarse nunca en el modo adivinar
            const max = Math.min(give, hidden.length - 1);
            for (let k = 0; k < max; k++) S.mask[hidden[k]] = "found";
        }

        // Modo tecleo: escribe por ti las primeras letras de la palabra
        function soupPrefill() {
            const give = soupGiven();
            if (!give) return;
            typing.value = S.word.slice(0, give);
            S.typedStr = typing.value;
            S.prevLen = give;   // ya tecleadas: no suman golpes ni fallos
        }

        // Oculta letras de la palabra según el nivel:
        // nivel 1-2 → la mitad, nivel 3-5 → casi todas, nivel 6+ → todas
        // Solo se ocultan letras: los símbolos (como el "_" de las funciones
        // de PHP) se quedan a la vista porque no se pueden adivinar a tecla.
        function makeMask(w) {
            const unique = [...new Set(w.split("").filter(ch => /[a-záéíóúüñ]/i.test(ch)))];
            for (let i = unique.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = unique[i];
                unique[i] = unique[j];
                unique[j] = tmp;
            }
            const lvl = level();
            let ratio = 0.5;
            if (lvl >= 6) ratio = 1;
            else if (lvl >= 3) ratio = 0.7;
            const hideCount = Math.max(1, Math.ceil(unique.length * ratio));
            const hidden = new Set(unique.slice(0, hideCount));
            return w.split("").map(ch => (hidden.has(ch) ? "hidden" : "start"));
        }

        function updateHud() {
            // (todo el HUD lo pinta Svelte leyendo G; el pulso repinta el
            // campo de Supervivencia, cuyas cajas se mueven a cada tick)
            S.supTick++;
            // Logro «Hacker»: se anota la mejor puntuación de UNA partida.
            // Este es el sitio donde se refleja el marcador de todos los
            // modos, así que aquí se comprueba la meta de 10.000 puntos.
            achBest("hacker", S.score);
        }

        // ---------- Modo Supervivencia: palabras que bajan desde arriba ----------
        // El tablero es un campo con varias columnas. Cada palabra nace arriba
        // del todo y va bajando por su columna hasta el fondo, con sus letras
        // y su barra de descenso; solo la apuntada está encendida y es la que
        // se teclea. Se apunta con el clic o con Tab, y si una llega hasta
        // abajo se pierde una vida.

        // (Las cajas de las palabras las dibuja Svelte con un {#each} sobre
        //  supItems: posición, letras disparadas y barra salen de los datos)

        // El span de la letra i de una palabra en pantalla (para el disparo)
        function supLetterEl(it, i) {
            const box = board && board.querySelector('[data-n="' + it.n + '"]');
            const ls = box && box.querySelector(".sup-letters");
            return ls ? (ls.children[i] || null) : null;
        }

        // Letra aleatoria que baja en el modo Encantado (con su fantasma)
        function encLetter() {
            return ENC_ALFABETO[Math.floor(Math.random() * ENC_ALFABETO.length)];
        }

        // Nueva palabra: nace arriba del todo en la columna que tenga más
        // aire (solo datos, la caja la pinta Svelte al entrar en la lista)
        function supSpawn() {
            if (supItems.length >= supMaxWords()) return null;
            const lanes = board && board.clientWidth < 520
                ? SUP_LANES_NARROW : SUP_LANES_WIDE;
            // Se elige la columna cuya palabra más alta deja más hueco
            // arriba, así que las letras no se pisan al bajar
            let lane = lanes[0];
            let mejor = -1;
            for (const ln of lanes) {
                let alto = 2;                       // 2 = columna vacía
                for (const x of supItems) {
                    if (x.lane === ln && x.y < alto) alto = x.y;
                }
                if (alto > mejor) { mejor = alto; lane = ln; }
            }

            // En el modo Encantado caen LETRAS sueltas (cada una en su
            // fantasma); en el clásico, palabras como siempre
            const enc = encOn();
            let w = enc ? encLetter() : nextWord();
            // Se evita repetir las que ya están en pantalla
            for (let i = 0; i < 8 && supItems.some(x => x.w === w); i++) w = enc ? encLetter() : nextWord();

            const seg = supWordTime();
            const it = {
                n: ++supSerial,      // id estable para el {#each} y el disparo
                w: w, typed: 0, shotFrom: 0, fresh: true,
                lane: lane,
                span: seg, y: 0      // y: 0 = arriba del todo, 1 = fondo
            };
            supItems.push(it);
            return it;
        }

        // Rellena el tablero hasta el tope del nivel: cada vez hay más
        // palabras en pantalla según avanzas. Devuelve la última en entrar.
        function supFillBoard() {
            let nueva = null;
            while (supItems.length < supMaxWords()) {
                const it = supSpawn();
                if (!it) break;
                nueva = it;
            }
            return nueva;
        }

        // Saca una palabra del tablero (completada o escapada)
        function supRemove(it) {
            const i = supItems.indexOf(it);
            if (i >= 0) supItems.splice(i, 1);
            if (supTarget === it) supTarget = null;
        }

        // Apunta a una palabra: a partir de ahí es la que se teclea. El reloj
        // del HUD pasa a marcar lo que LE FALTA de camino al fondo y se
        // recupera lo que ya se había disparado de ella antes de cambiar.
        function supAim(it) {
            if (!it) return;
            supTarget = it;
            S.word = it.w;                     // las recompensas trabajan sobre `word`
            S.prevLen = it.typed;
            S.typedStr = it.w.slice(0, it.typed);
            typing.value = S.typedStr;
            S.timeLeft = supLeft(it);
            updateHud();
        }

        // La siguiente en apuntar es la que está más cerca del fondo
        function supAimNext() {
            let mejor = null;
            for (const x of supItems) if (!mejor || x.y > mejor.y) mejor = x;
            supAim(mejor);
        }

        // Tab (o un clic) para pasar a apuntar a la siguiente palabra
        function supCycle() {
            if (supItems.length < 2) return;
            const i = supItems.indexOf(supTarget);
            supAim(supItems[(i + 1) % supItems.length]);
        }

        // Palabra terminada: cobra puntos, monedas y experiencia, se va del
        // tablero y... ¡van apareciendo más! (el tope lo manda el nivel)
        function supComplete() {
            const it = supTarget;
            if (!it) return;
            // El modo Encantado solo paga CARAMELOS (ni monedas ni experiencia)
            if (encOn()) encReward();
            else pagaPalabra();           // recompensas, racha y logros
            supRemove(it);
            supFillBoard();
            supAimNext();
            updateHud();
        }

        // Letra acertada en el modo Encantado: su recompensa son caramelos.
        // Cuenta para nivel, racha y resultados, pero NUNCA da monedas ni
        // experiencia (el modo se paga solo en la moneda del evento).
        function encReward() {
            encTyped++;
            S.completed++;
            S.streak++;
            S.score += 10;
            giveCandy(ENC_CANDY_HIT);     // +1 caramelos por letra
            showCandy(ENC_CANDY_HIT);
            S.statusTxt = t("encHit");
        }

        // Una palabra ha llegado hasta el fondo del tablero: se pierde una
        // vida y sigue la partida con las que queden (sin vidas se acaba)
        function supEscape(it) {
            const escapada = it.w;
            supRemove(it);
            S.supLives--;
            shake();
            if (S.supLives <= 0) {
                S.supLives = 0;
                S.timeLeft = 0;
                S.statusTxt = t("supFailEnd");
                updateHud();
                endGame();
                return;
            }
            S.statusTxt = t("supFail") + S.supLives + " ❤️ · " + t("supFell") + escapada;
            // En el hueco de la que se ha caído entra otra por arriba y se
            // apunta a ella
            supFillBoard();
            supAimNext();
        }

        // ---------- Disparo de las letras ----------
        // Cada letra aceptada sale volando desde el campo de escritura hasta
        // su casilla de la palabra apuntada. El vuelo dura SHOT_MS y la
        // explosión de la casilla espera a que la letra llegue, así que se
        // ve el disparo y después el impacto. Va en la capa de efectos, que
        // no estorba ni al ratón ni al teclado.
        function supShoot(ch, destino, espera) {
            if (!fxLayer || !typing || !destino) return;
            const a = typing.getBoundingClientRect();
            const b = destino.getBoundingClientRect();
            if (!a.width || !b.width) return;
            const x0 = a.left + a.width / 2;
            const y0 = a.top + a.height / 2;
            const dx = (b.left + b.width / 2) - x0;
            const dy = (b.top + b.height / 2) - y0;
            const p = document.createElement("i");
            p.className = "sup-shot";
            p.textContent = ch;
            p.style.left = x0 + "px";
            p.style.top = y0 + "px";
            p.style.setProperty("--shot-dx", dx.toFixed(1) + "px");
            p.style.setProperty("--shot-dy", dy.toFixed(1) + "px");
            // La letra gira en el sentido del vuelo: se ve que va disparada
            p.style.setProperty("--shot-rot",
                Math.round(Math.atan2(dy, dx) * 180 / Math.PI) + "deg");
            p.style.setProperty("--shot-dur", SHOT_MS + "ms");
            p.style.animationDelay = (espera || 0) + "ms";
            fxLayer.appendChild(p);
            setTimeout(function () { p.remove(); }, SHOT_MS + (espera || 0) + 120);
        }

        // Lo que se teclea se compara con la palabra APUNTADA: la primera
        // letra mal puesta se rechaza y penaliza, como en el modo Tecleo
        function supInput() {
            let val = typing.value.toLowerCase();
            if (typing.value !== val) typing.value = val;

            const tgt = supTarget;
            if (!tgt) {
                typing.value = "";
                return;
            }

            if (val.length > tgt.w.length) {
                val = val.slice(0, tgt.w.length);
                typing.value = val;
            }

            let bad = -1;
            for (let i = 0; i < val.length; i++) {
                if (val[i] !== tgt.w[i]) {
                    bad = i;
                    break;
                }
            }

            if (bad !== -1) {
                val = val.slice(0, bad);
                typing.value = val;
                errors++;
                S.streak = 0;
                S.score = Math.max(0, S.score - 5);
                shake();
                // Modo Encantado: fallar cuesta CARAMELOS, pero el contador
                // nunca baja de cero (con 0 caramelos no se mueve)
                if (encOn()) {
                    const perdidos = Math.min(ENC_CANDY_FAIL, Math.max(0, S.caramelos));
                    if (perdidos > 0) {
                        giveCandy(-perdidos);
                        S.statusTxt = t("encFail") + perdidos + t("encFailEnd");
                    } else {
                        S.statusTxt = t("encFailZero");
                    }
                } else {
                    S.statusTxt = t("statusError");
                }
            } else {
                if (val.length > S.prevLen) hits += val.length - S.prevLen;
                S.statusTxt = t("statusOk");
            }

            const antes = S.prevLen;
            S.prevLen = val.length;
            tgt.typed = val.length;
            tgt.shotFrom = antes;   // desde dónde llegó esta ráfaga (retardo del blast)
            updateHud();

            // Letras recién aceptadas: salen disparadas del campo de
            // escritura hacia su casilla (una tras otra, con su desfase)
            if (bad === -1) {
                for (let i = antes; i < val.length; i++) {
                    const espera = (i - antes) * SHOT_GAP;
                    supShoot(tgt.w[i], supLetterEl(tgt, i), espera);
                }
            }

            if (val === tgt.w) supComplete();
        }

        // (El tablero — letras, foto del modo Imágenes, máscara de Adivinar
        //  y el campo de Supervivencia — lo dibuja Svelte desde G.boardView;
        //  las vidas y los fallos, desde G.missesView)

        function showPoints(points) {
            const p = document.createElement("div");
            p.className = "points";
            p.textContent = "+" + points;
            stage.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }

        function showCoin(n) {
            const c = document.createElement("div");
            c.className = "points coin";
            c.textContent = "🪙 +" + n;
            stage.appendChild(c);
            setTimeout(() => c.remove(), 900);
        }

        // Aviso de caramelos ganados con la letra (modo Encantado)
        function showCandy(n) {
            const c = document.createElement("div");
            c.className = "points candy";
            c.textContent = "🍬 +" + n;
            stage.appendChild(c);
            setTimeout(() => c.remove(), 900);
        }

        // Aviso de experiencia ganada con la palabra (modo Supervivencia): la
        // misma que se lleva al final de la partida, palabra a palabra.
        function showXp(n) {
            const p = document.createElement("div");
            p.className = "points xp";
            p.textContent = "✨ +" + n + " XP";
            stage.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }

        function shake() {
            board.classList.remove("shake");
            void board.offsetWidth; // reinicia la animación
            board.classList.add("shake");
        }

        // ---------- Efectos de tecleo: partículas ----------
        // Capa fija sobre la pantalla: ahí nacen las chispas y ahí mueren
        // solas, sin que estorben al ratón ni al resto de la interfaz
        const fxLayer = document.createElement("div");
        fxLayer.className = "fx-layer";
        fxLayer.setAttribute("aria-hidden", "true");
        document.body.appendChild(fxLayer);

        const FX_MAX = 140;   // partículas vivas a la vez (no saturar el DOM)
        let fxAlive = 0;

        // Punto donde estalla la letra: la que está a punto de aparecer en el
        // tablero (en Imágenes no hay letras, así que manda el campo de entrada)
        function fxAnchor() {
            let el = null;
            if (S.mode === "imagen") {
                el = null;
            } else if (S.mode === "guess") {
                el = board.querySelector(".cursor");
                if (!el) {
                    const ok = board.querySelectorAll(".ok");
                    el = ok.length ? ok[ok.length - 1] : null;
                }
            } else if (S.mode === "supervivencia") {
                // La letra es la de la palabra APUNTADA (la que acaba de
                // recibir el disparo, o la que está a punto de recibirlo)
                const caja = supTarget &&
                    board.querySelector('[data-n="' + supTarget.n + '"]');
                el = caja ? (caja.querySelector(".shot.blast") ||
                             caja.querySelector(".cursor")) : null;
            } else if (board.children.length) {
                const i = Math.min(S.prevLen, board.children.length - 1);
                el = board.children[i < 0 ? 0 : i];
            }
            const r = (el || typing).getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }

        // Estalla el efecto equipado en el punto de la letra recién tecleada
        function fxBurst() {
            const fx = activeFx();
            if (!fx || S.state !== "playing") return;
            const a = fxAnchor();
            const n = fx.count;
            const life = fx.life || 800;
            for (let i = 0; i < n; i++) {
                if (fxAlive >= FX_MAX) break;
                const p = document.createElement("i");
                const ang = (Math.PI * 2 * i) / n + Math.random() * .8;
                const pow = fx.power * (.55 + Math.random() * .75);
                const dx = Math.cos(ang) * pow;
                const dy = Math.sin(ang) * pow + fx.rise * (.6 + Math.random() * .8);
                const cada = fx.glyphEvery || 3;   // de vez en cuando, el emoji
                const emoji = fx.glyph && i % cada === 0;
                // Punto redondo… o cubo, si el efecto es de bloques (Explosión),
                // o gota, si es de sangre (tienda de evento de Halloween),
                // o llama, si es de fuego (dibujada, sin emoji)
                const forma = emoji ? "" :
                    (fx.shape === "block" ? " block" :
                     fx.shape === "drop" ? " drop" :
                     fx.shape === "flame" ? " flame" : " dot");
                p.className = "fx-p" + forma;
                p.style.left = (a.x + Math.random() * 12 - 6) + "px";
                p.style.top = (a.y + Math.random() * 12 - 6) + "px";
                p.style.setProperty("--fx-dx", dx.toFixed(1) + "px");
                p.style.setProperty("--fx-dy", dy.toFixed(1) + "px");
                p.style.setProperty("--fx-rot", fx.shape === "flame" ? "0deg" :
                    (Math.random() * 360 - 180).toFixed(0) + "deg");   // las llamas no giran
                p.style.setProperty("--fx-life", life + "ms");
                if (emoji) {
                    p.textContent = fx.glyph;
                    p.style.fontSize = fx.size + "px";
                } else {
                    p.style.setProperty("--fx-color", fx.colors[i % fx.colors.length]);
                    // la chispa es más pequeña que el emoji para no tapar la letra;
                    // los cubos de la Explosión casi igualan al emoji (son bloques);
                    // las LLAMAS salen con tamaño variado, que así se ve más viva
                    const escala = fx.shape === "block" ? .85 :
                        fx.shape === "flame" ? (.45 + Math.random() * .8) : .6;
                    p.style.setProperty("--fx-size", Math.max(6, Math.round(fx.size * escala)) + "px");
                }
                fxLayer.appendChild(p);
                fxAlive++;
                setTimeout((function (node) {
                    return function () {
                        node.remove();
                        fxAlive--;
                    };
                })(p), life + 60);
            }
        }

        // ---------- Ciclo de juego ----------
        function newWord() {
            typing.value = "";
            S.typedStr = "";
            S.prevLen = 0;
            S.word = nextWord();
            if (S.mode === "guess") {
                S.mask = makeMask(S.word);
                S.misses = 0;
                S.wrongLetters = [];
                soupReveal();    // letras que deja Sopa de Letras
            } else if (S.mode === "type" || S.mode === "aventura") {
                soupPrefill();   // letras que deja Sopa de Letras
            } else if (S.mode === "supervivencia") {
                // La partida empieza con una sola palabra en pantalla: el
                // resto van apareciendo según escribes (ya se apunta a esta)
                supItems = [];
                supTarget = null;
                supSpawn();
                supAim(supItems[0]);
            }
            updateHud();
        }

        // Recompensas de una palabra terminada: cuenta para el nivel, sube la
        // racha, paga puntos, monedas y experiencia y anota los logros.
        // La reclama el modo Tecleo/Imágenes/Adivinar desde completeWord() y
        // el modo Supervivencia desde supComplete() (que en lugar de pasar a
        // la siguiente palabra, la retira del tablero).
        function pagaPalabra() {
            S.completed++;
            S.streak++;
            // Logros: se anota la palabra recién escrita, ANTES de que
            // newWord() la cambie por la siguiente. El reto "Un poco de
            // pólvora" cuenta los «creeper» tecleados en el modo Tecleo
            // con el Modo Cúbico activo (también si sale del revés).
            if (S.mode === "type" && extraActive("cubico")) {
                const w = S.word.toLowerCase();
                if (w === "creeper" || w === mirrorWord("creeper")) achAdd("polvo", 1);
            }
            // Logro «Speedrunner»: las palabras se cuentan dentro de una
            // misma ventana de 8 segundos. Si la ventana se pasa de largo
            // empieza otra nueva y el mejor intento queda anotado.
            const ahoraSR = Date.now();
            if (!srAt || ahoraSR - srAt > SPEEDRUN_MS) {
                srAt = ahoraSR;
                srWords = 0;
            }
            srWords++;
            achBest("speed", srWords);
            const mult = multiplier();
            // Habilidades del fondo: Ia triplica puntos y monedas en las
            // palabras largas (más de 7 letras) y General dobla las monedas
            const largo = S.word.length > 7;
            const triple = bgPower("esteso") && largo;
            // Ventaja "puntos x2" del modo Aventura: solo durante su ventana
            const x2 = (S.mode === "aventura" && performance.now() < advDouble) ? 2 : 1;
            const points = S.word.length * 10 * mult * (triple ? SCORE_BOOST : 1) * x2;
            S.score += points;
            showPoints(points);
            // Monedas al estilo experiencia: la racha multiplica lo que ganas.
            // Cada palabra sin errores paga 1 moneda por cada nivel de racha
            // (x1 al principio y hasta x5 con la racha larga).
            const coinGain = mult *
                (triple ? SCORE_BOOST : 1) *
                (bgPower("franco") ? 2 : 1) *
                // Ventaja "monedas dobles": solo durante su ventana
                ((S.mode === "aventura" && performance.now() < advCoins) ? 2 : 1) *
                // Modo Truco o trato (evento de Halloween): DOBLE de monedas
                (extraActive("truco") ? 2 : 1);
            giveCoins(coinGain);
            showCoin(coinGain);
            // Modo Supervivencia: cada palabra disparada paga su experiencia
            // en caliente (el total se confirma al acabar la partida)
            if (S.mode === "supervivencia") showXp(SUP_XP_WORD + Math.floor(points / 10));
            // Modo Aventura: cada palabra regala segundos al cronómetro
            if (S.mode === "aventura") gainTime(timePerWord());
        }

        function completeWord() {
            pagaPalabra();
            newWord();
            // ... y llegado el momento hay una parada para elegir una ventaja.
            // Cada parada alarga el hueco siguiente: al principio cada 5
            // palabras y después cada vez más.
            if (S.mode === "aventura" && S.completed >= advNextPerk) {
                advStops++;
                advNextPerk = S.completed + perkEvery();
                openPerkChoice();
            }
        }

        // (La vida perdida cuando se escapa una palabra la resta supEscape(),
        //  en el bloque del modo Supervivencia)

        function startGame() {
            if (S.state === "playing") return;

            S.state = "playing";
            S.score = 0;
            S.streak = 0;
            hits = 0;
            errors = 0;
            S.completed = 0;
            S.prevLen = 0;
            S.misses = 0;
            S.wrongLetters = [];
            ttXpLoss = 0;   // experiencia robada por fallos (Truco o trato)
            encTyped = 0;   // letras acertadas del modo Encantado (si se juega)
            S.candyRun = 0;   // caramelos ganados en esta partida
            // El modo Aventura se juega contra un cronómetro propio: 50 s
            // En Supervivencia el reloj es el de la palabra apuntada
            S.timeLeft = S.mode === "aventura" ? ADV_TIME :
                (S.mode === "supervivencia" ? supWordTime() : gameTime());
            S.coinsRun = 0;
            // Modo Supervivencia: se empieza con todas las vidas y con una
            // sola palabra en pantalla (las demás van apareciendo) y el
            // tablero se ensancha para el campo de juego
            S.supLives = SUP_LIVES;
            supItems = [];
            supTarget = null;
            // El reloj de la dificultad arranca aquí: los primeros segundos
            // las palabras bajan muy despacio y a partir de ahí se aceleran
            supStartAt = Date.now();
            document.body.classList.toggle("modo-supervivencia", S.mode === "supervivencia");
            // Estado del modo Aventura: ventajas y pausas a cero
            S.perkOpen = false;
            pausedTotal = 0;
            pausedAt = 0;
            advShield = 0;
            advShort = 0;
            advFreeze = 0;
            advDouble = 0;
            advTurbo = 0;
            advCoins = 0;
            advRevive = 0;
            advTimeGained = 0;
            advGold = 0;
            advGrace = 0;
            advRelief = 0;
            advReliefFrom = 0;
            advPicks = 1;
            advExtraPick = 0;
            advStops = 0;             // aún no se ha parado a elegir ventaja
            advNextPerk = ADV_EVERY;  // primera parada: a las 5 palabras
            S.perkOpts = [];
            // Telemetría anti-automatización: se reinicia en cada partida
            keyStamps = [];
            inputEvents = 0;
            trustedInput = 0;
            trustedKeys = 0;
            pasteTried = 0;
            gameStartAt = Date.now();
            gameDuration = 0;
            // Cada partida empieza con la ventana del logro Speedrunner vacía
            srAt = 0;
            srWords = 0;

            if (S.shopOpen) { // la tienda se cierra al empezar
                S.shopOpen = false;
            }
            closeLogrosOnPlay();   // el panel de logros también
            closeInvOnPlay();      // el panel de inventario también
            closeAccountOnPlay();   // el panel de perfil también

            S.resOpen = false;
            S.startTxt = t("btnRestart");

            // Modo Al azar: se sortean los extras de ESTA partida y se
            // muestran en el tablero antes de que salga la primera palabra
            let azarTxt = "";
            if (extraActive("azar")) {
                const elegidos = rollRandomExtras();
                applyExtras();   // el tablero se ilumina con los modos elegidos
                if (elegidos.length === 0) {
                    azarTxt = t("statusAzarNone");
                } else {
                    const nombres = elegidos.map(id => {
                        const x = EXTRAS.find(e => e.id === id);
                        return x ? x.icon + " " + (uiLang() === "es" ? x.es : x.en) : id;
                    });
                    azarTxt = t("statusAzar") + nombres.join(" + ");
                }
            }

            typing.value = "";
            S.typedStr = "";
            typing.focus();
            S.statusTxt =
                S.mode === "imagen" ? t("statusPlayI") :
                S.mode === "guess" ? t("statusPlayG") :
                S.mode === "aventura" ? t("statusPlayA") :
                S.mode === "supervivencia" ? t("statusPlayS") :
                (S.lang === "mur" && S.mode === "type") ? t("statusPlayM") : t("statusPlay");
            if (azarTxt) S.statusTxt = azarTxt;
            // Modo Truco o trato (evento de Halloween): se avisan sus reglas
            // (doble de monedas, pero doble castigo por tecla fallada)
            if (extraActive("truco")) S.statusTxt = t("statusTruco");
            // Aviso de la habilidad que aporta el fondo equipado
            // (en Aventura no actúa ningún fondo: el modo lleva el suyo)
            const poder = bgPowerDesc();
            if (poder && S.mode !== "aventura") {
                S.statusTxt += " · " + poder;
            }
            // Modo Encantado (evento): sus reglas mandan sobre los avisos previos
            if (encOn()) S.statusTxt = t("encStart");
            lastTick = performance.now();

            newWord();
            updateHud();

            clearInterval(timerId);
            timerId = setInterval(tick, 100);
        }

        function tick() {
            const now = performance.now();
            // Modo Aventura: mientras se elige ventaja el reloj no corre…
            if (S.perkOpen) {
                lastTick = now;
                return;
            }
            // …y con la ventaja "tiempo congelado" tampoco baja unos segundos
            if (now < advFreeze) {
                lastTick = now;
                updateHud();
                return;
            }
            // En Supervivencia todas las palabras bajan a la vez: la que
            // llegue hasta el fondo del tablero se cae (una vida menos) hasta
            // acabar la partida
            if (S.mode === "supervivencia") {
                const dt = (now - lastTick) / 1000 * supSpeed();
                lastTick = now;
                // Se recorre una copia: al caerse puede entrar otra palabra
                // (por arriba del todo) y a esa no le toca todavía
                const vivas = supItems.slice();
                for (const it of vivas) {
                    if (supItems.indexOf(it) < 0) continue;   // ya se cayó
                    it.y += dt / Math.max(0.5, it.span);
                    if (it.y >= 1) {
                        supEscape(it);
                        if (S.state !== "playing") return;      // sin vidas: fin
                    }
                }
                // El reloj del HUD marca lo que le falta a la palabra apuntada
                S.timeLeft = supTarget ? supLeft(supTarget) : 0;
                updateHud();
                return;
            }
            // En Aventura el reloj va acelerando con el nivel: el tiempo que
            // queda se consume cada vez más deprisa (velocidad normal en el
            // resto de modos, donde tickSpeed() devuelve 1)
            S.timeLeft -= (now - lastTick) / 1000 * tickSpeed();
            lastTick = now;
            // Ventaja "salvavidas": el cronómetro no muere de golpe, salta a 15 s
            if (S.timeLeft <= 0 && advRevive > 0) {
                advRevive--;
                const salvado = Math.max(1, 15 - S.timeLeft);
                S.timeLeft += salvado;
                advTimeGained += salvado;
                showSeconds(Math.round(salvado));
                S.statusTxt = t("statusRevive");
            }

            if (S.timeLeft <= 0) {
                S.timeLeft = 0;
                updateHud();
                endGame();
                return;
            }
            updateHud();
        }

        function endGame() {
            clearInterval(timerId);
            // Duración real de la partida: si alguien congeló el cronómetro
            // para alargarla y sumar puntos, esto lo delata. Las paradas del
            // modo Aventura (elegir ventaja) no se cuentan como tiempo jugado.
            gameDuration = gameStartAt > 0
                ? Math.max(0, (Date.now() - gameStartAt - pausedTotal) / 1000)
                : gameTime();
            S.state = "over";
            // El tablero de Supervivencia se retira: palabras, apuntado y
            // la pantalla grande vuelven a su sitio hasta la próxima partida
            supItems = [];
            supTarget = null;
            supStartAt = 0;
            document.body.classList.remove("modo-supervivencia");
            // Por si se termina con la ventana de ventajas abierta
            if (S.perkOpen && pausedAt > 0) pausedTotal += Date.now() - pausedAt;
            S.perkOpen = false;
            S.perkOpts = [];
            pausedAt = 0;
            // Modo Al azar: al acabar se olvida lo sorteado en esta partida
            if (extraRun) {
                extraRun = null;
                applyExtras();
            }
            S.startTxt = t("btnAgain");

            const total = hits + errors;
            const acc = total === 0 ? 100 : Math.round((hits / total) * 100);
            // Los ppm se calculan sobre lo que duró de verdad la partida
            // (Aventura y Supervivencia no tienen duración fija: usan la real)
            const fija = S.mode === "aventura" || S.mode === "supervivencia";
            const dur = (fija && gameDuration > 0) ? gameDuration : gameTime();
            const ppm = S.completed / (dur / 60);

            const newScoreRecord = S.score > S.best;
            const newWordsRecord = S.completed > S.bestWords;

            if (newScoreRecord) {
                S.best = S.score;
                saveBest();
            }
            if (newWordsRecord) {
                S.bestWords = S.completed;
                saveBestWords();
            }

            let msg;
            if (newScoreRecord && newWordsRecord) {
                msg = t("msgRecordBoth");
            } else if (newScoreRecord) {
                msg = t("msgRecord");
            } else if (newWordsRecord) {
                msg = t("msgWordsRecord");
            } else if (acc >= 95) {
                msg = t("msgAcc");
            } else if (S.completed >= 20) {
                msg = t("msgRhythm");
            } else {
                msg = t("msgRetry");
            }

            // Experiencia ganada en esta partida y totales del perfil:
            // se suman aquí porque es cuando se da por terminada la partida.
            // El modo Truco o trato descuenta la experiencia que las teclas
            // falladas se han ido tragando durante la partida (ttXpLoss)
            // El modo Encantado no da NI experiencia NI monedas: su partida
            // se cobra solo en caramelos (dar 0 XP lo garantiza aquí mismo)
            const xpGain = encOn() ? 0 : Math.max(0,
                S.completed * 10 + Math.floor(S.score / 10) - ttXpLoss);
            S.xp += xpGain;
            S.gamesPlayed += 1;
            S.wordsTotal += S.completed;
            saveProfileStats();

            // Guardado automático del perfil en cada partida terminada
            saveProfile();

            // Formulario para apuntar la puntuación en el ranking global
            savedScore = false;
            S.rankBusy = false;
            S.rankMsgTxt = "";
            S.rankMsgOff = false;
            if (S.score > 0) newVerifyCode();   // código nuevo para cada puntuación
            // Sin cuenta no hay nombre que escribir: se pide crear un perfil
            if (S.accOpen) closeAccount();   // los resultados se ven sin el panel encima

            // Todo el panel de resultados lo lee Svelte desde este resumen
            S.res = {
                score: S.score,
                words: S.completed,
                acc: acc,
                ppm: Math.round(ppm),
                coins: S.coinsRun,
                // Los caramelos solo se enseñan mientras dura el evento
                candy: S.candyRun,
                xp: xpGain,
                best: S.bestWords,
                msg: msg,
                record: newScoreRecord || newWordsRecord
            };
            S.statusTxt = t("statusEnd");
            typing.blur();
            S.resOpen = true;
        }

        // ---------- Modo tecleo: escribir la palabra completa ----------
        function typeInput() {
            let val = typing.value.toLowerCase();
            if (typing.value !== val) typing.value = val;

            if (val.length > S.word.length) {
                val = val.slice(0, S.word.length);
                typing.value = val;
            }

            // Detecta la primera tecla mal escrita: la rechaza y penaliza
            let bad = -1;
            for (let i = 0; i < val.length; i++) {
                if (val[i] !== S.word[i]) {
                    bad = i;
                    break;
                }
            }

            if (bad !== -1) {
                val = val.slice(0, bad);
                typing.value = val;
                // Ventaja "escudo" del modo Aventura: el fallo no se paga
                if (advShield > 0) {
                    advShield--;
                    S.statusTxt = t("statusShield");
                } else {
                    errors++;
                    // Ventaja "indulgencia": un rato sin que el fallo rompa la racha
                    const indul = S.mode === "aventura" && performance.now() < advGrace;
                    if (!indul) S.streak = 0;
                    S.score = Math.max(0, S.score - 5);
                    shake();
                    S.statusTxt = indul ? t("statusGrace") : t("statusError");
                    // Modo Truco o trato (evento de Halloween): cada tecla
                    // fallada cuesta el DOBLE, en tiempo y en experiencia
                    if (extraActive("truco")) {
                        S.timeLeft = Math.max(0, S.timeLeft - TT_TIME_PENALTY);
                        ttXpLoss += TT_XP_PENALTY;
                        S.statusTxt = t("statusTrucoFail");
                    }
                }
            } else {
                if (val.length > S.prevLen) hits += val.length - S.prevLen;
                S.statusTxt = t("statusOk");
            }

            S.prevLen = val.length;
            S.typedStr = val;
            updateHud();

            if (val === S.word) {
                completeWord();
            }
        }

        // ---------- Modo adivinar: descubrir letras ocultas ----------
        function guessChar(raw) {
            const ch = raw.toLowerCase();
            if (!/^[a-záéíóúüñ]$/.test(ch)) return;       // ignorar espacios y símbolos
            if (S.wrongLetters.includes(ch)) return;         // letra ya fallada
            if (!S.word.includes(ch)) {                      // fallo
                errors++;
                S.streak = 0;
                S.misses++;
                S.score = Math.max(0, S.score - 5);
                S.wrongLetters.push(ch);
                shake();

                if (S.misses >= MAX_MISSES) {
                    S.statusTxt = t("wordFailed") + S.word;
                    newWord();
                } else {
                    S.statusTxt = t("statusError");
                }
                updateHud();
                return;
            }

            // Acierto: revela todas las instancias que seguían ocultas
            let revealed = 0;
            for (let i = 0; i < S.word.length; i++) {
                if (S.word[i] === ch && S.mask[i] === "hidden") {
                    S.mask[i] = "found";
                    revealed++;
                }
            }
            if (revealed === 0) return; // la letra ya se veía: no cuenta

            hits += revealed;
            S.streak++;
            const points = 10 * multiplier() * revealed;
            S.score += points;
            showPoints(points);
            S.statusTxt = t("statusOk");

            updateHud();

            if (!S.mask.includes("hidden")) {
                completeWord();
            }
        }

        // ---------- Entrada del teclado ----------
        // Se anota cada evento de escritura para comprobar al final de la partida
        // que ha sido una persona quien ha escrito (ver checkAutoPlay)
        typing.addEventListener("input", function (e) {
            if (S.state !== "playing" || S.perkOpen) {
                typing.value = "";
                return;
            }
            inputEvents++;
            if (e && e.isTrusted) trustedInput++;

            if (S.mode === "guess") {
                const raw = typing.value;
                typing.value = "";
                for (const ch of raw) {
                    if (S.state !== "playing") break;
                    guessChar(ch);
                }
            } else if (S.mode === "supervivencia") {
                supInput();
            } else {
                typeInput();
            }
        });

        // Teclas reales de la partida: marca de tiempo entre pulsaciones
        typing.addEventListener("keydown", function (e) {
            if (S.state !== "playing") return;
            if (e.isTrusted) trustedKeys++;
            if (!e.repeat) keyStamps.push(performance.now()); // el auto-repetido no cuenta
            // Efecto de tecleo comprado en la tienda: estalla con cada letra
            if (!e.repeat && !S.perkOpen && e.key && e.key.length === 1 && !/\s/.test(e.key)) {
                fxBurst();
            }
            // Supervivencia: Tab cambia el objetivo a la siguiente palabra
            // (sin salir del campo de escritura)
            if (S.mode === "supervivencia" && e.key === "Tab") {
                e.preventDefault();
                supCycle();
            }
        });

        // Pegar o arrastrar texto no vale: hay que teclearlo
        typing.addEventListener("paste", function (e) {
            if (S.state !== "playing") return;
            e.preventDefault();
            pasteTried++;
            S.statusTxt = t("statusNoPaste");
        });
        typing.addEventListener("drop", function (e) {
            if (S.state !== "playing") return;
            e.preventDefault();
            pasteTried++;
        });

        // Barra espaciadora para empezar / reiniciar
        document.addEventListener("keydown", function (e) {
            const destino = e.target || {};
            // Si el foco está en un campo de texto (el nombre del ranking, por
            // ejemplo) la barra escribe un espacio y NO arranca la partida
            const enCampo = !destino.disabled &&
                (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA" ||
                 destino.tagName === "SELECT" || destino.isContentEditable === true);

            if (S.state === "playing") {
                // En plena partida la barra nunca se introduce: las palabras no llevan espacios
                if (e.code === "Space") e.preventDefault();
                return;
            }
            if (e.code === "Space" && !enCampo && destino.tagName !== "BUTTON") {
                e.preventDefault();
                startGame();
            }
        });

        // (el botón Jugar y el clic del logo los llama la vista vía G.a)

        // ---------- Frases del logo: cada toque muestra una distinta ----------
        const LOGO_PHRASES = [
            "arreglo", "IA", "veyon", "va a botarlo", "yo soy la IA", "enseñe su array"
        ];
        const logoBtn = document.getElementById("logoBtn");
        let logoLast = -1;      // índice de la última frase mostrada
        let logoHide = 0;       // temporizador para quitar la frase

        function showLogoPhrase() {
            // Se descarta la anterior: nunca salen dos frases seguidas iguales
            let i = logoLast;
            while (i === logoLast) {
                i = Math.floor(Math.random() * LOGO_PHRASES.length);
            }
            logoLast = i;
            S.logoPhraseTxt = LOGO_PHRASES[i];
            S.logoShow = true;   // la clase «show» la pone Svelte al cambiar la frase

            clearTimeout(logoHide);
            logoHide = setTimeout(function () {
                S.logoShow = false;
            }, 2000);

            if (logoBtn) {
                logoBtn.classList.remove("pop");
                void logoBtn.offsetWidth;
                logoBtn.classList.add("pop");
            }
        }

        // ---------- Guardar la puntuación en el ranking ----------
        // (los avisos los lee Svelte desde rankMsgTxt / rankMsgOff)
        function rankSay(txt, off) {
            S.rankMsgTxt = txt;
            S.rankMsgOff = !!off;
        }

        function saveScore() {
            if (S.state === "playing" || S.rankBusy) return;
            if (savedScore) {
                rankSay(t("rankAlready"));
                return;
            }
            if (S.score <= 0) return;

            // 1) Sin perfil no hay nombre: se avisa y se abre el registro
            if (!S.accSession) {
                rankSay(t("accRankNo"), true);
                openAccount("reg");
                if (accName) { accName.focus(); accName.select(); }
                return;
            }
            const name = S.accSession.n;

            // 2) Nada de escritura automática ni puntuaciones imposibles
            const why = checkAutoPlay();
            if (why.length > 0) {
                rankSay(t("rankBot"), true);
                return;
            }

            // 3) Comprobación humana: el código se teclea con las teclas reales
            if (!verifyHuman()) {
                rankSay(t("rankHuman"), true);
                newVerifyCode();       // código nuevo: no se puede probar a ciegas
                if (verifyInput) verifyInput.focus();
                return;
            }

            const entry = {
                id: currentPlayerId(),   // la cuenta (o el dispositivo) ocupa un puesto
                n: name,
                s: S.score,             // la mejor marca es la que manda
                w: S.completed,
                m: entryMode(),
                d: new Date().toISOString()
            };

            S.rankBusy = true;
            rankSay(t("rankChecking"));

            reserveName(name, entry.id).then(r => {
                if (r.taken) {
                    // El nombre ya es de otro jugador: se avisa sin borrar nada
                    S.rankBusy = false;
                    rankSay(t("rankNameTaken"), true);
                    newVerifyCode();
                    return;
                }
                savePlayerName(name);
                rankSay(t("rankSaving"));
                return uploadScore(entry).then(() => {
                    S.rankBusy = false;
                    // Solo se da por SUBIDA si la marca ha llegado al servidor.
                    // Si la red falló, la puntuación queda en este equipo y el
                    // botón sigue habilitado para volver a intentarlo (antes se
                    // marcaba como guardada y el segundo intento se quedaba en
                    // «ya habías guardado», así que NUNCA se podía subir).
                    const subida = rankData[rankTabOf(entry.m)].online;
                    savedScore = subida;
                    rankSay(subida ? t("rankSaved") : t("rankSavedLocal"), !subida);
                    newVerifyCode();   // el código ya no se puede reutilizar
                    // Se abre el ranking de SU modo (Aventura va al suyo propio)
                    if (!S.rankOpen) toggleRanking(rankTabOf(entry.m));
                });
            }).catch(() => {
                S.rankBusy = false;
                savedScore = false;   // nada llegó al servidor: se puede reintentar
                rankSay(t("rankSavedLocal"), true);
                newVerifyCode();
            });
        }

        // ---------- Inicio ----------
        loadShop();
        loadCandy();        // moneda del evento (caramelos)
        // Variante de Supervivencia de la partida anterior (solo la Encantada
        // se olvida sola si el evento de Halloween ya se ha acabado)
        try {
            const sv = storage.get("teclear.supVariante");
            if (sv === "encantado" || sv === "clasico") S.supVariant = sv;
        } catch (e) { /* sin almacenamiento disponible */ }
        if (S.supVariant === "encantado" && !halloweenOn()) S.supVariant = "clasico";
        achLoad();          // progreso de los logros + recompensas ganadas
        loadProfileStats();
        S.accSession = loadSession();   // si hubo sesión la vez anterior, se restaura
        try {
            const savedBg = storage.get("teclear.fondo");
            if (savedBg && BACKGROUNDS.some(b => b.id === savedBg) && S.ownedBgs.includes(savedBg)) {
                S.bg = savedBg;
            }
        } catch (e) {
            S.bg = "dark";
        }
        // Modo Veyon guardado en los ajustes (oculta logo y fondos General/Ia)
        applyVeyon();
        applyStyle();
        applyFx();
        applyLang();
        if (accName) accName.value = loadPlayerName();   // pre-rellena el nombre
        refreshRanking();   // descarga el ranking compartido (si hay internet)

        // ---------- Superficie de sólo lectura ----------
        // Ni la consola ni ningún script pueden modificar la partida desde aquí:
        // solo hay getters (no existe ningún setter de puntuación, palabras o id).
        Object.defineProperty(window, "Teclea", {
            value: Object.freeze({
                get state() { return S.state; },
                get score() { return S.score; },
                get completed() { return S.completed; },
                get hits() { return hits; },
                get errors() { return errors; },
                get word() { return S.word; },
                get mode() { return entryMode(); },
                get lang() { return S.lang; },
                get savedScore() { return savedScore; },
                get rankResets() { return rankResets; },
                get session() { return S.accSession; },
                get admin() { return esAdmin(); },   // ¿rol de Administrador?
                get caramelos() { return S.caramelos; },   // moneda del evento de Halloween
                get supVariante() { return S.supVariant; },   // variante de Supervivencia
                get xp() { return S.xp; },
                get lives() { return S.supLives; },   // vidas en el modo Supervivencia
                get gamesPlayed() { return S.gamesPlayed; },
                get wordsTotal() { return S.wordsTotal; },
                // Diccionarios (solo lectura): útiles para comprobar las palabras
                dicts: Object.freeze({
                    es: Object.freeze(WORDS.es.slice()),
                    en: Object.freeze(WORDS.en.slice()),
                    mur: Object.freeze(MURCIANO_WORDS.slice())
                }),
                start: function () { startGame(); },
                finish: function () { endGame(); },
                // ¿Actúa la habilidad del fondo id? (en Aventura nunca actúa)
                fondoActivo: function (id) { return bgPower(id); },
                checkAutoPlay: function (est) { return checkAutoPlay(est); },
                normalizeRank: function (lista, cortes, tab) { return normalizeRank(lista, cortes, tab); },
                validEntry: function (fila) { return validEntry(fila); },
                sealOf: function (fila) { return sealOf(fila); },
                reserveName: function (n, id) { return reserveName(n, id); },
                fetchResets: function (force) { return fetchResets(force); },
                refreshRanking: function (tab) { return refreshRanking(tab); },
                // Los dos rankings: a qué tabla pertenece una marca y sus filas
                rankTabDe: function (m) { return rankTabOf(m); },
                rankDe: function (tab) {
                    const t = (tab === "aventura") ? "aventura" : "normal";
                    return Object.freeze({
                        entries: Object.freeze(rankData[t].entries.slice()),
                        online: rankData[t].online,
                        loaded: rankData[t].loaded,
                        tampered: rankData[t].tampered
                    });
                },
                // Equilibrio de Aventura (solo lectura): velocidad del reloj y
                // palabras que faltan para la próxima parada de ventaja
                velocidadReloj: function () { return tickSpeed(); },
                proximaVentaja: function () { return perkEvery(); },
                paradasHechas: function () { return advStops; },
                // Perfiles (solo lectura de fuera: registrar/entrar/salir)
                sha256: function (s) { return sha256hex(String(s)); },
                derivePass: function (p, s) { return derivePass(String(p), String(s)); },
                profileData: function () { return snapshotData(); },
                loadProfiles: function () { return loadProfilesLocal(); },
                register: function (n, p, p2) { return doRegister(cleanName(n), p, p2); },
                login: function (n, p) { return doLogin(cleanName(n), p); },
                logout: function () { return doLogout(); },
                saveProfile: function () { return saveProfile(); },
                openAccount: function (m) { openAccount(m); },
                closeAccount: function () { closeAccount(); }
            }),
            writable: false,
            configurable: false
        });
}
