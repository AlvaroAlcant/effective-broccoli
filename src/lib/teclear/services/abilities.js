// ---------- Habilidades ACTIVAS de los fondos ----------
// Turbo (Circuito), Chica Rush (Five Nigths) y Baile calaca (Calaca) se
// disparan con la tecla reservada del apartado «Controles» (o con el
// botón de la habilidad, para el táctil) y solo se pueden usar UNA VEZ
// por partida. Hacker (+1 s por palabra), Chatarra (Company, trozos que
// dan experiencia) y Tiempo congelado (ViejaEnLaGolden) son PASIVAS: no
// se activan con nada, actúan solas mientras el fondo esté puesto.
// El campo de escritura se inyecta con bind() al arrancar; lo que se
// ve lo pinta Svelte desde S.
import { S } from '../state.svelte.js';
import { setSetting } from '../settings.js';
import { t } from './i18n.js';
import { eco } from './economy.js';
import { fx } from './fx.js';
import imgCupcake from '#lib/img/cupcake.png';
import imgBaile from '#lib/img/bailecalaca.gif';
import imgScrap from '#lib/img/company.gif';
import {
    TURBO_MS, CHICA_MS, CHICA_SPAWN, CHICA_LIFE, CHICA_MAX, CHICA_CHANCE,
    BAIL_WORDS, BAIL_BURST, BAIL_SPAWN, BAIL_MAX, BAIL_LIFE,
    SCRAP_SPAWN, SCRAP_MAX, SCRAP_LIFE, SCRAP_XP
} from '../data/constants.js';

export class AbilitiesService {
    // Dependencias inyectadas
    typing = null;      // campo de escritura: el foco vuelve a él siempre

    // Capas fijas de las habilidades: las líneas de velocidad del Turbo,
    // los cupcakes del Chica Rush, los esqueletos del Baile calaca y la
    // chatarra de Company. Se crean una vez al montar y se encienden y
    // se apagan con su habilidad.
    turboFx = null;
    cupcakeLayer = null;
    baileLayer = null;
    scrapLayer = null;

    chicaTimer = 0;     // intervalo que va soltando cupcakes
    chicaEndTimer = 0;  // timeout que pone fin al Chica Rush
    cupcakes = [];      // cupcakes vivos en la capa: [{ el, vida }]
    baileTimer = 0;     // intervalo que va soltando esqueletos
    skulls = [];        // esqueletos bailando: [{ el, vida }]
    scrapTimer = 0;     // intervalo que va soltando chatarra
    scraps = [];        // trozos de chatarra vivos: [{ el, vida }]

    bind({ typing }) {
        this.typing = typing;
    }

    mount() {
        this.turboFx = document.createElement("div");
        this.turboFx.className = "turbo-fx";
        this.turboFx.setAttribute("aria-hidden", "true");
        document.body.appendChild(this.turboFx);

        this.cupcakeLayer = document.createElement("div");
        this.cupcakeLayer.className = "cupcake-layer";
        document.body.appendChild(this.cupcakeLayer);

        // Capa decorativa del Baile calaca: los esqueletos NO se tocan,
        // solo bailan encima de todo, así que la capa no recibe clics
        this.baileLayer = document.createElement("div");
        this.baileLayer.className = "baile-layer";
        this.baileLayer.setAttribute("aria-hidden", "true");
        document.body.appendChild(this.baileLayer);

        // Chatarra de Company: al revés que los esqueletos, SÍ se toca
        this.scrapLayer = document.createElement("div");
        this.scrapLayer.className = "scrap-layer";
        document.body.appendChild(this.scrapLayer);

        // Reasignación de la tecla reservada (fila «Controles»): se
        // captura en la fase de captura para que la tecla elegida no
        // llegue a ningún otro sitio: ni escribe en el campo, ni dispara
        // nada más. ESC cancela y se queda la que había.
        document.addEventListener("keydown", (e) => {
            if (!S.bindingKey) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.repeat) return;
            if (e.code !== "Escape") {
                S.abilityKey = e.code;
                setSetting("abilityKey", S.abilityKey);
            }
            S.bindingKey = false;
        }, true);
    }

    // ---------- Estado de las habilidades ----------
    // ¿Corriendo ahora mismo? (los «until» guardan instantes de
    // performance.now; 0 = apagadas)
    turboOn(now) { return (now || performance.now()) < S.turboUntil; }
    chicaOn(now) { return (now || performance.now()) < S.chicaUntil; }
    // El Baile calaca no se apaga con el reloj: cuenta PALABRAS
    baileOn() { return S.baileLeft > 0; }

    // Las habilidades con reloj (Turbo y Chica Rush) congelan el tiempo
    // mientras duran (en Supervivencia eso congela también las palabras)
    frozen(now) { return this.turboOn(now) || this.chicaOn(now); }

    // Las habilidades que se disparan con la tecla reservada. Hacker,
    // Chatarra y Tiempo congelado son pasivas y no aparecen aquí.
    abilityId() {
        if (eco.bgPower("carreras")) return "turbo";
        if (eco.bgPower("fivenights")) return "chica";
        if (eco.bgPower("calaca")) return "baile";
        return "";
    }

    // ¿Lista para dispararse? Una sola vez por partida
    abilityReady() {
        const id = this.abilityId();
        if (!id) return false;
        if (id === "baile") return !S.baileUsed;
        const ahora = performance.now();
        return id === "turbo"
            ? !S.turboUsed && ahora >= S.turboUntil
            : !S.chicaUsed && ahora >= S.chicaUntil;
    }

    // Habilidades PASIVAS del fondo equipado: no tienen botón de disparo,
    // pero el de la partida las enseña para que se sepa qué hacen
    passiveId() {
        if (eco.bgPower("hacker")) return "hacker";
        if (eco.bgPower("company")) return "chatarra";
        if (eco.bgPower("viejaenlagolden")) return "pausa";
        return "";
    }

    // Hacker es pasiva: no hay botón que pulsar, suma sola
    hackerOn() { return eco.bgPower("hacker"); }

    // Nombre visible de la tecla configurada («KeyR» sale como «R»)
    keyLabel(code) {
        if (!code) return "";
        if (code === "Space") return t("keySpace");
        if (code === "Enter") return t("keyEnter");
        if (code.indexOf("Key") === 0) return code.slice(3);
        if (code.indexOf("Digit") === 0) return code.slice(5);
        return code;
    }

    // ---------- Disparo ----------
    // Dispara la habilidad del fondo: la tecla reservada y el botón de
    // la partida llaman a esta misma función
    useAbility() {
        if (S.state !== "playing" || !this.abilityReady()) return false;
        const ahora = performance.now();
        const id = this.abilityId();
        if (id === "turbo") {
            // Turbo (Circuito): 10 s con el reloj congelado y palabras
            // muy cortas. Una sola vez por partida.
            S.turboUsed = true;
            S.turboUntil = ahora + TURBO_MS;
            if (this.turboFx) this.turboFx.style.display = "block";
            document.body.classList.add("turbo-on");
            S.statusTxt = t("stTurbo");
        } else if (id === "chica") {
            // Chica Rush (Five Nigths): 20 s con el reloj congelado y
            // sin poder escribir, cazando cupcakes. Una sola vez por partida.
            S.chicaUsed = true;
            S.chicaUntil = ahora + CHICA_MS;
            document.body.classList.add("chica-on");
            this.chicaClear();
            this.chicaSpawn();     // el primero sale ya
            this.chicaTimer = setInterval(() => this.chicaSpawn(), CHICA_SPAWN);
            this.chicaEndTimer = setTimeout(() => this.chicaEnd(), CHICA_MS);
            if (this.typing) this.typing.value = "";   // mientras dura no se escribe nada
            S.statusTxt = t("stChica");
        } else {
            // Baile calaca (Calaca): salen esqueletos bailando y las
            // siguientes 15 palabras son de HUESOS con DOBLE de puntos,
            // monedas y caramelos. El reloj NO se congela: se sigue
            // escribiendo mientras bailan. Una sola vez por partida.
            S.baileUsed = true;
            S.baileLeft = BAIL_WORDS;
            // La palabra que ya está en pantalla NO forma parte del bonus:
            // las 15 son las SIGUIENTES (todas saldrán de la lista de
            // huesos). Se apaga al cambiar de palabra (wordDone o newWord)
            S.baileSkip = true;
            document.body.classList.add("baile-on");
            this.baileClear();
            for (let i = 0; i < BAIL_BURST; i++) this.baileSpawn();   // primer golpe
            this.baileTimer = setInterval(() => this.baileSpawn(), BAIL_SPAWN);
            S.statusTxt = t("stBaile");
        }
        if (this.typing) this.typing.focus();   // el foco vuelve al campo de escritura
        return true;
    }

    // El Turbo se apaga solo cuando pasa su ventana de 10 segundos
    turboStop() {
        S.turboUntil = 0;
        if (this.turboFx) this.turboFx.style.display = "none";
        document.body.classList.remove("turbo-on");
    }

    // Fin del Chica Rush (tiempo cumplido): la partida sigue igual que
    // antes, con el foco devuelto al campo de escritura
    chicaEnd() {
        this.chicaStop();
        if (S.state === "playing") {
            if (this.typing) this.typing.focus();
            S.statusTxt = t("stChicaEnd");
        }
    }

    // Se retira el Chica Rush sin pasar por el aviso de fin: corta los
    // temporizadores, la capa de cupcakes y la clase del cuerpo
    chicaStop() {
        if (this.chicaTimer) clearInterval(this.chicaTimer);
        if (this.chicaEndTimer) clearTimeout(this.chicaEndTimer);
        this.chicaTimer = 0;
        this.chicaEndTimer = 0;
        S.chicaUntil = 0;
        document.body.classList.remove("chica-on");
        this.chicaClear();
    }

    // Suelta un cupcake en una posición al azar de la pantalla: vive
    // CHICA_LIFE milisegundos y mientras tanto se puede tocar
    chicaSpawn() {
        if (S.state !== "playing" || !this.chicaOn()) return;
        if (this.cupcakes.length >= CHICA_MAX || !this.cupcakeLayer) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cupcake";
        b.setAttribute("aria-label", "cupcake");
        const img = document.createElement("img");
        img.src = imgCupcake;
        img.alt = "";
        b.appendChild(img);
        // Un poco por encima de la mitad: la parte de abajo es del
        // campo de escritura y de los botones
        const m = 12, size = 62;
        b.style.left = Math.round(m + Math.random() *
            Math.max(1, window.innerWidth - size - m * 2)) + "px";
        b.style.top = Math.round(m + Math.random() *
            Math.max(1, window.innerHeight * 0.62 - size)) + "px";
        const c = { el: b, vida: 0 };
        c.vida = setTimeout(() => this.chicaDrop(c, false), CHICA_LIFE);
        b.addEventListener("click", () => this.chicaTouch(c));
        this.cupcakes.push(c);
        this.cupcakeLayer.appendChild(b);
    }

    // Se retira un cupcake: tocado se va con su animación de fuera,
    // caducado simplemente desaparece
    chicaDrop(c, hit) {
        const i = this.cupcakes.indexOf(c);
        if (i < 0) return;
        this.cupcakes.splice(i, 1);
        clearTimeout(c.vida);
        if (hit) {
            c.el.disabled = true;
            c.el.classList.add("out");
            setTimeout(() => c.el.remove(), 300);
        } else {
            c.el.remove();
        }
    }

    // Tocar un cupcake: 25 % de un segundo para el cronómetro y 75 % de
    // un caramelo para la hucha del evento
    chicaTouch(c) {
        if (S.state !== "playing" || !this.chicaOn()) return;
        this.chicaDrop(c, true);
        if (Math.random() < CHICA_CHANCE) {
            S.timeLeft += 1;
            fx.float("+1s", "time");
            S.statusTxt = t("chicaTime");
        } else {
            eco.giveCandy(1);
            fx.showCandy(1);
            S.statusTxt = t("chicaCandy");
        }
        if (this.typing) this.typing.focus();   // el foco vuelve al campo de escritura
    }

    // Se van todos los cupcakes de golpe (fin del modo o de la partida)
    chicaClear() {
        for (const c of this.cupcakes) {
            clearTimeout(c.vida);
            c.el.remove();
        }
        this.cupcakes = [];
    }

    // ---------- Baile calaca (fondo Calaca) ----------
    // Suelta un esqueleto en una posición al azar: baila BAIL_LIFE
    // milisegundos y se va con su animación de salida. Son decorativos:
    // la capa no recibe clics, así que no estorban para escribir.
    baileSpawn() {
        if (S.state !== "playing" || !this.baileOn() || !this.baileLayer) return;
        if (this.skulls.length >= BAIL_MAX) return;
        const img = document.createElement("img");
        img.className = "baile-sk";
        img.src = imgBaile;
        img.alt = "";
        const size = 100 + Math.round(Math.random() * 60);
        img.style.width = size + "px";
        img.style.height = size + "px";
        // Desfase de baile: cada esqueleto, con su fase (la entrada sí
        // se ve entera, porque esa animación no lleva desfase)
        img.style.setProperty("--d", (-Math.random() * 2.4).toFixed(2) + "s");
        // Como los cupcakes: en los dos tercios superiores, que la parte
        // de abajo es del campo de escritura y de los botones
        const m = 8;
        img.style.left = Math.round(m + Math.random() *
            Math.max(1, window.innerWidth - size - m * 2)) + "px";
        img.style.top = Math.round(m + Math.random() *
            Math.max(1, window.innerHeight * 0.66 - size)) + "px";
        const c = { el: img, vida: 0 };
        c.vida = setTimeout(() => this.baileDrop(c), BAIL_LIFE);
        this.skulls.push(c);
        this.baileLayer.appendChild(img);
    }

    baileDrop(c) {
        const i = this.skulls.indexOf(c);
        if (i < 0) return;
        this.skulls.splice(i, 1);
        clearTimeout(c.vida);
        c.el.classList.add("out");
        setTimeout(() => c.el.remove(), 400);
    }

    // Se van todos los esqueletos de golpe (se acabó el bonus o la partida)
    baileClear() {
        for (const c of this.skulls) {
            clearTimeout(c.vida);
            c.el.remove();
        }
        this.skulls = [];
    }

    // Corta los temporizadores y la capa del Baile calaca
    baileStop() {
        if (this.baileTimer) clearInterval(this.baileTimer);
        this.baileTimer = 0;
        S.baileLeft = 0;
        document.body.classList.remove("baile-on");
        this.baileClear();
    }

    // Cada palabra escrita con el Baile calaca activo resta una de las
    // 15 del bonus. La que estaba en pantalla al activarlo se salta: el
    // bonus son las 15 SIGUIENTES, que salen de la lista de huesos. Al
    // llegar a 0 se apaga solo; dentro del motor esto se llama DESPUÉS
    // de pagar la palabra, así que esa última ya cuenta con el doble.
    wordDone() {
        if (!this.baileOn()) return;
        if (S.baileSkip) { S.baileSkip = false; return; }
        S.baileLeft--;
        if (S.baileLeft > 0) return;
        this.baileStop();
        if (S.state === "playing") S.statusTxt = t("baileEnd");
    }

    // ---------- Chatarra (fondo Company) ----------
    // La chatarra es PASIVA: mientras el fondo esté puesto, la partida
    // va soltando trozos que se pueden tocar. Se enciende al empezar
    // (reset) y se apaga al terminar (stopAll).
    scrapStart() {
        if (this.scrapTimer || !eco.bgPower("company")) return;
        this.scrapSpawn();      // el primero sale ya
        this.scrapTimer = setInterval(() => this.scrapSpawn(), SCRAP_SPAWN);
    }

    scrapStop() {
        if (this.scrapTimer) clearInterval(this.scrapTimer);
        this.scrapTimer = 0;
        this.scrapClear();
    }

    // Un trozo de chatarra de Lethal Company en una posición al azar:
    // dura SCRAP_LIFE milisegundos y mientras tanto se puede tocar
    scrapSpawn() {
        if (S.state !== "playing" || !eco.bgPower("company") || !this.scrapLayer) return;
        if (this.scraps.length >= SCRAP_MAX) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "scrap";
        b.setAttribute("aria-label", "scrap");
        const img = document.createElement("img");
        img.src = imgScrap;
        img.alt = "";
        // Un recorte distinto del GIF: así cada trozo parece una pieza
        // de chatarra diferente
        img.style.objectPosition =
            Math.round(Math.random() * 100) + "% " + Math.round(Math.random() * 100) + "%";
        b.appendChild(img);
        const m = 12, size = 74;
        b.style.left = Math.round(m + Math.random() *
            Math.max(1, window.innerWidth - size - m * 2)) + "px";
        b.style.top = Math.round(m + Math.random() *
            Math.max(1, window.innerHeight * 0.66 - size)) + "px";
        const c = { el: b, vida: 0 };
        c.vida = setTimeout(() => this.scrapDrop(c, false), SCRAP_LIFE);
        b.addEventListener("click", () => this.scrapTouch(c));
        this.scraps.push(c);
        this.scrapLayer.appendChild(b);
    }

    // El trozo se retira: tocado se va con su animación, caducado
    // simplemente desaparece
    scrapDrop(c, hit) {
        const i = this.scraps.indexOf(c);
        if (i < 0) return;
        this.scraps.splice(i, 1);
        clearTimeout(c.vida);
        if (hit) {
            c.el.disabled = true;
            c.el.classList.add("out");
            setTimeout(() => c.el.remove(), 300);
        } else {
            c.el.remove();
        }
    }

    // Tocar un trozo de chatarra: experiencia extra al instante. En el
    // modo Encantado NO hay experiencia (su partida se paga en
    // caramelos), así que ahí el trozo suelta un caramelo.
    scrapTouch(c) {
        if (S.state !== "playing" || !eco.bgPower("company")) return;
        this.scrapDrop(c, true);
        if (S.mode === "supervivencia" && S.supVariant === "encantado") {
            eco.giveCandy(1);
            fx.showCandy(1);
            S.statusTxt = t("scrapCandy");
        } else {
            S.xp += SCRAP_XP;
            fx.showXp(SCRAP_XP);
            S.statusTxt = t("scrapGet");
        }
        if (this.typing) this.typing.focus();   // el foco vuelve al campo de escritura
    }

    // Se van todos los trozos de golpe (fin de la partida)
    scrapClear() {
        for (const c of this.scraps) {
            clearTimeout(c.vida);
            c.el.remove();
        }
        this.scraps = [];
    }

    // ---------- Bordes de la partida ----------
    // Cada partida empieza con su habilidad lista —Turbo y Chica Rush
    // solo valen UNA vez por partida— y sin reasignación de tecla a
    // medias: en plena partida no se tocan los controles
    reset() {
        S.bindingKey = false;
        S.turboUsed = false;
        S.chicaUsed = false;
        S.baileUsed = false;
        S.baileSkip = false;
        this.turboStop();
        this.chicaStop();
        this.baileStop();
        this.scrapStop();
        this.scrapStart();   // la chatarra de Company empieza a aparecer
    }

    // Si se acaba la partida con una habilidad encendida, se corta
    stopAll() {
        this.turboStop();
        this.chicaStop();
        this.baileStop();
        this.scrapStop();
    }

    // ---------- Vista ----------
    // Botón de la habilidad, junto al campo de escritura: oculto si el
    // fondo equipado no tiene ninguna activa, y con su estado (lista,
    // corriendo con su cuenta atrás, o usada) si la tiene. Las pasivas
    // no se disparan, pero se enseñan para que se sepa qué hacen.
    view() {
        const id = this.abilityId();
        const pasiva = this.passiveId();
        if (S.state !== "playing" || (!id && !pasiva)) {
            return { show: false, txt: "", ready: false, on: false, used: false };
        }
        if (!id) {
            const claves = { hacker: "abHacker", chatarra: "abChatarra", pausa: "abPausa" };
            return { show: true, txt: t(claves[pasiva]), ready: false, on: false, used: false };
        }
        const ahora = performance.now();
        // El Baile calaca se mide en PALABRAS, no en segundos
        if (id === "baile") {
            const on = this.baileOn();
            const usada = S.baileUsed && !on;
            return {
                show: true,
                txt: t("abBaile") + (on
                    ? " · 🦴 " + S.baileLeft
                    : usada ? " ✓ " + t("abUsed") : " · " + this.keyLabel(S.abilityKey)),
                ready: !on && !usada, on: on, used: usada
            };
        }
        const until = id === "turbo" ? S.turboUntil : S.chicaUntil;
        const used = id === "turbo" ? S.turboUsed : S.chicaUsed;
        const on = ahora < until;
        const usada = used && !on;
        const lista = !on && !usada;
        return {
            show: true,
            txt: t(id === "turbo" ? "abTurbo" : "abChica") + (on
                ? " · " + Math.ceil((until - ahora) / 1000) + " s"
                : usada ? " ✓ " + t("abUsed") : " · " + this.keyLabel(S.abilityKey)),
            ready: lista, on: on, used: usada
        };
    }
}

export const abilities = new AbilitiesService();
