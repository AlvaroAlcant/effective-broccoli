// ---------- Habilidades ACTIVAS de los fondos ----------
// Turbo (Circuito) y Chica Rush (Five Nigths) se disparan con la tecla
// reservada del apartado «Controles» (o con el botón de la habilidad,
// para el táctil) y solo se pueden usar UNA VEZ por partida. Hacker es
// pasiva y no se activa: se aplica sola con cada palabra escrita.
// El campo de escritura se inyecta con bind() al arrancar; lo que se
// ve lo pinta Svelte desde S.
import { S } from '../state.svelte.js';
import { setSetting } from '../settings.js';
import { t } from './i18n.js';
import { eco } from './economy.js';
import { fx } from './fx.js';
import imgCupcake from '#lib/img/cupcake.png';
import {
    TURBO_MS, CHICA_MS, CHICA_SPAWN, CHICA_LIFE, CHICA_MAX, CHICA_CHANCE
} from '../data/constants.js';

export class AbilitiesService {
    // Dependencias inyectadas
    typing = null;      // campo de escritura: el foco vuelve a él siempre

    // Capas fijas de las habilidades: las líneas de velocidad del Turbo
    // y los cupcakes del Chica Rush. Se crean una vez al montar y se
    // encienden y se apagan con su habilidad.
    turboFx = null;
    cupcakeLayer = null;

    chicaTimer = 0;     // intervalo que va soltando cupcakes
    chicaEndTimer = 0;  // timeout que pone fin al Chica Rush
    cupcakes = [];      // cupcakes vivos en la capa: [{ el, vida }]

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

    // Las dos habilidades congelan el reloj mientras duran (en
    // Supervivencia eso congela también las palabras)
    frozen(now) { return this.turboOn(now) || this.chicaOn(now); }

    // Solo Circuito (Turbo) y Five Nigths (Chica Rush) se encienden con
    // la tecla reservada; Hacker es pasiva y el resto no tienen.
    abilityId() {
        if (eco.bgPower("carreras")) return "turbo";
        if (eco.bgPower("fivenights")) return "chica";
        return "";
    }

    // ¿Lista para dispararse? Una sola vez por partida
    abilityReady() {
        const id = this.abilityId();
        if (!id) return false;
        const ahora = performance.now();
        return id === "turbo"
            ? !S.turboUsed && ahora >= S.turboUntil
            : !S.chicaUsed && ahora >= S.chicaUntil;
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
        if (this.abilityId() === "turbo") {
            // Turbo (Circuito): 10 s con el reloj congelado y palabras
            // muy cortas. Una sola vez por partida.
            S.turboUsed = true;
            S.turboUntil = ahora + TURBO_MS;
            if (this.turboFx) this.turboFx.style.display = "block";
            document.body.classList.add("turbo-on");
            S.statusTxt = t("stTurbo");
        } else {
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

    // ---------- Bordes de la partida ----------
    // Cada partida empieza con su habilidad lista —Turbo y Chica Rush
    // solo valen UNA vez por partida— y sin reasignación de tecla a
    // medias: en plena partida no se tocan los controles
    reset() {
        S.bindingKey = false;
        S.turboUsed = false;
        S.chicaUsed = false;
        this.turboStop();
        this.chicaStop();
    }

    // Si se acaba la partida con una habilidad encendida, se corta
    stopAll() {
        this.turboStop();
        this.chicaStop();
    }

    // ---------- Vista ----------
    // Botón de la habilidad, junto al campo de escritura: oculto si el
    // fondo equipado no tiene ninguna activa, y con su estado (lista,
    // corriendo con su cuenta atrás, o usada) si la tiene
    view() {
        const id = this.abilityId();
        const hacker = this.hackerOn();
        if (S.state !== "playing" || (!id && !hacker)) {
            return { show: false, txt: "", ready: false, on: false, used: false };
        }
        if (!id) {
            // Hacker es pasiva: se muestra, pero no se dispara con nada
            return { show: true, txt: t("abHacker"), ready: false, on: false, used: false };
        }
        const ahora = performance.now();
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
