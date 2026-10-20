// Modo Supervivencia: palabras que bajan desde arriba por columnas.
// Se teclea solo la palabra apuntada; si alguna llega al fondo se
// pierde una vida y sin vidas se acaba. La variante Encantado (evento
// de Halloween) hace caer LETRAS sueltas con fantasma y paga solo en
// caramelos (ni monedas ni experiencia).
import { S } from '../state.svelte.js';
import { t } from '../services/i18n.js';
import { fx } from '../services/fx.js';
import { eco } from '../services/economy.js';
import {
    SUP_LIVES, SUP_TIME, SUP_TIME_MIN, SUP_TIME_STEP, SUP_SPEED_STEP,
    SUP_SPEED_MAX, SUP_XP_WORD, SUP_MAX_WORDS, SUP_GRACE, SUP_RAMP,
    SUP_LANES_WIDE, SUP_LANES_NARROW, SHOT_MS, SHOT_GAP,
    ENC_ALFABETO, ENC_CANDY_HIT, ENC_CANDY_FAIL, ENC_MAX_GHOSTS,
    ENC_MIN_TIME, ENC_GHOST_STEP, ENC_TIME_STEP, ENC_SPEED_STEP
} from '../data/constants.js';
import { GameMode } from './mode.js';

export class SurvivalMode extends GameMode {
    id = "supervivencia";

    items = [];        // palabras cayendo por el tablero
    target = null;     // palabra a la que apunta el teclado
    startAt = 0;       // instante en que empezó (manda la dificultad)
    serial = 0;        // id incremental de cada palabra en pantalla
    encTyped = 0;      // letras acertadas en la partida Encantada

    get enc() { return S.supVariant === "encantado"; }

    // ---------- Bordes de la partida ----------
    enter() {
        S.supLives = SUP_LIVES;
        this.items = [];
        this.target = null;
        this.startAt = Date.now();   // el reloj de la dificultad arranca aquí
        this.encTyped = 0;
        document.body.classList.add("modo-supervivencia");
    }

    exit() {
        this.items = [];
        this.target = null;
        this.startAt = 0;
        document.body.classList.remove("modo-supervivencia");
    }

    timerStart() { return this.wordTime(); }

    // En Supervivencia el nivel lo manda el RELOJ, no lo que se escribe:
    // los primeros segundos todo va muy despacio (nivel 1) y a partir de
    // ahí sube un nivel cada SUP_RAMP segundos.
    level() {
        return 1 + Math.floor(Math.max(0, this.elapsed() - SUP_GRACE) / SUP_RAMP);
    }

    elapsed() {
        return this.startAt > 0 ? (Date.now() - this.startAt) / 1000 : 0;
    }

    // Segundos que tarda una palabra en recorrer el tablero de arriba
    // abajo: van bajando con el nivel, así que cada vez hay que disparar
    // sus letras más deprisa antes de que toque el fondo.
    wordTime() {
        // Modo Encantado: cada letra que aciertas hace que los fantasmas
        // siguientes bajen antes (nunca por debajo de ENC_MIN_TIME)
        if (this.enc) {
            const base = SUP_TIME - this.encTyped * ENC_TIME_STEP;
            return Math.max(ENC_MIN_TIME, Math.round(base * 10) / 10);
        }
        const base = SUP_TIME - (this.level() - 1) * SUP_TIME_STEP;
        return Math.max(SUP_TIME_MIN, Math.round(base * 10) / 10);
    }

    // Velocidad a la que bajan las palabras: acelera con el nivel hasta el
    // doble. En Encantado la aceleración la marcan las LETRAS acertadas.
    speed() {
        const extra = this.enc
            ? this.encTyped * ENC_SPEED_STEP
            : (this.level() - 1) * SUP_SPEED_STEP;
        return Math.min(SUP_SPEED_MAX, 1 + extra);
    }

    // Segundos que le quedan a una palabra antes de tocar el fondo
    left(it) {
        return Math.max(0, (1 - it.y) * it.span / this.speed());
    }

    // Palabras en pantalla a la vez: crece con el nivel (el tiempo), y en
    // Encantado con las letras acertadas.
    maxWords() {
        if (this.enc) return Math.min(ENC_MAX_GHOSTS, 2 + Math.floor(this.encTyped / ENC_GHOST_STEP));
        return Math.min(SUP_MAX_WORDS, 1 + Math.floor((this.level() - 1) / 2));
    }

    // ---------- Pulso del reloj ----------
    // Todas las palabras bajan a la vez: la que llegue hasta el fondo del
    // tablero se cae (una vida menos) hasta acabar la partida.
    tick(now, dt) {
        const step = dt / 1000 * this.speed();
        // Se recorre una copia: al caerse puede entrar otra palabra
        // (por arriba del todo) y a esa no le toca todavía
        const vivas = this.items.slice();
        for (const it of vivas) {
            if (this.items.indexOf(it) < 0) continue;   // ya se cayó
            it.y += step / Math.max(0.5, it.span);
            if (it.y >= 1) {
                this.escape(it);
                if (S.state !== "playing") return true;   // sin vidas: fin
            }
        }
        // El reloj del HUD marca lo que le falta a la palabra apuntada
        S.timeLeft = this.target ? this.left(this.target) : 0;
        this.engine.updateHud();
        return true;
    }

    // ---------- Tablero ----------
    // Nueva palabra: nace arriba del todo en la columna que tenga más
    // aire (solo datos, la caja la pinta Svelte al entrar en la lista)
    spawn() {
        if (this.items.length >= this.maxWords()) return null;
        const lanes = this.engine.board && this.engine.board.clientWidth < 520
            ? SUP_LANES_NARROW : SUP_LANES_WIDE;
        // Se elige la columna cuya palabra más alta deja más hueco
        // arriba, así que las letras no se pisan al bajar
        let lane = lanes[0];
        let mejor = -1;
        for (const ln of lanes) {
            let alto = 2;                       // 2 = columna vacía
            for (const x of this.items) {
                if (x.lane === ln && x.y < alto) alto = x.y;
            }
            if (alto > mejor) { mejor = alto; lane = ln; }
        }

        // En el modo Encantado caen LETRAS sueltas (cada una en su
        // fantasma); en el clásico, palabras como siempre
        const enc = this.enc;
        let w = enc ? this.encLetter() : this.engine.nextWord();
        // Se evita repetir las que ya están en pantalla
        for (let i = 0; i < 8 && this.items.some(x => x.w === w); i++) {
            w = enc ? this.encLetter() : this.engine.nextWord();
        }

        const it = {
            n: ++this.serial,      // id estable para el {#each} y el disparo
            w: w, typed: 0, shotFrom: 0, fresh: true,
            lane: lane,
            span: this.wordTime(), y: 0      // y: 0 = arriba del todo, 1 = fondo
        };
        this.items.push(it);
        return it;
    }

    // Letra aleatoria que baja en el modo Encantado (con su fantasma)
    encLetter() {
        return ENC_ALFABETO[Math.floor(Math.random() * ENC_ALFABETO.length)];
    }

    // Rellena el tablero hasta el tope del nivel: cada vez hay más
    // palabras en pantalla según avanzas. Devuelve la última en entrar.
    fillBoard() {
        let nueva = null;
        while (this.items.length < this.maxWords()) {
            const it = this.spawn();
            if (!it) break;
            nueva = it;
        }
        return nueva;
    }

    // Saca una palabra del tablero (completada o escapada)
    remove(it) {
        const i = this.items.indexOf(it);
        if (i >= 0) this.items.splice(i, 1);
        if (this.target === it) this.target = null;
    }

    // Apunta a una palabra: a partir de ahí es la que se teclea. El reloj
    // del HUD pasa a marcar lo que LE FALTA de camino al fondo y se
    // recupera lo que ya se había disparado de ella antes de cambiar.
    aim(it) {
        if (!it) return;
        const typing = this.engine.typing;
        this.target = it;
        S.word = it.w;                     // las recompensas trabajan sobre `word`
        S.prevLen = it.typed;
        S.typedStr = it.w.slice(0, it.typed);
        typing.value = S.typedStr;
        S.timeLeft = this.left(it);
        this.engine.updateHud();
    }

    aimByN(n) {
        this.aim(this.items.find(x => x.n === n));
    }

    // La siguiente en apuntar es la que está más cerca del fondo
    aimNext() {
        let mejor = null;
        for (const x of this.items) if (!mejor || x.y > mejor.y) mejor = x;
        this.aim(mejor);
    }

    // Tab (o un clic) para pasar a apuntar a la siguiente palabra
    cycle() {
        if (this.items.length < 2) return;
        const i = this.items.indexOf(this.target);
        this.aim(this.items[(i + 1) % this.items.length]);
    }

    keydown(e) {
        if (e.key === "Tab") {
            e.preventDefault();
            this.cycle();
        }
    }

    // La partida empieza con una sola palabra en pantalla: el resto va
    // apareciendo según escribes (ya se apunta a esta)
    onNewWord() {
        this.items = [];
        this.target = null;
        this.spawn();
        this.aim(this.items[0]);
    }

    // Palabra terminada: cobra puntos, monedas y experiencia, se va del
    // tablero y... ¡van apareciendo más! (el tope lo manda el nivel)
    complete() {
        const it = this.target;
        if (!it) return;
        // El modo Encantado solo paga CARAMELOS (ni monedas ni experiencia)
        if (this.enc) this.encReward();
        else this.engine.pagaPalabra();   // recompensas, racha y logros
        this.remove(it);
        this.fillBoard();
        this.aimNext();
        this.engine.updateHud();
    }

    // Letra acertada en el modo Encantado: su recompensa son caramelos.
    // Cuenta para nivel, racha y resultados, pero NUNCA da monedas ni
    // experiencia (el modo se paga solo en la moneda del evento).
    encReward() {
        this.encTyped++;
        S.completed++;
        S.streak++;
        S.score += 10;
        eco.giveCandy(ENC_CANDY_HIT);     // +1 caramelos por letra
        fx.showCandy(ENC_CANDY_HIT);
        S.statusTxt = t("encHit");
    }

    // Una palabra ha llegado hasta el fondo del tablero: se pierde una
    // vida y sigue la partida con las que queden (sin vidas se acaba)
    escape(it) {
        const escapada = it.w;
        this.remove(it);
        S.supLives--;
        fx.shake();
        if (S.supLives <= 0) {
            S.supLives = 0;
            S.timeLeft = 0;
            S.statusTxt = t("supFailEnd");
            this.engine.updateHud();
            this.engine.endGame();
            return;
        }
        S.statusTxt = t("supFail") + S.supLives + " ❤️ · " + t("supFell") + escapada;
        // En el hueco de la que se ha caído entra otra por arriba y se
        // apunta a ella
        this.fillBoard();
        this.aimNext();
    }

    // ---------- Disparo de las letras ----------
    // Cada letra aceptada sale volando desde el campo de escritura hasta
    // su casilla de la palabra apuntada. El vuelo dura SHOT_MS y la
    // explosión de la casilla espera a que la letra llegue.
    letterEl(it, i) {
        const board = this.engine.board;
        const box = board && board.querySelector('[data-n="' + it.n + '"]');
        const ls = box && box.querySelector(".sup-letters");
        return ls ? (ls.children[i] || null) : null;
    }

    shoot(ch, destino, espera) {
        const typing = this.engine.typing;
        if (!fx.fxLayer || !typing || !destino) return;
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
        fx.fxLayer.appendChild(p);
        setTimeout(function () { p.remove(); }, SHOT_MS + (espera || 0) + 120);
    }

    // Lo que se teclea se compara con la palabra APUNTADA: la primera
    // letra mal puesta se rechaza y penaliza, como en el modo Tecleo
    input() {
        const typing = this.engine.typing;
        let val = typing.value.toLowerCase();
        if (typing.value !== val) typing.value = val;

        const tgt = this.target;
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
            S.errors++;
            S.streak = 0;
            S.score = Math.max(0, S.score - 5);
            fx.shake();
            // Modo Encantado: fallar cuesta CARAMELOS, pero el contador
            // nunca baja de cero (con 0 caramelos no se mueve)
            if (this.enc) {
                const perdidos = Math.min(ENC_CANDY_FAIL, Math.max(0, S.caramelos));
                if (perdidos > 0) {
                    eco.giveCandy(-perdidos);
                    S.statusTxt = t("encFail") + perdidos + t("encFailEnd");
                } else {
                    S.statusTxt = t("encFailZero");
                }
            } else {
                S.statusTxt = t("statusError");
            }
        } else {
            if (val.length > S.prevLen) S.hits += val.length - S.prevLen;
            S.statusTxt = t("statusOk");
        }

        const antes = S.prevLen;
        S.prevLen = val.length;
        tgt.typed = val.length;
        tgt.shotFrom = antes;   // desde dónde llegó esta ráfaga (retardo del blast)
        this.engine.updateHud();

        // Letras recién aceptadas: salen disparadas del campo de
        // escritura hacia su casilla (una tras otra, con su desfase)
        if (bad === -1) {
            for (let i = antes; i < val.length; i++) {
                const espera = (i - antes) * SHOT_GAP;
                this.shoot(tgt.w[i], this.letterEl(tgt, i), espera);
            }
        }

        if (val === tgt.w) this.complete();
    }

    // ---------- Vista ----------
    // Los ítems mutan en sitio (bajan, reciben letras), así que la vista
    // recibe una COPIA de cada uno: al cambiar la referencia, el {#each}
    // con clave vuelve a pintar la caja
    boardView() {
        S.supTick;   // se repinta con cada pulso del campo
        return { kind: "sup",
                 items: this.items.map(it => ({
                     n: it.n, w: it.w, typed: it.typed,
                     shotFrom: it.shotFrom, lane: it.lane,
                     span: it.span, y: it.y, fresh: it.fresh
                 })),
                 targetN: this.target ? this.target.n : -1,
                 enc: this.enc, shotMs: SHOT_MS, shotGap: SHOT_GAP };
    }
}
