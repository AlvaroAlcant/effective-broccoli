// Arañas de Halloween con físicas: cada hilo (.hwn-thread) cuelga de su
// ancla superior como una cuerda elástica. Se integra en coordenadas
// cartesianas (x, y respecto al ancla, y hacia abajo): la gravedad tira
// siempre y la cuerda solo frena cuando está tensa (dist > largo). Así,
// arrastrar la araña hacia arriba destensa el hilo — al soltarla cae
// hasta que la cuerda la engancha, y acaba colgando en la vertical,
// donde retoma el vaivén suave del CSS.
export function initSpiders(root) {
    const threads = [...root.querySelectorAll(".hwn-thread")];
    if (!threads.length) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const GRAV = 2600;      // px/s² — gravedad
    const SPRING = 380;     // k de la cuerda cuando está tensa (px/s² por px)
    const RDAMP = 14;       // amortiguación radial (frena el estirado)
    const ADRAG = 0.55;     // rozamiento del aire sobre la velocidad total
    const EPS_V = 45;       // px/s — velocidad máxima "casi quieta"
    const EPS_AMP = 4.5;    // px — amplitud residual que cuenta como reposo
    const MAX_V = 1600;     // px/s — tope del impulso de suelta

    const spiders = threads.map(el => ({
        el,
        bug: el.querySelector("i"),
        restLen: el.offsetHeight,
        x: 0, y: el.offsetHeight,   // posición respecto al ancla (y abajo)
        vx: 0, vy: 0,
        ax: 0, ay: 0,               // ancla en coordenadas de viewport
        dragging: false,
        grabbed: false,             // al menos una vez: el CSS ya no manda
        hist: [],                   // muestras {t, x, y} para la suelta
        calm: 0,                    // tiempo acumulado casi en reposo
    }));

    let last = 0, raf = 0;

    function frame(now) {
        const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
        last = now;
        for (const sp of spiders) {
            if (!sp.grabbed) continue;
            if (!sp.dragging) {
                sp.vy += GRAV * dt;
                const dist = Math.hypot(sp.x, sp.y) || 1;
                if (dist > sp.restLen) {
                    // Cuerda tensa: resorte radial que la devuelve a su
                    // largo y frena el estiramiento (péndulo amortiguado)
                    const nx = sp.x / dist, ny = sp.y / dist;
                    const vr = sp.vx * nx + sp.vy * ny;
                    const a = -SPRING * (dist - sp.restLen) - RDAMP * vr;
                    sp.vx += a * nx * dt;
                    sp.vy += a * ny * dt;
                }
                // Aire: frena todo el movimiento, más suave que la
                // cuerda. Cuando va lento el rozamiento sube (fricción),
                // si no la oscilación residual tardaría una eternidad
                const slow = Math.hypot(sp.vx, sp.vy) < 90;
                const dragK = Math.exp(-(slow ? 3.2 : ADRAG) * dt);
                sp.vx *= dragK;
                sp.vy *= dragK;
                sp.x += sp.vx * dt;
                sp.y += sp.vy * dt;
                // ¿Ya llegó a su sitio? La AMPLITUD — distancia al punto
                // de reposo — es casi constante durante el ciclo: una
                // vez decae por debajo del umbral ya no vuelve a subir.
                // El reposo no está en restLen: la gravedad estira la
                // cuerda elástica sag = g/k píxeles por debajo
                const sag = GRAV / SPRING;
                const amp = Math.hypot(sp.x, dist - (sp.restLen + sag));
                const quiet = amp < EPS_AMP &&
                              Math.hypot(sp.vx, sp.vy) < EPS_V;
                sp.calm = quiet ? sp.calm + dt : 0;
                if (sp.calm > 0.6) {
                    sp.grabbed = false;
                    sp.vx = sp.vy = 0;
                    sp.x = 0;
                    sp.y = sp.restLen;
                    sp.el.style.transform = "";
                    sp.el.style.height = "";
                    sp.el.style.opacity = "";
                    sp.el.style.animation = "";
                    continue;
                }
            }
            // Posición → hilo: largo = distancia, ángulo = desviación.
            // Ojo al signo: rotate(+) en CSS lleva la punta a la izquierda
            const dist = Math.hypot(sp.x, sp.y);
            sp.el.style.height = Math.max(4, dist) + "px";
            sp.el.style.transform = `rotate(${-Math.atan2(sp.x, sp.y)}rad)`;
            // Hilo destensado: se ve más tenue para distinguirlo
            sp.el.style.opacity = dist < sp.restLen * 0.98 ? "0.35" : "";
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
            // Ancla del hilo en coordenadas de viewport. Se toma de
            // offsetLeft/offsetTop (layout) porque getBoundingClientRect
            // del hilo YA viene rotado y su bounding box se desplaza —
            // eso hacía el arrastre asimétrico
            const dr = root.getBoundingClientRect();
            sp.ax = dr.left + sp.el.offsetLeft;
            sp.ay = dr.top + sp.el.offsetTop;
            // El decor puede estar oculto al montar (fuera de evento):
            // el largo real del hilo se mide al primer agarre
            if (!sp.restLen) { sp.restLen = sp.el.offsetHeight || 110; }
            sp.calm = 0;
            sp.hist = [];
            sp.el.style.animation = "none";   // el CSS deja de mandar
            sp.bug.style.cursor = "grabbing";
            wake();
        });

        sp.bug.addEventListener("pointermove", e => {
            if (!sp.dragging) return;
            // La araña va donde está el puntero: arriba destensa el hilo,
            // abajo lo estira. Sin topes: la propia cuerda marca el juego
            sp.x = e.clientX - sp.ax;
            sp.y = e.clientY - sp.ay;
            sp.hist.push({ t: e.timeStamp, x: sp.x, y: sp.y });
            if (sp.hist.length > 5) sp.hist.shift();
        });

        const drop = e => {
            if (!sp.dragging) return;
            sp.dragging = false;
            sp.bug.style.cursor = "grab";
            // Impulso de suelta: velocidad estimada con las últimas
            // muestras del arrastre, con tope para que no salga disparada
            const h = sp.hist;
            if (h.length > 1) {
                const a = h[0], b = h[h.length - 1];
                const dt = Math.max(1, b.t - a.t) / 1000;
                sp.vx = Math.max(-MAX_V, Math.min(MAX_V, (b.x - a.x) / dt));
                sp.vy = Math.max(-MAX_V, Math.min(MAX_V, (b.y - a.y) / dt));
            }
        };
        sp.bug.addEventListener("pointerup", drop);
        sp.bug.addEventListener("pointercancel", drop);
    }

    return () => cancelAnimationFrame(raf);
}
