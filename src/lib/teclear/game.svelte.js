import imgLogo from '#lib/img/estesoTeclea.png';
import { getSetting, setSetting } from './settings.js';
import { S } from './state.svelte.js';
import { storage } from './storage.js';
import { fx } from './services/fx.js';
import { uiLang, t } from './services/i18n.js';
import { eco } from './services/economy.js';
import { prog } from './services/progression.js';
import * as identity from './services/identity.js';
import { ranking } from './services/ranking.svelte.js';
import { acc } from './services/account.js';
import { modes } from './modes/index.js';
import {
    GAME_TIME, MAX_MISSES, SPEEDRUN_MS, BONUS_TIME_ELPRICO, SOUP_GIVEN,
    SUP_LIVES, SUP_XP_WORD,
    RANK_URL, RANK_ADV_URL, NAMES_URL, RESETS_URL, RANK_MAX, NAMES_MAX,
    RANK_TIMEOUT, NAME_MAX, MAX_SCORE, MAX_WORDS, PTS_PER_WORD, SCORE_BOOST,
    SEAL_SALT, PROFILES_URL, PASS_MIN, KDF_ROUNDS
} from './data/constants.js';
import {
    WORDS, MURCIANO_WORDS, PICANTE, PHP_WORDS, ANDALUZ_WORDS,
    MINECRAFT_WORDS, HALLOWEEN_WORDS
} from './data/words.js';

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
            // letras acertadas en la partida Encantada
           // teclas / letras acertadas
         // fallos
        
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
        let savedScore = false;    // la puntuación de esta partida ya se ha guardado
        // instante de cada tecla real pulsada
       // eventos "input" recibidos durante la partida
      // ... de ellos, llegados del teclado de verdad
       // teclas reales (isTrusted) durante la partida
        // intentos de pegar texto en plena partida

        let gameStartAt = 0;       // instante en que empezó la partida
        let gameDuration = 0;      // duración real de la partida (segundos)
       // ms que el reloj ha estado en pausa (elegir ventaja)
          // instante en que empezó la pausa actual
         // fallos que el escudo todavía absorbe
          // palabras cortas que quedan por regalar
         // fin de la congelación (performance.now)
         // fin del doble de puntos (performance.now)
          // fin del turbo de tiempo (performance.now)
          // fin del doble de monedas (performance.now)
         // salvavidas guardados para el final
     // segundos ganados con las palabras
           // fin de la "racha dorada" (multiplicador x5)
          // fin de la "indulgencia" (fallo sin perder racha)
         // palabras que no cuentan para subir de nivel
     // completed en el momento del "remanso"
          // ventajas que se pueden elegir en esta parada
      // paradas dobles pendientes ("doble elección")
          // paradas de ventaja ya celebradas
  // palabras escritas en las que toca parar

       // id incremental de cada palabra en pantalla
      // palabra a la que apunta el teclado
        // instante en que empezó la partida (dificultad)

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
            coinsTxt:    () => eco.fmtCoins(S.coins),
            accHintTxt:  () => S.accSession ? t("accDataHint") : t("accHint"),
            btnRegTxt:   () => S.accSession ? t("btnProfile") : t("btnRegister"),
            candyTxt:    () => eco.fmtCandy(S.caramelos),
            achCountTxt: () => Object.values(S.achData).filter(d => d.done).length +
                             "/" + ACHIEVEMENTS.length,
            invCountTxt: () => eco.invItems().length,

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
            esAdmin:     () => acc.esAdmin(),
            accBusy:     () => S.accBusy,
            accWhoTxt:   () => S.accSession ? t("accWho") + S.accSession.n : "-",
            accSubmitTxt:() => S.accMode === "reg" ? t("accSubmitReg") : t("accSubmitLogin"),
            accSwitchTxt:() => S.accMode === "reg" ? t("accSwitchToLogin") : t("accSwitchToReg"),
            rankWhoTxt:  () => S.accSession ? t("accRankWith") + S.accSession.n : t("accRankNo"),
            perkOpen:    () => S.perkOpen,
            perkOpts:    () => S.perkOpts,
            supTargetN:  () => modes.supervivencia.target ? modes.supervivencia.target.n : -1,
            supLives:    () => S.supLives,
            supMax:      () => SUP_LIVES,
            picErr:      () => S.picErr,

            // ---------- View-models (listas que la UI recorre) ----------
            // El tablero: qué tipo de contenido toca y sus datos
            boardView:   () => {
                if (S.state !== "playing") {
                    return { kind: "hint", txt: S.state === "over" ? t("boardEnd") : t("boardIdle") };
                }
                // Los modos con tablero propio devuelven su vista
                const mv = modes[S.mode].boardView();
                if (mv) return mv;
                return { kind: "letters", letters: S.word.split("").map((ch, i) => ({
                    ch: ch,
                    cls: i < S.typedStr.length ? (S.typedStr[i] === ch ? "ok" : "bad")
                         : (i === S.typedStr.length ? "cursor" : "")
                })) };
            },
            // Vidas de Supervivencia / fallos de Adivinar, en el mismo
            // hueco: cada modo devuelve lo suyo
            missesView:  () => modes[S.mode].missesView() ?? { kind: "off" },
            maxMisses:   () => MAX_MISSES,
            // Efectos activos del modo Aventura (los calcula el modo; se
            // recalculan con cada tick porque leen timeLeft aunque no lo muestren)
            advChips:    () => {
                S.timeLeft;
                if (S.mode !== "aventura") return [];
                return modes.aventura.chips();
            },
            // Tarjetas de la tienda (compra; usarse es cosa del Inventario)
            shopFonts:   () => FONT_STYLES.map(st => ({
                id: st.id, cls: st.cls, font: st.font,
                name: uiLang() === "es" ? st.es : st.en,
                equipped: S.equipped === st.id,
                own: S.owned.includes(st.id), ach: !!st.ach,
                price: st.price, cant: !acc.esAdmin() && S.coins < st.price
            })),
            shopBgs:     () => BACKGROUNDS
                .filter(b => !b.event || (!S.halloween && S.ownedBgs.includes(b.id)))
                .map(b => ({
                    id: b.id, icon: b.icon || "🌙",
                    img: eco.veyonHiddenBg(b.id) ? VEYON_PLACEHOLDER : b.img,
                    name: uiLang() === "es" ? b.es : b.en,
                    desc: uiLang() === "es" ? b.descEs : b.descEn,
                    equipped: S.bg === b.id,
                    own: S.ownedBgs.includes(b.id), ach: !!b.ach,
                    price: b.price, cant: !acc.esAdmin() && S.coins < b.price
                })),
            shopExtras:  () => EXTRAS
                .filter(x => !x.event || (!S.halloween && eco.ownsExtra(x.id)))
                .map(x => ({
                    id: x.id, icon: x.icon,
                    name: uiLang() === "es" ? x.es : x.en,
                    desc: uiLang() === "es" ? x.descEs : x.descEn,
                    on: eco.ownsExtra(x.id) && !!S.extraOn[x.id],
                    own: eco.ownsExtra(x.id),
                    price: x.price, cant: !acc.esAdmin() && S.coins < x.price
                })),
            shopFxs:     () => TYPE_EFFECTS
                .filter(f => !f.event || (!S.halloween && eco.ownsFx(f.id)))
                .map(f => ({
                    id: f.id, icon: f.icon, art: f.art, color: f.color,
                    name: uiLang() === "es" ? f.es : f.en,
                    desc: uiLang() === "es" ? f.descEs : f.descEn,
                    on: eco.ownsFx(f.id) && S.fxEquipped === f.id,
                    own: eco.ownsFx(f.id), ach: !!f.ach,
                    price: f.price, cant: !acc.esAdmin() && S.coins < f.price
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
                    cant: !acc.esAdmin() && S.caramelos < b.price
                });
                const f = eco.fxById("sangre");
                if (f) out.push({
                    kind: "fx", id: f.id, icon: f.icon, color: f.color,
                    name: en ? f.en : f.es, desc: en ? f.descEn : f.descEs,
                    on: eco.ownsFx(f.id) && S.fxEquipped === f.id,
                    own: eco.ownsFx(f.id), price: f.price,
                    cant: !acc.esAdmin() && S.caramelos < f.price
                });
                const x = EXTRAS.find(e => e.id === "truco");
                if (x) out.push({
                    kind: "extra", id: x.id, icon: x.icon,
                    name: en ? x.en : x.es, desc: en ? x.descEn : x.descEs,
                    on: eco.ownsExtra(x.id) && !!S.extraOn[x.id],
                    own: eco.ownsExtra(x.id), price: x.price,
                    cant: !acc.esAdmin() && S.caramelos < x.price
                });
                return out;
            },
            // Inventario seccionado (mismas secciones que la tienda + evento)
            invSections: () => {
                const items = eco.invItems();
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
                    done: !!d.done, reward: prog.rewardLabel(a)
                };
            }),
            // Las dos tablas de ranking y quién soy en ellas
            rank:        () => ranking.rankData,
            myId:        () => identity.currentPlayerId(),
            rankDate:    () => ranking.rankDate,
            // Desplegables de variantes (extras de Tecleo / Supervivencia)
            modeOptions: () => [{ v: "", txt: t("modeClassic") }]
                .concat(EXTRAS.filter(x => eco.ownsExtra(x.id))
                    .map(x => ({ v: x.id, txt: x.icon + " " + (uiLang() === "es" ? x.es : x.en) }))),
            modeSel:     () => eco.activeExtraId(),
            modeSelDis:  () => EXTRAS.every(x => !eco.ownsExtra(x.id)) ||
                             S.mode !== "type" || S.state === "playing",
            modeSelTitle:() => EXTRAS.every(x => !eco.ownsExtra(x.id)) ? t("modeSelectEmpty")
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
                    hidden: eco.veyonHiddenBg(b.id),
                    label: (b.id === "elprico" ? "😎 " : b.icon ? b.icon + " " : "🎨 ") +
                           (uiLang() === "es" ? b.es : b.en),
                    active: S.bg === b.id
                })),
            francoHidden:() => eco.veyonHiddenBg("franco"),
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
            chooseExtra: eco.chooseExtra,
            setSupVariant: setSupVariant,
            toggleVeyon: () => setVeyon(!S.veyon),
            toggleShop: toggleShop,
            toggleInv: toggleInv,
            toggleLogros: toggleLogros,
            toggleRanking: () => toggleRanking(),
            toggleAccount: acc.toggleAccount,
            closeAccount: acc.closeAccount,
            submitAccount: acc.submitAccount,
            accSwitchMode: acc.accSwitchMode,
            accSave: acc.accSaveProfile,
            accOut: () => acc.doLogout(),
            buyStyle: id => eco.buyStyle(FONT_STYLES.find(s => s.id === id)),
            buyBg: id => eco.buyBg(BACKGROUNDS.find(b => b.id === id)),
            buyExtra: id => eco.buyExtra(EXTRAS.find(x => x.id === id)),
            buyFx: id => eco.buyFx(eco.fxById(id)),
            startGame: startGame,
            saveScore: saveScore,
            choosePerk: p => modes.aventura.choosePerk(p),
            supAim: n => {
                modes.supervivencia.aimByN(n);
                if (typing) typing.focus();
            },
            verifyKey: acc.verifyKey,
            verifyInput: acc.verifyInputText,
            verifyPaste: acc.verifyPaste,
            picError: () => { S.picErr = true; },
            showLogoPhrase: showLogoPhrase
        };


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
        const rankingEl = document.getElementById("ranking");
        const verifyInput = document.getElementById("verifyInput");

        // Los efectos visuales viven en su servicio: se le inyectan los
        // elementos que toca y las consultas que necesita del juego
        fx.bind({
            stage, board, typing,
            getSupTarget: () => modes.supervivencia.target,
            getActiveFx: () => eco.activeFx(),
        });
        fx.mount();

        // La economía (monedas, tienda, inventario) también vive fuera:
        // recibe las consultas que necesita de otros dominios
        eco.bind({
            isAdmin: () => acc.esAdmin(),
            achAdd: (id, n) => prog.achAdd(id, n),
            getExtraRun: () => extraRun,
            resetExtraRun: () => { extraRun = null; },
            applyLang,
        });

        // La cuenta (perfiles, sesión, verificación) recibe sus elementos
        // del panel y las consultas que necesita del ciclo de juego
        acc.bind({
            perfil, accName, accPass, accPass2, verifyInput,
            applyLang,
            saveScore,
            getHits: () => S.hits,
            getGameDuration: () => gameDuration,
            getAdvTimeGained: () => modes.aventura.timeGained,
        });

        // Los modos reciben la interfaz del motor: elementos que tocan
        // y operaciones compartidas del ciclo de juego
        Object.values(modes).forEach(m => {
            m.engine = {
                typing, board,
                nextWord, newWord, endGame, updateHud, pagaPalabra,
                typeInput, completeWord, level, multiplier, soupReveal
            };
        });
























        // ---------- Roles de usuario ----------
        // Alvaro tiene el rol de ADMINISTRADOR: dinero infinito para poder
        // probarlo todo. El rol se reconoce por el nombre de la cuenta o por
        // el nombre del jugador, normalizados con nameKey() (sin acentos y en
        // minúsculas), así que «Alvaro», «ÁLVARO» o «alvaro» valen igual.
        const ADMIN_NAMES = ["alvaro"];















        // (los clics del panel de cuenta los llaman los componentes vía G.a)

        // ---------- Verificación humana antes de guardar ----------
        // Código aleatorio de 4 caracteres que hay que escribir con teclas REALES.
        // La comprobación no mira el texto del campo (eso lo rellena un script en
        // un pistoletazo), sino las pulsaciones que han ido quedando registradas:
        // pegar el texto o rellenarlo con eventos sintéticos no sirve de nada.
        const VERIFY_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";












        // Dibuja las dos tablas: la global (modos clásicos) y la de Aventura.
        // Ambas muestran los MISMOS datos: posición, nombre, puntos, palabras
        // y fecha; solo cambia el documento del que salen las filas.
        // (Las dos tablas de ranking las pinta Svelte desde G.rank; aquí
        //  solo queda abrir/cerrar el panel y refrescar los datos)
        function toggleRanking(tab) {
            if (S.state === "playing") return;
            S.rankOpen = !S.rankOpen;
            if (S.rankOpen) {
                ranking.refreshRanking();
                // Si se guarda una marca, su tabla se resalta (una partida de
                // Aventura se mira en el ranking de Aventura, no en el global)
                if (tab) S.rankFocus = tab;
                // El panel queda por debajo: se lleva a la vista para que se note
                if (rankingEl && rankingEl.scrollIntoView) {
                    rankingEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
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
            fx.syncLetterSoup(!sinFondos && S.bg === "sopa");   // letras rebotando solo con ese fondo
            fx.syncHacker(!sinFondos && S.bg === "hacker");     // binario verde solo con ese fondo

            S.best = prog.loadBest();
            S.bestWords = prog.loadBestWords();
            eco.applyExtras();   // acento de color de los extras activos

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



        // ---------- Utilidades ----------
        function level() {
            // Los modos con dificultad propia la calculan ellos
            // (Aventura acelera con las palabras, Supervivencia con el reloj)
            const lv = modes[S.mode].level();
            if (lv != null) return lv;
            return 1 + Math.floor(S.completed / 5);
        }


        // Velocidad a la que corre el reloj: en Aventura va acelerando con el
        // nivel (hasta el doble), así que el tiempo se consume cada vez más
        // deprisa justo cuando las palabras son más largas y valen menos.
        // En el resto de modos el reloj siempre va a velocidad normal.
        function tickSpeed() {
            // En Aventura el reloj acelera con el nivel (el modo lo calcula);
            // en el resto siempre va a velocidad normal
            return modes[S.mode].tickSpeed();
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
            if (eco.extraActive("php")) propias.push(PHP_WORDS);
            if (eco.extraActive("andaluz")) propias.push(ANDALUZ_WORDS);
            if (eco.extraActive("cubico")) propias.push(MINECRAFT_WORDS);
            // Modo Truco o trato (evento de Halloween): palabras terroríficas
            if (eco.extraActive("truco")) {
                propias.push(S.lang === "en" ? HALLOWEEN_WORDS.en : HALLOWEEN_WORDS.es);
            }

            let pool;
            if (eco.extraActive("caos")) {
                // Caos: todo mezclado, listas propias incluidas
                pool = WORDS.es.concat(WORDS.en, MURCIANO_WORDS);
                if (eco.extraActive("picante")) pool = pool.concat(PICANTE.es, PICANTE.en);
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
            if (!eco.extraActive("picante")) return base;
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
            const candidatos = EXTRAS.filter(x => x.id !== "azar" && eco.ownsExtra(x.id));
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



        function nextWord() {
            // El modo puede traer su propia palabra (Imágenes elige una
            // imagen y pide la palabra que la nombra)
            const picked = modes[S.mode].pickWord();
            if (picked) return picked;
            const list = wordPool();
            const lvl = level();
            let pool;
            // El modo puede imponer su filtro (ventaja "camino corto" de
            // Aventura: palabras cortas mientras dure)
            const filtered = modes[S.mode].filterPool(list);
            if (filtered) pool = filtered;
            else if (lvl <= 1) pool = list.filter(w => w.length <= 5);
            else if (lvl <= 3) pool = list.filter(w => w.length <= 7);
            else if (lvl <= 6) pool = list.filter(w => w.length >= 5);
            else pool = list.filter(w => w.length >= 6);

            if (pool.length === 0) pool = list;

            let w;
            do {
                w = pool[Math.floor(Math.random() * pool.length)];
            } while (w === S.word && pool.length > 1);
            // Modo Espejo: la palabra se pide del revés
            return eco.extraActive("espejo") ? mirrorWord(w) : w;
        }

        function multiplier() {
            // El modo puede pisar el multiplicador (ventaja "racha
            // dorada" de Aventura: clavado en x5 mientras dure)
            const base = Math.min(1 + Math.floor(S.streak / 4), 5);
            return modes[S.mode].multiplier(base);
        }


        // Duración de la partida: el fondo Elprico regala 15 segundos extra
        function gameTime() {
            return GAME_TIME + (eco.bgPower("elprico") ? BONUS_TIME_ELPRICO : 0);
        }

        // Habilidad de Sopa de Letras: letras que la palabra trae ya puestas
        // (nunca tantas como para completar la palabra de golpe)
        function soupGiven() {
            if (!eco.bgPower("sopa")) return 0;
            return Math.min(SOUP_GIVEN, Math.max(0, S.word.length - 1));
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


        function updateHud() {
            // (todo el HUD lo pinta Svelte leyendo G; el pulso repinta el
            // campo de Supervivencia, cuyas cajas se mueven a cada tick)
            S.supTick++;
            // Logro «Hacker»: se anota la mejor puntuación de UNA partida.
            // Este es el sitio donde se refleja el marcador de todos los
            // modos, así que aquí se comprueba la meta de 10.000 puntos.
            prog.achBest("hacker", S.score);
        }














        // (El tablero — letras, foto del modo Imágenes, máscara de Adivinar
        //  y el campo de Supervivencia — lo dibuja Svelte desde G.boardView;
        //  las vidas y los fallos, desde G.missesView)


        // ---------- Ciclo de juego ----------
        function newWord() {
            typing.value = "";
            S.typedStr = "";
            S.prevLen = 0;
            S.word = nextWord();
            // El modo prepara su tablero (Adivinar monta la máscara,
            // Supervivencia suelta la primera palabra apuntada)
            modes[S.mode].onNewWord();
            if (S.mode === "type" || S.mode === "aventura") {
                soupPrefill();   // letras que deja Sopa de Letras
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
            if (S.mode === "type" && eco.extraActive("cubico")) {
                const w = S.word.toLowerCase();
                if (w === "creeper" || w === mirrorWord("creeper")) prog.achAdd("polvo", 1);
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
            prog.achBest("speed", srWords);
            const mult = multiplier();
            // Habilidades del fondo: Ia triplica puntos y monedas en las
            // palabras largas (más de 7 letras) y General dobla las monedas
            const largo = S.word.length > 7;
            const triple = eco.bgPower("esteso") && largo;
            // Multiplicadores propios del modo (ventana de "puntos x2")
            const points = S.word.length * 10 * mult * (triple ? SCORE_BOOST : 1) * modes[S.mode].scoreMult();
            S.score += points;
            fx.showPoints(points);
            // Monedas al estilo experiencia: la racha multiplica lo que ganas.
            // Cada palabra sin errores paga 1 moneda por cada nivel de racha
            // (x1 al principio y hasta x5 con la racha larga).
            const coinGain = mult *
                (triple ? SCORE_BOOST : 1) *
                (eco.bgPower("franco") ? 2 : 1) *
                // Multiplicador propio del modo (ventana de "monedas dobles")
                modes[S.mode].coinMult() *
                // Modo Truco o trato (evento de Halloween): DOBLE de monedas
                (eco.extraActive("truco") ? 2 : 1);
            eco.giveCoins(coinGain);
            fx.showCoin(coinGain);
            // Recompensa propia del modo (Supervivencia: XP en caliente;
            // Aventura: segundos al cronómetro)
            modes[S.mode].onReward(points);
        }

        function completeWord() {
            pagaPalabra();
            newWord();
            // El modo reacciona a la palabra completada (Aventura: cada
            // ciertas palabras hay una parada para elegir una ventaja)
            modes[S.mode].onWordComplete();
        }

        // (La vida perdida cuando se escapa una palabra la resta supEscape(),
        //  en el bloque del modo Supervivencia)

        function startGame() {
            if (S.state === "playing") return;

            S.state = "playing";
            S.score = 0;
            S.streak = 0;
            S.hits = 0;
            S.errors = 0;
            S.completed = 0;
            S.prevLen = 0;
            S.misses = 0;
            S.wrongLetters = [];
            ttXpLoss = 0;   // experiencia robada por fallos (Truco o trato)
            S.candyRun = 0;   // caramelos ganados en esta partida
            // Cada modo arranca su parte (vidas, tablero, clase del body…)
            modes[S.mode].enter();
            // El modo Aventura se juega contra un cronómetro propio: 50 s
            // En Supervivencia el reloj es el de la palabra apuntada
            S.timeLeft = modes[S.mode].timerStart() ?? gameTime();
            S.coinsRun = 0;
            // Telemetría anti-automatización: se reinicia en cada partida
            acc.keyStamps = [];
            acc.inputEvents = 0;
            acc.trustedInput = 0;
            acc.trustedKeys = 0;
            acc.pasteTried = 0;
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
            acc.closeAccountOnPlay();   // el panel de perfil también

            S.resOpen = false;
            S.startTxt = t("btnRestart");

            // Modo Al azar: se sortean los extras de ESTA partida y se
            // muestran en el tablero antes de que salga la primera palabra
            let azarTxt = "";
            if (eco.extraActive("azar")) {
                const elegidos = rollRandomExtras();
                eco.applyExtras();   // el tablero se ilumina con los modos elegidos
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
            if (eco.extraActive("truco")) S.statusTxt = t("statusTruco");
            // Aviso de la habilidad que aporta el fondo equipado
            // (en Aventura no actúa ningún fondo: el modo lleva el suyo)
            const poder = eco.bgPowerDesc();
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
            // Modo Aventura: mientras se elige ventaja el reloj no corre
            if (S.perkOpen) {
                lastTick = now;
                return;
            }
            // Los modos con pulso propio se ocupan solos (Supervivencia
            // mueve su campo, Aventura su congelación y su salvavidas)
            const dt = now - lastTick;
            if (modes[S.mode].tick(now, dt)) {
                lastTick = now;
                return;
            }
            // El tiempo que queda se consume a la velocidad del modo
            // (Aventura acelera con el nivel; el resto, velocidad normal)
            S.timeLeft -= dt / 1000 * tickSpeed();
            lastTick = now;

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
                ? Math.max(0, (Date.now() - gameStartAt - modes[S.mode].pausedMs()) / 1000)
                : gameTime();
            S.state = "over";
            // Cada modo retira lo suyo (el tablero de Supervivencia, la
            // pantalla grande, las ventanas de ventajas…)
            modes[S.mode].exit();
            // Modo Al azar: al acabar se olvida lo sorteado en esta partida
            if (extraRun) {
                extraRun = null;
                eco.applyExtras();
            }
            S.startTxt = t("btnAgain");

            const total = S.hits + S.errors;
            const accPct = total === 0 ? 100 : Math.round((S.hits / total) * 100);
            // Los ppm se calculan sobre lo que duró de verdad la partida
            // (Aventura y Supervivencia no tienen duración fija: usan la real)
            const fija = S.mode === "aventura" || S.mode === "supervivencia";
            const dur = (fija && gameDuration > 0) ? gameDuration : gameTime();
            const ppm = S.completed / (dur / 60);

            const newScoreRecord = S.score > S.best;
            const newWordsRecord = S.completed > S.bestWords;

            if (newScoreRecord) {
                S.best = S.score;
                prog.saveBest();
            }
            if (newWordsRecord) {
                S.bestWords = S.completed;
                prog.saveBestWords();
            }

            let msg;
            if (newScoreRecord && newWordsRecord) {
                msg = t("msgRecordBoth");
            } else if (newScoreRecord) {
                msg = t("msgRecord");
            } else if (newWordsRecord) {
                msg = t("msgWordsRecord");
            } else if (accPct >= 95) {
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
            prog.saveProfileStats();

            // Guardado automático del perfil en cada partida terminada
            acc.saveProfile();

            // Formulario para apuntar la puntuación en el ranking global
            savedScore = false;
            S.rankBusy = false;
            S.rankMsgTxt = "";
            S.rankMsgOff = false;
            if (S.score > 0) acc.newVerifyCode();   // código nuevo para cada puntuación
            // Sin cuenta no hay nombre que escribir: se pide crear un perfil
            if (S.accOpen) acc.closeAccount();   // los resultados se ven sin el panel encima

            // Todo el panel de resultados lo lee Svelte desde este resumen
            S.res = {
                score: S.score,
                words: S.completed,
                acc: accPct,
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
                // El modo puede absorber el fallo (escudo de Aventura) o
                // dejarlo pasar sin romper la racha (indulgencia)
                const absorbed = modes[S.mode].onBadKey();
                if (absorbed === "shield") {
                    S.statusTxt = t("statusShield");
                } else {
                    S.errors++;
                    if (absorbed !== "grace") S.streak = 0;
                    S.score = Math.max(0, S.score - 5);
                    fx.shake();
                    S.statusTxt = absorbed === "grace" ? t("statusGrace") : t("statusError");
                    // Modo Truco o trato (evento de Halloween): cada tecla
                    // fallada cuesta el DOBLE, en tiempo y en experiencia
                    if (eco.extraActive("truco")) {
                        S.timeLeft = Math.max(0, S.timeLeft - TT_TIME_PENALTY);
                        ttXpLoss += TT_XP_PENALTY;
                        S.statusTxt = t("statusTrucoFail");
                    }
                }
            } else {
                if (val.length > S.prevLen) S.hits += val.length - S.prevLen;
                S.statusTxt = t("statusOk");
            }

            S.prevLen = val.length;
            S.typedStr = val;
            updateHud();

            if (val === S.word) {
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
            acc.inputEvents++;
            if (e && e.isTrusted) acc.trustedInput++;

            // Cada modo procesa la entrada a su manera (Adivinar letra
            // a letra, Supervivencia contra la palabra apuntada…)
            modes[S.mode].input();
        });

        // Teclas reales de la partida: marca de tiempo entre pulsaciones
        typing.addEventListener("keydown", function (e) {
            if (S.state !== "playing") return;
            if (e.isTrusted) acc.trustedKeys++;
            if (!e.repeat) acc.keyStamps.push(performance.now()); // el auto-repetido no cuenta
            // Efecto de tecleo comprado en la tienda: estalla con cada letra
            if (!e.repeat && !S.perkOpen && e.key && e.key.length === 1 && !/\s/.test(e.key)) {
                fx.fxBurst();
            }
            // Teclas propias del modo (Supervivencia: Tab cambia el
            // objetivo a la siguiente palabra sin salir del campo)
            modes[S.mode].keydown(e);
        });

        // Pegar o arrastrar texto no vale: hay que teclearlo
        typing.addEventListener("paste", function (e) {
            if (S.state !== "playing") return;
            e.preventDefault();
            acc.pasteTried++;
            S.statusTxt = t("statusNoPaste");
        });
        typing.addEventListener("drop", function (e) {
            if (S.state !== "playing") return;
            e.preventDefault();
            acc.pasteTried++;
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
                acc.openAccount("reg");
                if (accName) { accName.focus(); accName.select(); }
                return;
            }
            const name = S.accSession.n;

            // 2) Nada de escritura automática ni puntuaciones imposibles
            const why = acc.checkAutoPlay();
            if (why.length > 0) {
                rankSay(t("rankBot"), true);
                return;
            }

            // 3) Comprobación humana: el código se teclea con las teclas reales
            if (!acc.verifyHuman()) {
                rankSay(t("rankHuman"), true);
                acc.newVerifyCode();       // código nuevo: no se puede probar a ciegas
                if (verifyInput) verifyInput.focus();
                return;
            }

            const entry = {
                id: identity.currentPlayerId(),   // la cuenta (o el dispositivo) ocupa un puesto
                n: name,
                s: S.score,             // la mejor marca es la que manda
                w: S.completed,
                m: ranking.entryMode(),
                d: new Date().toISOString()
            };

            S.rankBusy = true;
            rankSay(t("rankChecking"));

            acc.reserveName(name, entry.id).then(r => {
                if (r.taken) {
                    // El nombre ya es de otro jugador: se avisa sin borrar nada
                    S.rankBusy = false;
                    rankSay(t("rankNameTaken"), true);
                    acc.newVerifyCode();
                    return;
                }
                identity.savePlayerName(name);
                rankSay(t("rankSaving"));
                return ranking.uploadScore(entry).then(() => {
                    S.rankBusy = false;
                    // Solo se da por SUBIDA si la marca ha llegado al servidor.
                    // Si la red falló, la puntuación queda en este equipo y el
                    // botón sigue habilitado para volver a intentarlo (antes se
                    // marcaba como guardada y el segundo intento se quedaba en
                    // «ya habías guardado», así que NUNCA se podía subir).
                    const subida = ranking.rankData[ranking.rankTabOf(entry.m)].online;
                    savedScore = subida;
                    rankSay(subida ? t("rankSaved") : t("rankSavedLocal"), !subida);
                    acc.newVerifyCode();   // el código ya no se puede reutilizar
                    // Se abre el ranking de SU modo (Aventura va al suyo propio)
                    if (!S.rankOpen) toggleRanking(ranking.rankTabOf(entry.m));
                });
            }).catch(() => {
                S.rankBusy = false;
                savedScore = false;   // nada llegó al servidor: se puede reintentar
                rankSay(t("rankSavedLocal"), true);
                acc.newVerifyCode();
            });
        }

        // ---------- Inicio ----------
        eco.loadShop();
        eco.loadCandy();        // moneda del evento (caramelos)
        // Variante de Supervivencia de la partida anterior (solo la Encantada
        // se olvida sola si el evento de Halloween ya se ha acabado)
        try {
            const sv = storage.get("teclear.supVariante");
            if (sv === "encantado" || sv === "clasico") S.supVariant = sv;
        } catch (e) { /* sin almacenamiento disponible */ }
        if (S.supVariant === "encantado" && !halloweenOn()) S.supVariant = "clasico";
        prog.achLoad();          // progreso de los logros + recompensas ganadas
        prog.loadProfileStats();
        S.accSession = acc.loadSession();   // si hubo sesión la vez anterior, se restaura
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
        eco.applyStyle();
        eco.applyFx();
        applyLang();
        if (accName) accName.value = identity.loadPlayerName();   // pre-rellena el nombre
        ranking.refreshRanking();   // descarga el ranking compartido (si hay internet)

        // ---------- Superficie de sólo lectura ----------
        // Ni la consola ni ningún script pueden modificar la partida desde aquí:
        // solo hay getters (no existe ningún setter de puntuación, palabras o id).
        Object.defineProperty(window, "Teclea", {
            value: Object.freeze({
                get state() { return S.state; },
                get score() { return S.score; },
                get completed() { return S.completed; },
                get hits() { return S.hits; },
                get errors() { return S.errors; },
                get word() { return S.word; },
                get mode() { return ranking.entryMode(); },
                get lang() { return S.lang; },
                get savedScore() { return savedScore; },
                get rankResets() { return ranking.rankResets; },
                get session() { return S.accSession; },
                get admin() { return acc.esAdmin(); },   // ¿rol de Administrador?
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
                fondoActivo: function (id) { return eco.bgPower(id); },
                checkAutoPlay: function (est) { return acc.checkAutoPlay(est); },
                normalizeRank: function (lista, cortes, tab) { return ranking.normalizeRank(lista, cortes, tab); },
                validEntry: function (fila) { return ranking.validEntry(fila); },
                sealOf: function (fila) { return ranking.sealOf(fila); },
                reserveName: function (n, id) { return acc.reserveName(n, id); },
                fetchResets: function (force) { return ranking.fetchResets(force); },
                refreshRanking: function (tab) { return ranking.refreshRanking(tab); },
                // Los dos rankings: a qué tabla pertenece una marca y sus filas
                rankTabDe: function (m) { return ranking.rankTabOf(m); },
                rankDe: function (tab) {
                    const t = (tab === "aventura") ? "aventura" : "normal";
                    return Object.freeze({
                        entries: Object.freeze(ranking.rankData[t].entries.slice()),
                        online: ranking.rankData[t].online,
                        loaded: ranking.rankData[t].loaded,
                        tampered: ranking.rankData[t].tampered
                    });
                },
                // Equilibrio de Aventura (solo lectura): velocidad del reloj y
                // palabras que faltan para la próxima parada de ventaja
                velocidadReloj: function () { return tickSpeed(); },
                proximaVentaja: function () { return modes.aventura.perkEvery(); },
                paradasHechas: function () { return modes.aventura.stops; },
                // Perfiles (solo lectura de fuera: registrar/entrar/salir)
                sha256: function (s) { return identity.sha256hex(String(s)); },
                derivePass: function (p, s) { return identity.derivePass(String(p), String(s)); },
                profileData: function () { return acc.snapshotData(); },
                loadProfiles: function () { return acc.loadProfilesLocal(); },
                register: function (n, p, p2) { return acc.doRegister(identity.cleanName(n), p, p2); },
                login: function (n, p) { return acc.doLogin(identity.cleanName(n), p); },
                logout: function () { return acc.doLogout(); },
                saveProfile: function () { return acc.saveProfile(); },
                openAccount: function (m) { acc.openAccount(m); },
                closeAccount: function () { acc.closeAccount(); }
            }),
            writable: false,
            configurable: false
        });
}
