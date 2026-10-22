// Modo Aventura: el cronómetro acelera con el nivel y cada palabra
// regala segundos. Cada ciertas palabras hay una parada para elegir
// una ventaja de tres sorteadas; mientras se elige, el reloj no corre.
import { S } from '../state.svelte.js';
import { t, uiLang } from '../services/i18n.js';
import { fx } from '../services/fx.js';
import { eco } from '../services/economy.js';
import { dic } from '../services/dictionary.js';
import {
    ADV_TIME, ADV_EVERY, ADV_EVERY_MAX, ADV_SPEED_STEP, ADV_SPEED_MAX
} from '../data/constants.js';
import { GameMode } from './mode.js';

export class AdventureMode extends GameMode {
    id = "aventura";

    // Estado propio de la partida (ventajas y pausas)
    shield = 0;        // fallos que el escudo todavía absorbe
    short = 0;         // palabras cortas que quedan por regalar
    freeze = 0;        // fin de la congelación (performance.now)
    double = 0;        // fin del doble de puntos
    turbo = 0;         // fin del turbo de tiempo
    coins = 0;         // fin del doble de monedas
    revive = 0;        // salvavidas guardados para el final
    timeGained = 0;    // segundos ganados con las palabras
    gold = 0;          // fin de la "racha dorada" (multiplicador x5)
    grace = 0;         // fin de la "indulgencia" (fallo sin perder racha)
    relief = 0;        // palabras que no cuentan para subir de nivel
    reliefFrom = 0;    // completed en el momento del "remanso"
    picks = 1;         // ventajas que se pueden elegir en esta parada
    extraPick = 0;     // paradas dobles pendientes ("doble elección")
    stops = 0;         // paradas de ventaja ya celebradas
    nextPerk = ADV_EVERY;  // palabras escritas en las que toca parar
    pausedTotal = 0;   // ms que el reloj ha estado en pausa (elegir ventaja)
    pausedAt = 0;      // instante en que empezó la pausa actual

    // ---------- Bordes de la partida ----------
    enter() {
        S.perkOpen = false;
        this.pausedTotal = 0;
        this.pausedAt = 0;
        this.shield = 0;
        this.short = 0;
        this.freeze = 0;
        this.double = 0;
        this.turbo = 0;
        this.coins = 0;
        this.revive = 0;
        this.timeGained = 0;
        this.gold = 0;
        this.grace = 0;
        this.relief = 0;
        this.reliefFrom = 0;
        this.picks = 1;
        this.extraPick = 0;
        this.stops = 0;             // aún no se ha parado a elegir ventaja
        this.nextPerk = ADV_EVERY;  // primera parada: a las 5 palabras
        S.perkOpts = [];
    }

    // Por si se termina con la ventana de ventajas abierta
    exit() {
        if (S.perkOpen && this.pausedAt > 0) this.pausedTotal += Date.now() - this.pausedAt;
        S.perkOpen = false;
        S.perkOpts = [];
        this.pausedAt = 0;
    }

    timerStart() { return ADV_TIME; }

    // Milisegundos que no cuentan como partida (elegir ventaja)
    pausedMs() { return this.pausedTotal; }

    // ---------- Dificultad y reloj ----------
    // En Aventura la dificultad sube más deprisa: con cada palabra
    // escrita toca antes una más larga y menos pistas. La ventaja
    // "remanso" descuenta palabras para que no suba tanto.
    level() {
        return 1 + Math.floor(Math.max(0, S.completed - this.relief) / 3);
    }

    // Velocidad a la que corre el reloj: va acelerando con el nivel
    // (hasta el doble), así que el tiempo se consume cada vez más
    // deprisa justo cuando las palabras son más largas y valen menos.
    tickSpeed() {
        const extra = (this.level() - 1) * ADV_SPEED_STEP;
        return Math.min(ADV_SPEED_MAX, 1 + extra);
    }

    // Segundos que regala cada palabra: van bajando a medida que sube
    // el nivel, así que las palabras dan menos tiempo justo cuando
    // son más largas.
    timePerWord() {
        const base = Math.max(1, 4 - Math.floor((this.level() - 1) / 3));
        // Ventaja "turbo": durante unos segundos cada palabra dobla su tiempo
        return performance.now() < this.turbo ? base * 2 : base;
    }

    // Suma segundos al cronómetro (palabras y ventajas)
    gainTime(sec) {
        S.timeLeft += sec;
        this.timeGained += sec;
        // Aviso flotante de los segundos ganados (celeste, sobre el tablero)
        fx.float("+" + sec + "s", "time");
    }

    // ---------- Pulso del reloj ----------
    tick(now, dt) {
        // Con la ventaja "tiempo congelado" el reloj no baja unos segundos
        if (now < this.freeze) {
            this.engine.updateHud();
            return true;
        }
        S.timeLeft -= dt / 1000 * this.tickSpeed();
        // Ventaja "salvavidas": el cronómetro no muere de golpe, salta a 15 s
        if (S.timeLeft <= 0 && this.revive > 0) {
            this.revive--;
            const salvado = Math.max(1, 15 - S.timeLeft);
            S.timeLeft += salvado;
            this.timeGained += salvado;
            fx.float("+" + Math.round(salvado) + "s", "time");
            S.statusTxt = t("statusRevive");
        }
        if (S.timeLeft <= 0) {
            S.timeLeft = 0;
            this.engine.updateHud();
            this.engine.endGame();
            return true;
        }
        this.engine.updateHud();
        return true;
    }

    // ---------- Ganchos del motor ----------
    // Ventaja "camino corto": palabras cortas mientras queden
    filterPool(pool) {
        if (this.short > 0) {
            this.short--;
            return pool.filter(w => w.length <= 5);
        }
        return null;
    }

    // Ventaja "racha dorada": el multiplicador se queda clavado en su
    // máximo aunque la racha se caiga
    multiplier(base) {
        if (performance.now() < this.gold) return 5;
        return base;
    }

    // Al fallar una tecla: el escudo la absorbe y la indulgencia deja
    // pasar el fallo sin romper la racha
    onBadKey() {
        if (this.shield > 0) {
            this.shield--;
            return "shield";
        }
        if (performance.now() < this.grace) return "grace";
        return null;
    }

    scoreMult() { return performance.now() < this.double ? 2 : 1; }
    coinMult() { return performance.now() < this.coins ? 2 : 1; }

    // Cada palabra regala segundos al cronómetro
    onReward() {
        this.gainTime(this.timePerWord());
    }

    // ... y llegado el momento hay una parada para elegir una ventaja.
    // Cada parada alarga el hueco siguiente: al principio cada 5
    // palabras y después cada vez más.
    onWordComplete() {
        if (S.completed >= this.nextPerk) {
            this.stops++;
            this.nextPerk = S.completed + this.perkEvery();
            this.openPerkChoice();
        }
    }

    // Palabras que faltan para la próxima parada: el hueco va creciendo
    // de dos en dos palabras cada vez que se para, hasta ADV_EVERY_MAX.
    // (Las dos primeras paradas siguen siendo a las 5 y a las 10 palabras)
    perkEvery() {
        return Math.min(ADV_EVERY + Math.floor(this.stops / 2), ADV_EVERY_MAX);
    }

    // ---------- Ventajas ----------
    // Sorteo ponderado por rareza: cuanto más fuerte es la ventaja,
    // menos peso tiene y menos veces sale (sin reemplazo, para que las
    // tres de una parada nunca se repitan). En lugar de mezclar el
    // banque entero por igual, cada hueco se saca al azar entre las que
    // quedan y con el peso de su rareza.
    sortPerks() {
        return rollPerks(3, null);
    }

    // ---------- Colección de ventajas ----------
    // Las ventajas agrupadas por rareza para el diccionario: cada una
    // lleva su icono, su nombre, su descripción y si ya te has llevado
    // alguna vez. No dan dinero ni recompensa: sirven para ver las que
    // hay y coleccionarlas todas.
    perkCollection() {
        const en = uiLang() === "en";
        return ADV_RARITY_ORDER.map(r => ({
            id: r,
            clase: ADV_RARITY_CLASS[r],
            nombre: t("rar" + r.charAt(0).toUpperCase() + r.slice(1)),
            perks: ADVENTURE_PERKS.filter(p => p.rarity === r).map(p => ({
                id: p.id, icon: p.icon,
                nombre: en ? p.en : p.es,
                desc: en ? p.descEn : p.descEs,
                tenida: dic.perkTenida(p.id)
            }))
        }));
    }

    // Abre la parada de la aventura: mientras el jugador elige, el reloj
    // no corre y la entrada de texto queda bloqueada.
    openPerkChoice() {
        if (S.state !== "playing") return;
        // Segunda ventaja de una parada doble ("doble elección"): la
        // ventana sigue abierta y solo hacen falta otras tres al azar
        if (S.perkOpen) { S.perkOpts = this.sortPerks(); return; }
        this.picks = this.extraPick > 0 ? 2 : 1;
        this.extraPick = 0;
        S.perkOpts = this.sortPerks();
        S.perkOpen = true;
        this.pausedAt = Date.now();
        this.engine.typing.blur();
        S.statusTxt = t("perkTitle");
    }

    // Aplica la ventaja elegida y devuelve el control al jugador
    choosePerk(p) {
        if (!S.perkOpen) return;
        const segunda = this.picks > 1;   // la parada deja otra ventaja más
        if (segunda) {
            this.picks--;
        } else {
            this.picks = 1;
            S.perkOpen = false;
            this.pausedTotal += Date.now() - this.pausedAt;   // la pausa no cuenta como partida
            this.pausedAt = 0;
        }
        p.apply(this);
        // Diccionario: la ventaja elegida se apunta a la colección para
        // siempre (no da dinero: solo sirve para coleccionarlas todas)
        dic.perkElegida(p.id);
        const nombre = p.icon + " " + (uiLang() === "en" ? p.en : p.es);
        if (segunda) {
            this.openPerkChoice();          // se sortean tres ventajas más
            S.statusTxt = t("perkSecond") + nombre;
        } else {
            // El foco espera al render (el input acaba de quitarse el
            // disabled al cerrar la parada): ver engine.focusTyping()
            this.engine.focusTyping();
            S.statusTxt = t("perkChosen") + nombre;
        }
        this.engine.updateHud();   // refresca el tiempo y los efectos activos
    }

    // Efectos activos mostrados como chips en el HUD (se recalculan con
    // cada tick porque leen timeLeft aunque no lo muestren)
    chips() {
        S.timeLeft;
        if (S.state !== "playing") return [];
        const chips = [{ txt: "⏱️ +" + this.timePerWord() + "s/" + t("advWord"), on: false }];
        const vel = this.tickSpeed();
        if (vel > 1.001) chips.push({ txt: "⏩ x" + vel.toFixed(1)
            .replace(".", uiLang() === "es" ? "," : "."), on: true });
        if (this.shield > 0) chips.push({ txt: "🛡️ x" + this.shield, on: true });
        if (this.short > 0) chips.push({ txt: "🛤️ x" + this.short, on: true });
        if (this.revive > 0) chips.push({ txt: "🆘 x" + this.revive, on: true });
        const quedanRelief = Math.max(0, this.relief - (S.completed - this.reliefFrom));
        if (quedanRelief > 0) chips.push({ txt: "🌊 x" + quedanRelief, on: true });
        const ahora = performance.now();
        if (ahora < this.freeze) chips.push({ txt: "❄️ " + Math.ceil((this.freeze - ahora) / 1000), on: true });
        if (ahora < this.double) chips.push({ txt: "💥 x2 " + Math.ceil((this.double - ahora) / 1000), on: true });
        if (ahora < this.turbo) chips.push({ txt: "🏃 x2s " + Math.ceil((this.turbo - ahora) / 1000), on: true });
        if (ahora < this.coins) chips.push({ txt: "🧲 x2🪙 " + Math.ceil((this.coins - ahora) / 1000), on: true });
        if (ahora < this.gold) chips.push({ txt: "💎 x5 " + Math.ceil((this.gold - ahora) / 1000), on: true });
        if (ahora < this.grace) chips.push({ txt: "😇 " + Math.ceil((this.grace - ahora) / 1000), on: true });
        return chips;
    }
}

// Pesos de rareza al sortear: cuanto más fuerte es la ventaja, menos
// veces sale. Con estos números, en cada hueco de una parada sale una
// ventaja común ~64 de cada 100 veces, poco común ~25, rara ~7, épica
// ~3 y legendaria ~1. Se toca solo aquí, el resto del código no cambia.
const ADV_RARITY = {
    comun: 30,      // efectos sencillos: salen muchas veces
    pocoComun: 12,  // mejores efectos: salen menos veces
    rara: 5,        // muy buenas: salen pocas veces
    epica: 2,       // buenísimas: salen muy pocas veces
    legendaria: 1   // increíbles: casi nunca
};

// Orden de las rarezas (de la más corriente a la más increíble) y la
// clase CSS corta de cada una, para pintar la colección del diccionario
const ADV_RARITY_ORDER = ["comun", "pocoComun", "rara", "epica", "legendaria"];
const ADV_RARITY_CLASS = { comun: "c", pocoComun: "pc", rara: "r", epica: "e", legendaria: "l" };

// Sorteo ponderado por rareza SIN reemplazo: saca n ventajas distintas
// (o una sola, con n = 1) descartando cada una al salir para que no se
// repitan. excluir evita que "Suerte del todo" vuelva a tocarse a sí
// misma y genere otra con la misma ventaja.
function rollPerks(n, excluir) {
    let resto = ADVENTURE_PERKS.filter(p => p.id !== excluir);
    const salida = [];
    while (salida.length < n && resto.length > 0) {
        let total = 0;
        for (const p of resto) total += ADV_RARITY[p.rarity] || 1;
        let r = Math.random() * total;
        let elegido = resto[resto.length - 1];
        for (const p of resto) {
            r -= ADV_RARITY[p.rarity] || 1;
            if (r < 0) { elegido = p; break; }
        }
        salida.push(elegido);
        resto = resto.filter(p => p !== elegido);
    }
    return salida;
}

// Banque de ventajas (23 en total): cada ADV_EVERY palabras se sortean
// tres y el jugador se queda con una. Cada ventaja lleva su rareza, y
// es la rareza la que decide cuántas veces puede salir. El texto va en
// castellano y en inglés. apply() recibe el modo para tocar su estado.
const ADVENTURE_PERKS = [
    // ---------- Comunes: efectos sencillos, salen muchas veces ----------
    {
        id: "tiempo", icon: "⏱️", rarity: "comun",
        es: "+10 segundos", en: "+10 seconds",
        descEs: "Diez segundos más en el cronómetro.", descEn: "Ten more seconds on the clock.",
        apply: function (m) { m.gainTime(10); }
    },
    {
        id: "escudo", icon: "🛡️", rarity: "comun",
        es: "Escudo", en: "Shield",
        descEs: "Absorbe tu próximo fallo: ni puntos ni racha.", descEn: "Absorbs your next mistake: no points or streak lost.",
        apply: function (m) { m.shield++; }
    },
    {
        id: "monedas", icon: "🪙", rarity: "comun",
        es: "+25 monedas", en: "+25 coins",
        descEs: "Te llevas 25 monedas al instante.", descEn: "You get 25 coins right away.",
        apply: function () { eco.giveCoins(25); fx.showCoin(25); }
    },
    {
        id: "racha", icon: "🔥", rarity: "comun",
        es: "Racha +5", en: "Streak +5",
        descEs: "Tu racha sube de golpe cinco palabras.", descEn: "Your streak jumps five words ahead.",
        apply: function () { S.streak += 5; }
    },
    {
        id: "corto", icon: "🛤️", rarity: "comun",
        es: "Camino corto", en: "Short cut",
        descEs: "Las próximas 3 palabras serán cortas.", descEn: "The next 3 words will be short ones.",
        apply: function (m) { m.short += 3; }
    },
    {
        id: "regalada", icon: "🎁", rarity: "comun",
        es: "Palabra regalada", en: "Free word",
        descEs: "La palabra de delante se completa sola si no la tocas.", descEn: "The word in front of you completes itself if you leave it alone.",
        apply: function (m) {
            const w = S.word;
            let intentos = 0;
            // Espera a que se cierre la parada (una doble "doble
            // elección" puede dejar la ventana abierta un rato)
            const intento = function () {
                if (S.state !== "playing") return;
                if (S.perkOpen && intentos++ < 40) { setTimeout(intento, 300); return; }
                if (S.perkOpen) return;
                if (S.word !== w || m.engine.typing.value.length > 0) return;
                S.statusTxt = t("statusFreeWord");
                m.engine.completeWord();
            };
            setTimeout(intento, 600);
        }
    },
    // ---------- Poco comunes: mejores efectos, salen menos veces ----------
    {
        id: "congelar", icon: "❄️", rarity: "pocoComun",
        es: "Tiempo congelado", en: "Frozen clock",
        descEs: "El cronómetro no baja durante 6 segundos.", descEn: "The clock does not tick for 6 seconds.",
        apply: function (m) { m.freeze = performance.now() + 6000; }
    },
    {
        id: "doble", icon: "💥", rarity: "pocoComun",
        es: "Puntos x2", en: "Double points",
        descEs: "Duplica tus puntos durante 15 segundos.", descEn: "Doubles your points for 15 seconds.",
        apply: function (m) { m.double = performance.now() + 15000; }
    },
    {
        id: "turbo", icon: "🏃", rarity: "pocoComun",
        es: "Turbo", en: "Turbo",
        descEs: "10 segundos en los que cada palabra dobla el tiempo que regala.", descEn: "10 seconds where every word gives double time.",
        apply: function (m) { m.turbo = performance.now() + 10000; }
    },
    {
        id: "monedas2", icon: "🧲", rarity: "pocoComun",
        es: "Monedas dobles", en: "Double coins",
        descEs: "15 segundos ganando el doble de monedas en cada palabra.", descEn: "15 seconds earning double coins on every word.",
        apply: function (m) { m.coins = performance.now() + 15000; }
    },
    {
        id: "salvavidas", icon: "🆘", rarity: "pocoComun",
        es: "Salvavidas", en: "Lifeline",
        descEs: "Si el cronómetro llega a cero, salta a 15 segundos.", descEn: "If the clock reaches zero, it jumps to 15 seconds.",
        apply: function (m) { m.revive++; }
    },
    {
        id: "indulgencia", icon: "😇", rarity: "pocoComun",
        es: "Indulgencia", en: "Grace",
        descEs: "15 segundos en los que fallar no rompe tu racha (sí resta 5 puntos).", descEn: "15 seconds where missing doesn't break your streak (still -5 points).",
        apply: function (m) { m.grace = performance.now() + 15000; }
    },
    // ---------- Raras: muy buenas, salen pocas veces ----------
    {
        id: "dobleEleccion", icon: "🎒", rarity: "rara",
        es: "Doble elección", en: "Double pick",
        descEs: "Tu próxima parada es doble: te llevas dos ventajas seguidas.", descEn: "Your next stop is a double one: you get two advantages in a row.",
        apply: function (m) { m.extraPick++; }
    },
    {
        id: "remanso", icon: "🌊", rarity: "rara",
        es: "Remanso", en: "Lull",
        descEs: "Las próximas 12 palabras no cuentan para subir de nivel: bajan las palabras y sube el tiempo por palabra.", descEn: "The next 12 words don't count toward the level: easier words and more time each.",
        apply: function (m) { m.relief += 12; m.reliefFrom = S.completed; }
    },
    {
        id: "bolsa", icon: "🧧", rarity: "rara",
        es: "Bolsa de monedas", en: "Coin pouch",
        descEs: "Monedas al instante: diez veces tu racha actual (mínimo 20).", descEn: "Coins right away: ten times your current streak (at least 20).",
        apply: function () {
            const n = Math.max(20, S.streak * 10);
            eco.giveCoins(n);
            fx.showCoin(n);
        }
    },
    {
        id: "suerte", icon: "🎲", rarity: "rara",
        es: "Suerte del todo", en: "Wild card",
        descEs: "Te toca otra ventaja al azar del banque.", descEn: "You get another random advantage from the deck.",
        apply: function (m) {
            // El sorteo también respeta las rarezas: toca otra ventaja
            // con lo mismo que una parada normal (sin repetir esta)
            rollPerks(1, "suerte")[0].apply(m);
        }
    },
    // ---------- Épicas: buenísimas, salen muy pocas veces ----------
    {
        id: "dorada", icon: "💎", rarity: "epica",
        es: "Racha dorada", en: "Golden streak",
        descEs: "15 segundos con el multiplicador en x5, aunque falles.", descEn: "15 seconds with the multiplier at x5, even if you miss.",
        apply: function (m) { m.gold = performance.now() + 15000; }
    },
    {
        id: "escudoDorado", icon: "🛡️✨", rarity: "epica",
        es: "Escudo dorado", en: "Golden shield",
        descEs: "Absorbe tus próximos 3 fallos: ni puntos ni racha en ninguno.", descEn: "Absorbs your next 3 mistakes: no points or streak lost on any of them.",
        apply: function (m) { m.shield += 3; }
    },
    {
        id: "horaFeliz", icon: "⏳", rarity: "epica",
        es: "Hora feliz", en: "Happy hour",
        descEs: "8 segundos con el cronómetro parado y 20 segundos de palabras con el doble de tiempo.", descEn: "8 seconds with the clock frozen and 20 seconds of words giving double time.",
        apply: function (m) {
            m.freeze = performance.now() + 8000;
            m.turbo = performance.now() + 20000;
        }
    },
    {
        id: "cofre", icon: "💰", rarity: "epica",
        es: "Cofre dorado", en: "Golden chest",
        descEs: "200 monedas al instante y 20 segundos ganando el doble de monedas.", descEn: "200 coins right away and 20 seconds earning double coins.",
        apply: function (m) {
            eco.giveCoins(200);
            fx.showCoin(200);
            m.coins = performance.now() + 20000;
        }
    },
    // ---------- Legendarias: increíbles, casi nunca salen ----------
    {
        id: "tiempoEterno", icon: "♾️", rarity: "legendaria",
        es: "Tiempo eterno", en: "Endless time",
        descEs: "El cronómetro se para 20 segundos y, cuando vuelve, te llevas 20 segundos extra.", descEn: "The clock stops for 20 seconds and, when it comes back, you get 20 extra seconds.",
        apply: function (m) {
            m.freeze = performance.now() + 20000;
            m.gainTime(20);
        }
    },
    {
        id: "todoDoble", icon: "🎊", rarity: "legendaria",
        es: "Todo doble", en: "Everything double",
        descEs: "20 segundos con puntos x2, monedas x2 y el doble de tiempo por palabra.", descEn: "20 seconds with double points, double coins and double time per word.",
        apply: function (m) {
            m.double = performance.now() + 20000;
            m.coins = performance.now() + 20000;
            m.turbo = performance.now() + 20000;
        }
    },
    {
        id: "inmortal", icon: "☄️", rarity: "legendaria",
        es: "Inmortal", en: "Immortal",
        descEs: "3 salvavidas, 3 escudos y 20 segundos en los que fallar no rompe tu racha.", descEn: "3 lifelines, 3 shields and 20 seconds where missing doesn't break your streak.",
        apply: function (m) {
            m.revive += 3;
            m.shield += 3;
            m.grace = performance.now() + 20000;
        }
    }
];
