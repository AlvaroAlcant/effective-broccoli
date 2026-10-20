// Arañas de Halloween con físicas: cada hilo (.hwn-thread) es un péndulo
// colgado de su ancla superior. Arrastrar la araña tensa el hilo (resorte)
// y la desvía (ángulo); al soltarla oscila amortiguada hasta volver a su
// sitio, donde retoma el vaivén suave del CSS.
export function initSpiders(root) {
    const threads = [...root.querySelectorAll(".hwn-thread")];
    if (!threads.length) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const GRAV = 2600;      // px/s² — tira del péndulo hacia la vertical
    const DAMP = 1.9;       // amortiguación angular (rozamiento del aire)
    const SPRING = 110;     // k del resorte del hilo (vuelve a su largo)
    const SDAMP = 12;       // amortiguación del resorte
    const EPS = 0.02;       // umbral de "ya está quieta"
    const MAX_OMEGA = 9;    // rad/s — tope del impulso de suelta (giro y pico)
    const MAX_LEN_V = 700;  // px/s — tope de la velocidad de estirado

    const spiders = threads.map(el => ({
        el,
        bug: el.querySelector("i"),
        restLen: el.offsetHeight,
        len: el.offsetHeight,
        lenV: 0,
        theta: 0,           // ángulo respecto a la vertical (rad)
        omega: 0,
        dragging: false,
        grabbed: false,     // al menos una vez: el CSS ya no manda
        hist: [],           // muestras {t, theta, len} para la velocidad de suelta
        calm: 0,            // tiempo acumulado casi en reposo
    }));

    let last = 0, raf = 0;

    function frame(now) {
        const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
        last = now;
        for (const sp of spiders) {
            if (!sp.grabbed) continue;
            if (!sp.dragging) {
                // Péndulo: θ'' = -(g/L)·sin θ - c·ω. θ se normaliza a
                // ±π cada frame: sin θ es periódico y si el lanzamiento
                // da vueltas enteras θ crecería sin límite
                sp.omega += (-(GRAV / sp.len) * Math.sin(sp.theta) - DAMP * sp.omega) * dt;
                sp.theta += sp.omega * dt;
                if (sp.theta > Math.PI) sp.theta -= 2 * Math.PI;
                else if (sp.theta < -Math.PI) sp.theta += 2 * Math.PI;
                // Resorte del hilo: L'' = -k·(L-L0) - c·L'
                sp.lenV += (-SPRING * (sp.len - sp.restLen) - SDAMP * sp.lenV) * dt;
                sp.len += sp.lenV * dt;
                // ¿Ya llegó a su sitio? → vuelve el vaivén del CSS
                const quiet = Math.abs(sp.theta) < EPS && Math.abs(sp.omega) < EPS &&
                              Math.abs(sp.len - sp.restLen) < 0.6;
                sp.calm = quiet ? sp.calm + dt : 0;
                if (sp.calm > 0.6) {
                    sp.grabbed = false;
                    sp.theta = sp.omega = sp.lenV = 0;
                    sp.len = sp.restLen;
                    sp.el.style.transform = "";
                    sp.el.style.height = "";
                    sp.el.style.animation = "";
                    continue;
                }
            }
            sp.el.style.transform = `rotate(${sp.theta}rad)`;
            sp.el.style.height = sp.len + "px";
        }
        if (spiders.some(sp => sp.grabbed)) raf = requestAnimationFrame(frame);
        else raf = 0;
    }

    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    for (const sp of spiders) {
        sp.bug.style.pointerEvents = "auto";
        sp.bug.style.cursor = "grab";
        sp.bug.style.touchAction = "none";

        sp.bug.addEventListener("pointerdown", e => {
            e.preventDefault();
            sp.bug.setPointerCapture(e.pointerId);
            sp.dragging = true;
            sp.grabbed = true;
            // El decor puede estar oculto al montar (fuera de evento):
            // el largo real del hilo se mide al primer agarre
            if (!sp.restLen) { sp.restLen = sp.el.offsetHeight || 110; sp.len = sp.restLen; }
            sp.calm = 0;
            sp.hist = [];
            sp.el.style.animation = "none";   // el CSS deja de mandar
            sp.bug.style.cursor = "grabbing";
            wake();
        });

        sp.bug.addEventListener("pointermove", e => {
            if (!sp.dragging) return;
            // Ancla del hilo: esquina superior (width 0 → x del borde)
            const r = sp.el.getBoundingClientRect();
            const dx = e.clientX - r.left;
            const dy = e.clientY - r.top;
            const dist = Math.hypot(dx, dy) || 1;
            // El hilo se estira hasta x3 y se acorta hasta la mitad
            sp.len = Math.min(sp.restLen * 3, Math.max(sp.restLen * 0.5, dist));
            // Ángulo respecto a la vertical, tope ±80°
            const t = Math.atan2(dx, dy);
            sp.theta = Math.max(-1.4, Math.min(1.4, t));
            sp.hist.push({ t: e.timeStamp, theta: sp.theta, len: sp.len });
            if (sp.hist.length > 5) sp.hist.shift();
        });

        const drop = e => {
            if (!sp.dragging) return;
            sp.dragging = false;
            sp.bug.style.cursor = "grab";
            // Impulso de suelta: velocidad angular y de estirado estimadas
            // con las últimas muestras del arrastre
            const h = sp.hist;
            if (h.length > 1) {
                const a = h[0], b = h[h.length - 1];
                const dt = Math.max(1, b.t - a.t) / 1000;
                // Impulso de suelta, con tope: un tirón brusco lanza la
                // araña pero sin que dé vueltas de campana eternas
                sp.omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, (b.theta - a.theta) / dt));
                sp.lenV = Math.max(-MAX_LEN_V, Math.min(MAX_LEN_V, (b.len - a.len) / dt));
            }
        };
        sp.bug.addEventListener("pointerup", drop);
        sp.bug.addEventListener("pointercancel", drop);
    }

    return () => cancelAnimationFrame(raf);
}
