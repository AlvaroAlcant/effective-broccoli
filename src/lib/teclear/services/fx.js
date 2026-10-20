// Efectos visuales del juego: toasts flotantes sobre el escenario,
// sacudida del tablero al fallar, partículas de tecleo del efecto
// equipado y los fondos animados en canvas ("Sopa de Letras" y "Hacker").
// Todo el estado vive en la instancia; los elementos de DOM y las
// dependencias del juego se inyectan con bind() al arrancar.
import { S } from '../state.svelte.js';

export class EffectsService {
    // Dependencias inyectadas (elementos + consultas al juego)
    stage = null;      // contenedor de los toasts
    board = null;      // tablero (sacudida y ancla de partículas)
    typing = null;     // input (ancla de reserva en modo Imágenes)
    getSupTarget = () => null;  // palabra apuntada en Supervivencia
    getActiveFx = () => null;   // efecto de tecleo equipado

    // Capa fija de partículas: ahí nacen las chispas y ahí mueren solas
    fxLayer = null;
    fxAlive = 0;

    // ---------- Fondo "Sopa de Letras" ----------
    soupCanvas = null;
    soupCtx = null;
    soupLetters = [];
    soupOn = false;
    soupRaf = 0;
    soupPrev = 0;
    soupDpr = 1;
    soupW = 0;
    soupH = 0;

    // ---------- Fondo "Hacker" ----------
    hackBox = null;
    hackTimer = 0;
    hackOn = false;
    hackChars = [];
    hackCols = 0;
    hackRows = 0;

    bind({ stage, board, typing, getSupTarget, getActiveFx }) {
        this.stage = stage;
        this.board = board;
        this.typing = typing;
        if (getSupTarget) this.getSupTarget = getSupTarget;
        if (getActiveFx) this.getActiveFx = getActiveFx;
    }

    // Crea la capa de partículas y engancha los listeners de ventana.
    // Se llama una vez al montar el juego (hay DOM disponible).
    mount() {
        this.fxLayer = document.createElement("div");
        this.fxLayer.className = "fx-layer";
        this.fxLayer.setAttribute("aria-hidden", "true");
        document.body.appendChild(this.fxLayer);

        // Al cambiar el tamaño de la ventana se recolocan las letras
        window.addEventListener("resize", () => {
            if (this.soupOn) this.onSoupResize();
            if (this.hackOn) this.hackBuild();
        });

        // Pestaña oculta: se apagan las animaciones y al volver se reanudan
        document.addEventListener("visibilitychange", () => {
            if (this.soupOn) {
                if (document.hidden) this.stopSoup();
                else if (this.soupReduced()) this.soupDraw();
                else this.startSoup();
            }
            if (this.hackOn) {
                if (document.hidden) this.hackStop();
                else if (!this.hackTimer && !this.soupReduced())
                    this.hackTimer = setInterval(() => this.hackTick(), 90);
            }
        });
    }

    // ---------- Toasts flotantes (puntos, monedas, caramelos, XP) ----------
    float(text, cls) {
        if (!this.stage) return;
        const p = document.createElement("div");
        p.className = "points" + (cls ? " " + cls : "");
        p.textContent = text;
        this.stage.appendChild(p);
        setTimeout(() => p.remove(), 900);
    }

    showPoints(points) { this.float("+" + points); }
    showCoin(n) { this.float("🪙 +" + n, "coin"); }
    // Aviso de caramelos ganados con la letra (modo Encantado)
    showCandy(n) { this.float("🍬 +" + n, "candy"); }
    // Aviso de experiencia ganada con la palabra (modo Supervivencia)
    showXp(n) { this.float("✨ +" + n + " XP", "xp"); }

    shake() {
        if (!this.board) return;
        this.board.classList.remove("shake");
        void this.board.offsetWidth; // reinicia la animación
        this.board.classList.add("shake");
    }

    // ---------- Efectos de tecleo: partículas ----------
    // Punto donde estalla la letra: la que está a punto de aparecer en el
    // tablero (en Imágenes no hay letras, así que manda el campo de entrada)
    fxAnchor() {
        const board = this.board;
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
            const supTarget = this.getSupTarget();
            const caja = supTarget &&
                board.querySelector('[data-n="' + supTarget.n + '"]');
            el = caja ? (caja.querySelector(".shot.blast") ||
                         caja.querySelector(".cursor")) : null;
        } else if (board.children.length) {
            const i = Math.min(S.prevLen, board.children.length - 1);
            el = board.children[i < 0 ? 0 : i];
        }
        const r = (el || this.typing).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    // Estalla el efecto equipado en el punto de la letra recién tecleada
    fxBurst() {
        const fx = this.getActiveFx();
        if (!fx || S.state !== "playing") return;
        const a = this.fxAnchor();
        const n = fx.count;
        const life = fx.life || 800;
        for (let i = 0; i < n; i++) {
            if (this.fxAlive >= FX_MAX) break;
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
            this.fxLayer.appendChild(p);
            this.fxAlive++;
            setTimeout((node => () => {
                node.remove();
                this.fxAlive--;
            })(p), life + 60);
        }
    }

    // ---------- Fondo "Sopa de Letras": letras que rebotan ----------
    soupReduced() {
        return !!(window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    sizeSoupCanvas() {
        if (!this.soupCanvas) return;
        this.soupDpr = Math.min(window.devicePixelRatio || 1, 2);
        this.soupW = window.innerWidth;
        this.soupH = window.innerHeight;
        this.soupCanvas.width = Math.max(1, Math.round(this.soupW * this.soupDpr));
        this.soupCanvas.height = Math.max(1, Math.round(this.soupH * this.soupDpr));
    }

    soupCount() {
        return Math.max(16, Math.min(48,
            Math.round(this.soupW * this.soupH / SOUP_DENSITY)));
    }

    buildSoup() {
        const total = this.soupCount();
        this.soupLetters = [];
        for (let i = 0; i < total; i++) {
            const size = 22 + Math.random() * 20;
            const r = size * .62;   // radio de choque de la tecla
            this.soupLetters.push({
                ch: SOUP_CHARS.charAt(Math.floor(Math.random() * SOUP_CHARS.length)),
                col: SOUP_COLORS[i % SOUP_COLORS.length],
                size: size,
                r: r,
                x: r + Math.random() * Math.max(1, this.soupW - 2 * r),
                y: r + Math.random() * Math.max(1, this.soupH - 2 * r),
                vx: (Math.random() < .5 ? -1 : 1) * SOUP_SPEED * (.5 + Math.random() * .8),
                vy: (Math.random() * 2 - 1) * SOUP_SPEED,
                a: .16 + Math.random() * .30   // opacidad de la tecla
            });
        }
    }

    soupStep(dt) {
        const L = this.soupLetters;
        const W = this.soupW, H = this.soupH;
        let i, j, p;

        // 1) Avance y rebote contra las paredes
        for (i = 0; i < L.length; i++) {
            p = L[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
            else if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx); }
            if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
            else if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy); }
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

    soupRoundRect(ctx, x, y, w, h, r) {
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

    soupDraw() {
        if (!this.soupCtx) return;
        const ctx = this.soupCtx;
        ctx.setTransform(this.soupDpr, 0, 0, this.soupDpr, 0, 0);
        ctx.clearRect(0, 0, this.soupW, this.soupH);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = 0; i < this.soupLetters.length; i++) {
            const p = this.soupLetters[i];
            const box = p.size * 1.12;
            // la tecla
            ctx.globalAlpha = p.a;
            this.soupRoundRect(ctx, p.x - box / 2, p.y - box / 2, box, box, p.size * .26);
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

    soupTick(now) {
        this.soupRaf = 0;
        if (!this.soupOn || document.hidden) return;
        const dt = Math.min(.05, Math.max(0, (now - this.soupPrev) / 1000)) || .016;
        this.soupPrev = now;
        this.soupStep(dt);
        this.soupDraw();
        this.soupRaf = requestAnimationFrame(t => this.soupTick(t));
    }

    startSoup() {
        if (this.soupRaf || !this.soupOn) return;
        this.soupPrev = performance.now();
        this.soupRaf = requestAnimationFrame(t => this.soupTick(t));
    }

    stopSoup() {
        if (this.soupRaf) cancelAnimationFrame(this.soupRaf);
        this.soupRaf = 0;
    }

    onSoupResize() {
        this.sizeSoupCanvas();
        if (Math.abs(this.soupCount() - this.soupLetters.length) > 6) {
            this.buildSoup();
        } else {
            for (let i = 0; i < this.soupLetters.length; i++) {
                const p = this.soupLetters[i];
                p.x = Math.min(Math.max(p.x, p.r), Math.max(p.r, this.soupW - p.r));
                p.y = Math.min(Math.max(p.y, p.r), Math.max(p.r, this.soupH - p.r));
            }
        }
        if (this.soupReduced() || document.hidden) this.soupDraw();
        else this.startSoup();
    }

    // La llama el juego cada vez que cambia el fondo activo
    syncLetterSoup(active) {
        this.soupOn = !!active;
        if (!this.soupOn) {
            this.stopSoup();
            if (this.soupCanvas) this.soupCanvas.style.display = "none";
            return;
        }
        if (!this.soupCanvas) {
            this.soupCanvas = document.createElement("canvas");
            this.soupCanvas.id = "soupCanvas";
            this.soupCanvas.setAttribute("aria-hidden", "true");
            document.body.appendChild(this.soupCanvas);
            this.soupCtx = this.soupCanvas.getContext("2d");
        }
        this.soupCanvas.style.display = "block";
        this.sizeSoupCanvas();
        if (!this.soupLetters.length) this.buildSoup();
        if (this.soupReduced()) {   // sin movimiento si el sistema lo pide
            this.stopSoup();
            this.soupDraw();
            return;
        }
        this.startSoup();
    }

    // ---------- Fondo "Hacker": números binarios que cambian ----------
    // Vuelve a rellenar la pantalla con dígitos al azar (al cambiar de
    // tamaño la rejilla no cuadraría, así que se recalcula)
    hackBuild() {
        if (!this.hackBox) return;
        this.hackCols = Math.max(8, Math.ceil(window.innerWidth / HACK_W));
        this.hackRows = Math.max(6, Math.ceil(window.innerHeight / HACK_H));
        this.hackChars = new Array(this.hackCols * this.hackRows);
        for (let i = 0; i < this.hackChars.length; i++) {
            this.hackChars[i] = Math.random() < .5 ? "0" : "1";
        }
        this.hackPaint();
    }

    hackPaint() {
        if (!this.hackBox) return;
        const filas = [];
        for (let r = 0; r < this.hackRows; r++) {
            filas.push(this.hackChars.slice(r * this.hackCols, (r + 1) * this.hackCols).join(""));
        }
        this.hackBox.textContent = filas.join("\n");
    }

    // Cada paso cambia un puñado de dígitos al azar
    hackTick() {
        if (document.hidden || !this.hackOn) return;
        const n = Math.max(1, Math.round(this.hackChars.length * .05));
        for (let i = 0; i < n; i++) {
            this.hackChars[Math.floor(Math.random() * this.hackChars.length)] =
                Math.random() < .5 ? "0" : "1";
        }
        this.hackPaint();
    }

    hackStop() {
        if (this.hackTimer) clearInterval(this.hackTimer);
        this.hackTimer = 0;
    }

    // La llama el juego cada vez que cambia el fondo activo
    syncHacker(active) {
        this.hackOn = !!active;
        this.hackStop();
        if (!this.hackOn) {
            if (this.hackBox) this.hackBox.style.display = "none";
            return;
        }
        if (!this.hackBox) {
            this.hackBox = document.createElement("div");
            this.hackBox.id = "hackBg";
            this.hackBox.setAttribute("aria-hidden", "true");
            document.body.appendChild(this.hackBox);
        }
        this.hackBox.style.display = "block";
        this.hackBuild();
        // Sin parpadeo si el sistema pide movimiento reducido
        if (this.soupReduced() || document.hidden) return;
        this.hackTimer = setInterval(() => this.hackTick(), 90);
    }
}

const FX_MAX = 140;   // partículas vivas a la vez (no saturar el DOM)
const SOUP_CHARS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789";
const SOUP_COLORS = ["#5eead4", "#14b8a6", "#ffd76a", "#f0abfc", "#3882f6", "#e8ecf4"];
const SOUP_SPEED = 62;        // velocidad base (píxeles/segundo)
const SOUP_DENSITY = 26000;   // píxeles cuadrados por letra
const HACK_W = 11.2;          // píxeles que ocupa cada carácter
const HACK_H = 18;            // píxeles de alto de cada fila

export const fx = new EffectsService();
