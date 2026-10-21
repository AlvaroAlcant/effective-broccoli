// Estado reactivo del juego: una única instancia compartida por
// engine, modos, servicios y componentes. Vive en el módulo (no en
// window), así que no se puede tocar desde la consola del navegador.
import { getSetting } from './settings.js';
import { storage } from './storage.js';
import { GAME_TIME, SUP_LIVES } from './data/constants.js';
import { EVENTS, eventCountTxt, initialEventId } from './data/events.js';

// Evento al primer render, ANTES de que monte el EventService: así la
// barra de Halloween ya nace visible con su cuenta atrás y no hace pop.
// Mismo criterio que el script inline de app.html.
const evIni = (() => {
    try {
        const nombre = String(storage.get("teclear.nombre") || "").toLowerCase();
        const admin = ["alvaro", "joshmiquel"].includes(nombre);
        return initialEventId(admin ? storage.get("teclear.testEvent") : null);
    } catch (e) { return null; }
})();

export class GameState {
    lang = $state("es");
    // Habilidades activas de los fondos (tecla reservada de «Controles»):
    // Turbo (Circuito) y Chica Rush (Five Nigths) — una vez por partida
    abilityKey = $state(getSetting("abilityKey") || "F1");
    bindingKey = $state(false);  // esperando la tecla a reasignar
    turboUntil = $state(0);      // instante en que acaba el Turbo (0 = apagado)
    turboUsed = $state(false);
    chicaUntil = $state(0);      // …y el del Chica Rush
    chicaUsed = $state(false);
    caramelos = $state(storage.getInt("teclear.caramelos", 0));
    candyRun = $state(0);
    supVariant = $state("clasico");
    mode = $state("type");
    bg = $state("dark");
    veyon = $state(getSetting("veyon"));
    state = $state("idle");
    word = $state("");
    currentImg = $state(null);
    mask = $state([]);
    wrongLetters = $state([]);
    misses = $state(0);
    score = $state(0);
    hits = $state(0);            // teclas / letras acertadas en la partida
    errors = $state(0);          // fallos cometidos en la partida
    streak = $state(0);
    completed = $state(0);
    prevLen = $state(0);
    timeLeft = $state(GAME_TIME);
    best = $state(0);
    bestWords = $state(0);
    coins = $state(0);
    coinsRun = $state(0);
    owned = $state(["clasico"]);
    equipped = $state("clasico");
    ownedBgs = $state(["dark"]);
    ownedExtras = $state([]);
    extraOn = $state({             // extras activos en este momento
            picante: false,
            caos: false,
            php: false,
            espejo: false,
            andaluz: false,
            azar: false,
            cubico: false
        });
    ownedFx = $state([]);
    fxEquipped = $state("");
    shopOpen = $state(false);
    rankOpen = $state(false);
    logrosOpen = $state(false);
    invOpen = $state(false);
    achData = $state({});
    rankBusy = $state(false);
    rankFocus = $state("normal");
    verifyCode = $state("");
    perkOpen = $state(false);
    perkOpts = $state([]);
    supLives = $state(SUP_LIVES);
    supTick = $state(0);
    accOpen = $state(false);
    accMode = $state("reg");
    accBusy = $state(false);
    accSession = $state(null);
    accMsgTxt = $state("");
    accMsgWarn = $state(false);
    debugOpen = $state(false);
    statusTxt = $state("");
    startTxt = $state("");
    shopMsgTxt = $state("");
    invMsgTxt = $state("");
    rankMsgTxt = $state("");
    rankMsgOff = $state(false);
    resOpen = $state(false);
    res = $state({});
    eventCountTxt = $state(evIni ? eventCountTxt(EVENTS[evIni]) : "");
    halloween = $state(evIni === "halloween");
    logoPhraseTxt = $state("");
    logoShow = $state(false);
    typedStr = $state("");
    picErr = $state(false);
    xp = $state(0);
    gamesPlayed = $state(0);
    wordsTotal = $state(0);
}

export const S = new GameState();
