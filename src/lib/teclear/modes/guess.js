// Modo Adivinar: la palabra sale con letras ocultas y se descubren de
// una en una; cada letra que no está suma un fallo y a los MAX_MISSES
// fallos la palabra se da por perdida y sale otra.
import { S } from '../state.svelte.js';
import { t } from '../services/i18n.js';
import { fx } from '../services/fx.js';
import { MAX_MISSES } from '../data/constants.js';
import { GameMode } from './mode.js';

export class GuessMode extends GameMode {
    id = "guess";

    // Oculta letras de la palabra según el nivel:
    // nivel 1-2 → la mitad, nivel 3-5 → casi todas, nivel 6+ → todas
    // Solo se ocultan letras: los símbolos (como el "_" de las funciones
    // de PHP) se quedan a la vista porque no se pueden adivinar a tecla.
    makeMask(w) {
        const unique = [...new Set(w.split("").filter(ch => /[a-záéíóúüñ]/i.test(ch)))];
        for (let i = unique.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = unique[i];
            unique[i] = unique[j];
            unique[j] = tmp;
        }
        const lvl = this.engine.level();
        let ratio = 0.5;
        if (lvl >= 6) ratio = 1;
        else if (lvl >= 3) ratio = 0.7;
        const hideCount = Math.max(1, Math.ceil(unique.length * ratio));
        const hidden = new Set(unique.slice(0, hideCount));
        return w.split("").map(ch => (hidden.has(ch) ? "hidden" : "start"));
    }

    // Palabra nueva: máscara a cero y letras regaladas por la Sopa
    onNewWord() {
        S.mask = this.makeMask(S.word);
        S.misses = 0;
        S.wrongLetters = [];
        this.engine.soupReveal();    // letras que deja Sopa de Letras
    }

    // Cada tecla prueba una letra: el campo se vacía tras procesarla
    input() {
        const typing = this.engine.typing;
        const raw = typing.value;
        typing.value = "";
        for (const ch of raw) {
            if (S.state !== "playing") break;
            this.guessChar(ch);
        }
    }

    // Prueba una letra: si no está, fallo y a la lista de erróneas; si
    // está, se descubren todas sus instancias ocultas
    guessChar(raw) {
        const ch = raw.toLowerCase();
        if (!/^[a-záéíóúüñ]$/.test(ch)) return;       // ignorar espacios y símbolos
        if (S.wrongLetters.includes(ch)) return;         // letra ya fallada
        if (!S.word.includes(ch)) {                      // fallo
            S.errors++;
            S.streak = 0;
            S.misses++;
            S.score = Math.max(0, S.score - 5);
            S.wrongLetters.push(ch);
            fx.shake();

            if (S.misses >= MAX_MISSES) {
                S.statusTxt = t("wordFailed") + S.word;
                this.engine.newWord();
            } else {
                S.statusTxt = t("statusError");
            }
            this.engine.updateHud();
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

        S.hits += revealed;
        S.streak++;
        const points = 10 * this.engine.multiplier() * revealed;
        S.score += points;
        fx.showPoints(points);
        S.statusTxt = t("statusOk");

        this.engine.updateHud();

        if (!S.mask.includes("hidden")) {
            this.engine.completeWord();
        }
    }

    // ---------- Vista ----------
    // Las casillas de la palabra: ocultas, descubiertas o de partida
    boardView() {
        const firstHidden = S.mask.indexOf("hidden");
        return { kind: "letters", letters: S.word.split("").map((ch, i) => ({
            ch: S.mask[i] === "hidden" ? "_" : ch,
            cls: S.mask[i] === "hidden" ? "blank" + (i === firstHidden ? " cursor" : "")
                 : (S.mask[i] === "found" ? "ok" : "")
        })) };
    }

    // Los fallos de Adivinar ocupan el hueco de las vidas
    missesView() {
        return { kind: "guess", n: S.misses, wrong: S.wrongLetters };
    }
}
