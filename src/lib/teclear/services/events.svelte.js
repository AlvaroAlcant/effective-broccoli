// Eventos del juego: qué evento está activo según el calendario, la
// cuenta atrás hasta su fin y las pruebas de administrador. El registro
// de eventos (fechas, variante, tienda) es un dato en data/events.js —
// este servicio solo lo interpreta.
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { EVENTS, eventOn, eventCountTxt } from '../data/events.js';

export class EventService {
    deps = { isAdmin: () => false };
    timer = null;      // intervalo de la cuenta atrás
    testId = $state(null);   // override de admin: fuerza un evento fuera de fecha

    bind(d) { Object.assign(this.deps, d); }

    def(id) { return id && EVENTS[id] ? EVENTS[id] : null; }

    // El evento en curso: si un admin lo está probando, ese manda; si no,
    // el primero del registro cuya fecha encaje
    activeId(now) {
        if (this.testId && this.deps.isAdmin() && EVENTS[this.testId]) {
            return this.testId;
        }
        for (const id in EVENTS) {
            if (eventOn(EVENTS[id], now)) return id;
        }
        return null;
    }

    is(id, now) { return this.activeId(now) === id; }
    get active() { return this.def(this.activeId()); }

    // ---------- Aplicar el evento al juego ----------
    // Viste el <body>, activa su variante de Supervivencia (o la retira al
    // terminar) y arranca la cuenta atrás que la barra de evento muestra.
    apply() {
        const def = this.active;
        S.halloween = def?.id === "halloween";
        document.body.classList.toggle("halloween", S.halloween);
        // La variante del evento se cae del selector cuando el evento acaba
        if (S.supVariant !== "clasico" && S.supVariant !== def?.supVariant &&
            S.state !== "playing") {
            S.supVariant = "clasico";
        }
        if (def) {
            this.tick();
            if (!this.timer) this.timer = setInterval(() => this.tick(), 1000);
        } else {
            clearInterval(this.timer);
            this.timer = null;
            S.eventCountTxt = "";
        }
    }

    // Cuenta atrás hasta el final del evento activo
    tick() {
        const def = this.active;
        if (!def) {
            clearInterval(this.timer);
            this.timer = null;
            this.apply();   // se apaga la temática…
            return;
        }
        S.eventCountTxt = eventCountTxt(def);
    }

    // ---------- Pruebas de administrador ----------
    // Un admin puede forzar un evento aunque no sea su fecha; la elección
    // se guarda para que sobreviva a la recarga de la página.
    test(id) {
        if (!this.deps.isAdmin() || !EVENTS[id]) return false;
        this.testId = id;
        storage.set("teclear.testEvent", id);
        this.apply();
        return true;
    }

    clearTest() {
        this.testId = null;
        storage.remove("teclear.testEvent");
        this.apply();
    }

    loadTest() {
        this.testId = storage.get("teclear.testEvent");
    }
}

export const events = new EventService();
