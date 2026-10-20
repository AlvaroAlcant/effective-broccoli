// Economía del juego: monedas, caramelos de evento, tienda (estilos de
// fuente, fondos, extras de Tecleo y efectos de tecleo) e inventario.
// La persistencia va por StorageService; lo que se ve lo pinta Svelte
// desde S; las consultas ajenas (admin, logros, al azar, applyLang) se
// inyectan con bind().
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang, t } from './i18n.js';
import { events } from './events.svelte.js';
import { EVENTS } from '../data/events.js';
import { FONT_STYLES, BACKGROUNDS, EXTRAS, TYPE_EFFECTS } from '../data/catalog.js';
import { VEYON_BGS, VEYON_PLACEHOLDER } from '../data/veyon.js';

// ---------- Registro de tipos de artículo ----------
// Cada tipo declara su lista, el campo de S donde viven los poseídos y
// los textos/operaciones propias. Añadir una categoría nueva a la tienda
// = una entrada aquí + sus datos en catalog.js.
//
// La lista de cada tipo se COMPONE sola: catálogo base + los items que
// cada evento declara en data/events.js (con `event` estampado a su id).
function withEventItems(kind, base) {
    const out = base.slice();
    for (const id in EVENTS) {
        for (const it of EVENTS[id].items || []) {
            if (it.kind === kind) out.push({ ...it, event: id });
        }
    }
    return out;
}

const KINDS = {
    font:  { list: withEventItems("font", FONT_STYLES),   owned: "owned",       icon: "🔤", buyMsg: "shopBought" },
    bg:    { list: withEventItems("bg", BACKGROUNDS),     owned: "ownedBgs",    icon: "🖼️", buyMsg: "shopBoughtBg" },
    extra: { list: withEventItems("extra", EXTRAS),       owned: "ownedExtras", icon: "",    buyMsg: "shopBought" },
    fx:    { list: withEventItems("fx", TYPE_EFFECTS),    owned: "ownedFx",     icon: "",    buyMsg: "shopBoughtFx" },
};

export class EconomyService {
    // Dependencias inyectadas
    isAdmin = () => false;
    achAdd = () => {};
    getExtraRun = () => null;   // extras del Modo Al azar en curso
    resetExtraRun = () => {};   // lo limpia el juego al recargar la tienda
    applyLang = () => {};       // resincroniza fondo/canvas al cambiar S.bg

    bind({ isAdmin, achAdd, getExtraRun, resetExtraRun, applyLang }) {
        if (isAdmin) this.isAdmin = isAdmin;
        if (achAdd) this.achAdd = achAdd;
        if (getExtraRun) this.getExtraRun = getExtraRun;
        if (resetExtraRun) this.resetExtraRun = resetExtraRun;
        if (applyLang) this.applyLang = applyLang;
    }

    // ---------- Monedas y tienda: persistencia ----------
    loadShop() {
        try {
            S.coins = parseInt(storage.get("teclear.monedas") || "0", 10) || 0;
            const o = storage.getJSON("teclear.estilos", null);
            if (Array.isArray(o) && o.length) S.owned = o;
            const eq = storage.get("teclear.estilo");
            if (eq && S.owned.includes(eq)) S.equipped = eq;
            const ob = storage.getJSON("teclear.fondos", null);
            if (Array.isArray(ob) && ob.length) {
                S.ownedBgs = ob;
            } else if (storage.get("teclear.fondos") === null &&
                       storage.get("teclear.fondo") === "franco") {
                // Migración: quien ya usaba el fondo de Franco antes de la tienda lo conserva
                S.ownedBgs = ["dark", "franco"];
            }
            const ex = storage.getJSON("teclear.extras", null);
            if (Array.isArray(ex)) S.ownedExtras = ex;
            const rawOn = storage.get("teclear.extrasOn");
            if (rawOn) {
                const eo = JSON.parse(rawOn);
                if (eo && typeof eo === "object") S.extraOn = eo;
            } else if (storage.get("teclear.picante") === "1") {
                S.extraOn.picante = true;   // clave antigua del modo picante
            }
            const fo = storage.getJSON("teclear.efectosTecleo", null);
            if (Array.isArray(fo)) S.ownedFx = fo;
            const feq = storage.get("teclear.efectoTecleo");
            if (feq) S.fxEquipped = feq;
        } catch (e) {
            S.coins = 0;
            S.owned = ["clasico"];
            S.equipped = "clasico";
            S.ownedBgs = ["dark"];
            S.ownedExtras = [];
            S.extraOn = { picante: false, caos: false, php: false, espejo: false, andaluz: false, azar: false, cubico: false };
            S.ownedFx = [];
            S.fxEquipped = "";
            this.resetExtraRun();
        }
        if (!S.owned.includes("clasico")) S.owned.push("clasico");
        if (!S.ownedBgs.includes("dark")) S.ownedBgs.push("dark");
        // Solo se admiten extras conocidos y comprados: nada de marcas
        // raras. La lista es la compuesta (catálogo + items de evento)
        S.ownedExtras = S.ownedExtras.filter(id => KINDS.extra.list.some(x => x.id === id));
        KINDS.extra.list.forEach(x => {
            if (!S.ownedExtras.includes(x.id)) S.extraOn[x.id] = false;
            S.extraOn[x.id] = !!S.extraOn[x.id];
        });
        // Mismo criterio para los efectos de tecleo: solo los comprados
        S.ownedFx = S.ownedFx.filter(id => KINDS.fx.list.some(f => f.id === id));
        if (!S.ownedFx.includes(S.fxEquipped)) S.fxEquipped = "";
    }

    saveShop() {
        storage.set("teclear.monedas", String(S.coins));
        storage.setJSON("teclear.estilos", S.owned);
        storage.set("teclear.estilo", S.equipped);
        storage.setJSON("teclear.fondos", S.ownedBgs);
        storage.setJSON("teclear.extras", S.ownedExtras);
        storage.setJSON("teclear.extrasOn", S.extraOn);
        storage.set("teclear.picante", S.extraOn.picante ? "1" : "0");
        storage.setJSON("teclear.efectosTecleo", S.ownedFx);
        storage.set("teclear.efectoTecleo", S.fxEquipped);
    }

    // ---------- Caramelos: la moneda del evento de Halloween ----------
    // Se cargan y se guardan aparte del dinero normal; si el
    // almacenamiento falla, a cero. Nunca bajan de 0.
    loadCandy() {
        S.caramelos = storage.getInt("teclear.caramelos", 0);
        if (S.caramelos < 0) S.caramelos = 0;
    }

    saveCandy() {
        storage.set("teclear.caramelos", String(S.caramelos));
    }

    // Cómo se pintan las cantidades en pantalla (los admins juegan con
    // saldo real: el panel de depuración es su forma de concederse)
    fmtCoins(n) {
        return String(n);
    }

    fmtCandy(n) {
        return String(n);
    }

    // Suma (o resta) caramelos. El contador nunca baja de cero: fallar
    // con 0 caramelos en el modo Encantado NO mueve el número.
    giveCandy(n) {
        if (!n) return;
        const antes = Math.max(0, S.caramelos);
        S.caramelos = Math.max(0, S.caramelos + n);
        // La partida actual apunta el saldo neto para los resultados
        if (S.state === "playing") S.candyRun += S.caramelos - antes;
        this.saveCandy();
    }

    // Cobra el precio de un artículo de la tienda. Los artículos del
    // EVENTO se pagan en CARAMELOS (con la misma cifra que costaban en
    // monedas); el resto, en monedas.
    cobra(item) {
        const ev = !!item.event;
        const saldo = ev ? S.caramelos : S.coins;
        if (saldo < item.price) {
            S.shopMsgTxt = ev ? t("shopNoCandy") : t("shopNoMoney");
            return false;
        }
        if (ev) {
            S.caramelos = Math.max(0, S.caramelos - item.price);   // se pagan en caramelos
            this.saveCandy();
        } else {
            S.coins -= item.price;                              // se pagan en monedas
        }
        return true;
    }

    // Otorga monedas por cada palabra completada sin errores.
    // La cantidad sube con la racha (x1 … x5), igual que los puntos
    giveCoins(n) {
        S.coins += n;
        S.coinsRun += n;
        // Logro «Shinyy»: cuenta el dinero ganado en TOTAL, sumando lo
        // que entra (gastar en la tienda no resta del progreso)
        this.achAdd("shinyy", n);
        // Caramelos del evento: se ganan en TODOS los modos junto a las
        // monedas y con la MISMA cantidad (los gasta la tienda de evento)
        this.giveCandy(n);
        this.saveShop();
    }

    // ---------- Artículos: operaciones genéricas por tipo ----------
    // Lista COMPUESTA de un tipo: catálogo base + items de los eventos.
    // Todo el mundo que necesite iterar artículos de un tipo pasa por
    // aquí, así los items de evento no quedan fuera de ninguna vista
    all(kind) {
        return KINDS[kind].list;
    }

    // Busca el artículo en la lista de su tipo (lo usan las acciones)
    findItem(kind, id) {
        return KINDS[kind].list.find(it => it.id === id);
    }

    // ¿El artículo está comprado? El campo donde vive lo dice el registro
    owns(kind, id) {
        return S[KINDS[kind].owned].includes(id);
    }

    // ¿El artículo está en uso ahora mismo?
    itemOn(kind, id) {
        if (kind === "font") return S.equipped === id;
        if (kind === "bg") return S.bg === id;
        if (kind === "extra") return !!S.extraOn[id];
        return S.fxEquipped === id;   // fx
    }

    // Pone el artículo en uso (las restricciones las sabe cada dominio)
    useItem(kind, id) {
        if (kind === "font") this.setEquipped(id);
        else if (kind === "bg") this.setBgEquipped(id);
        else if (kind === "extra") this.setExtra(id, true);
        else this.setFx(id);
    }

    // Lo apaga — solo extras y efectos se apagan; fuente y fondo siempre
    // hay alguno puesto, así que devuelven false (sin botón de apagar)
    offItem(kind, id) {
        if (kind === "extra") { this.setExtra(id, false); return true; }
        if (kind === "fx") { this.setFx(""); return true; }
        return false;
    }

    // Compra genérica de cualquier artículo de la tienda: ya lo tienes,
    // viene de un logro o se cobra (evento → caramelos; resto → monedas).
    // La compra solo DESBLOQUEA: ponerse/apagar se hace en el Inventario.
    buyItem(kind, item) {
        if (!item || this.owns(kind, item.id)) return;
        if (item.ach) {
            // Los artículos de logro no se compran (los efectos lo hacían
            // en silencio; el mensaje aclara por qué no hay botón)
            S.shopMsgTxt = t("achNeed");
            return;
        }
        if (!this.cobra(item)) return;
        S[KINDS[kind].owned].push(item.id);
        this.saveShop();
        if (kind === "extra") this.applyExtras();   // entra en el menú de variantes
        S.shopMsgTxt = t(item.msgBuy || KINDS[kind].buyMsg);
    }

    // Tarjetas de una sección de la tienda, con su estado actual
    shopCards(kind) {
        const K = KINDS[kind];
        const en = uiLang() === "en";
        return K.list
            .filter(it => !it.event || (it.event !== events.activeId() && this.owns(kind, it.id)))
            .map(it => ({
                kind, id: it.id,
                cls: it.cls, font: it.font, icon: it.icon || K.icon,
                // Con el Modo Veyon, los fondos vetados enseñan la imagen de repuesto
                img: kind === "bg" && this.veyonHiddenBg(it.id) ? VEYON_PLACEHOLDER : it.img,
                art: it.art, color: it.color,
                name: en ? it.en : it.es,
                desc: en ? it.descEn : it.descEs,
                equipped: this.itemOn(kind, it.id),
                on: this.itemOn(kind, it.id),
                own: this.owns(kind, it.id), ach: !!it.ach,
                price: it.price, cant: S.coins < it.price
            }));
    }

    // Las tarjetas de la tienda de evento (se pagan en caramelos):
    // el evento activo ya declara sus items completos en `def.items`
    eventCards() {
        const def = events.active;
        if (!def || !def.items) return [];
        const en = uiLang() === "en";
        return def.items.map(it => {
            const kind = it.kind;
            return {
                kind, id: it.id,
                icon: it.icon || KINDS[kind].icon,
                name: en ? it.en : it.es,
                desc: en ? it.descEn : it.descEs,
                img: it.img, color: it.color,
                equipped: this.itemOn(kind, it.id),
                on: this.itemOn(kind, it.id),
                own: this.owns(kind, it.id), price: it.price,
                cant: S.caramelos < it.price
            };
        });
    }

    // ---------- Estilos de fuente ----------
    styleById(id) {
        return KINDS.font.list.find(s => s.id === id) || KINDS.font.list[0];
    }

    // Aplica el estilo equipado al tablero y a la entrada
    applyStyle() {
        const st = this.styleById(S.equipped);
        KINDS.font.list.forEach(s => document.body.classList.remove(s.cls));
        document.body.classList.add(st.cls);
    }

    setEquipped(id) {
        if (!S.owned.includes(id)) return;
        S.equipped = id;
        this.saveShop();
        this.applyStyle();
        this.invSay(t("shopEquippedMsg"));
    }

    // ---------- Extras de juego (picante, caos, php…) ----------
    // Cada extra comprado pasa a ser una variante del modo Tecleo y se
    // elige en el menú desplegable de al lado del botón "⌨️ Tecleo".
    ownsExtra(id) {
        return S.ownedExtras.includes(id);
    }

    extraActive(id) {
        // Los extras de la tienda son variantes del modo Tecleo: fuera de
        // él no actúan (ni en Adivinar, ni en Imágenes, ni en Aventura,
        // ni en Supervivencia), aunque sigan elegidos en el menú
        if (S.mode !== "type") return false;
        if (!this.ownsExtra(id)) return false;
        // Durante una partida el Modo Al azar manda sobre extraOn
        const extraRun = this.getExtraRun();
        if (extraRun) return !!extraRun[id];
        return !!S.extraOn[id];
    }

    // Extra elegido en el desplegable ("", si se juega al Tecleo clásico).
    // Manda el gusto guardado (extraOn), no si ahora actúa: el menú sigue
    // enseñando la variante elegida aunque el modo actual no sea Tecleo.
    activeExtraId() {
        const x = KINDS.extra.list.find(e => this.ownsExtra(e.id) && S.extraOn[e.id]);
        return x ? x.id : "";
    }

    // Marca en el body qué extras actúan ahora (ilumina el tablero)
    applyExtras() {
        KINDS.extra.list.forEach(x => {
            document.body.classList.toggle(x.id + "-on", this.extraActive(x.id));
        });
    }

    setExtra(id, on) {
        if (!this.ownsExtra(id) || S.state === "playing") return;
        // Solo una variante activa: usar una apaga las demás
        if (on) {
            KINDS.extra.list.forEach(x => S.extraOn[x.id] = (x.id === id));
        } else {
            S.extraOn[id] = false;
        }
        this.saveShop();
        this.applyExtras();
        const x = KINDS.extra.list.find(e => e.id === id);
        if (x) this.invSay(t(on ? x.msgOn : x.msgOff));
    }

    // Solo puede haber una variante de Tecleo activa a la vez: al elegir
    // una en el menú se apagan las demás
    chooseExtra(id) {
        if (S.state === "playing") return;
        KINDS.extra.list.forEach(x => S.extraOn[x.id] = (x.id === id));
        this.saveShop();
        this.applyExtras();
        const x = KINDS.extra.list.find(e => e.id === id);
        S.shopMsgTxt = x ? t(x.msgOn) : t("modeClassicMsg");
    }

    // (la compra de extras la hace buyItem("extra", x) como cualquier tipo)

    // ---------- Efectos de tecleo (chispas con cada letra) ----------
    fxById(id) {
        return KINDS.fx.list.find(f => f.id === id) || null;
    }

    ownsFx(id) {
        return !!id && S.ownedFx.includes(id);
    }

    // El efecto comprado y puesto en uso (null si no hay ninguno)
    activeFx() {
        const f = this.fxById(S.fxEquipped);
        return f && this.ownsFx(f.id) ? f : null;
    }

    // Deja el color del efecto activo en <body>: ahí lo cogen el
    // resplandor del campo de entrada y las tarjetas de la tienda
    applyFx() {
        KINDS.fx.list.forEach(f => {
            document.body.classList.toggle("fx-" + f.id, !!this.activeFx() && S.fxEquipped === f.id);
        });
    }

    // Pone un efecto en uso (id vacío lo apaga); solo uno a la vez.
    // Como la tienda ya no selecciona, esta acción vive en el Inventario
    setFx(id) {
        if (S.state === "playing") return;
        if (id && !this.ownsFx(id)) return;
        S.fxEquipped = id || "";
        this.saveShop();
        this.applyFx();
        this.invSay(t(S.fxEquipped ? "shopEquippedFxMsg" : "shopDeactivatedFxMsg"));
    }

    // (la compra de efectos la hace buyItem("fx", f) como cualquier tipo)

    // ---------- Fondos ----------
    // ¿Este fondo se tapa con el Modo Veyon?
    veyonHiddenBg(id) {
        return S.veyon && VEYON_BGS.includes(id);
    }

    setBgEquipped(id) {
        if (S.state === "playing" || !S.ownedBgs.includes(id)) return;
        S.bg = id;
        storage.set("teclear.fondo", S.bg);
        this.applyLang();
        this.invSay(t("shopEquippedBgMsg"));
    }

    // (la compra de fondos la hace buyItem("bg", b) como cualquier tipo)

    bgPower(id) {
        // En el modo Aventura no actúa ningún fondo: el modo lleva el suyo
        if (S.mode === "aventura") return false;
        return S.bg === id && S.ownedBgs.includes(id);
    }

    // Texto de la habilidad del fondo equipado (vacío si no tiene ninguna)
    bgPowerDesc() {
        const b = KINDS.bg.list.find(x => x.id === S.bg);
        // Los fondos de decoración (Circuito, Hacker) no aportan nada:
        // son puro adorno ganado con un logro
        if (!b || b.decor || b.id === "dark") return "";
        return uiLang() === "es" ? b.descEs : b.descEn;
    }

    // ---------- Inventario ----------
    // Aviso del panel: los mensajes de «elegir artículo» van aquí (la
    // tienda se queda los de compra)
    invSay(txt) {
        S.invMsgTxt = txt;
    }

    // Devuelve la lista completa de artículos con su estado, recorriendo
    // el registro de tipos (añadir una categoría = una entrada en KINDS):
    // { tipo, id, nombre, icono, img, enUso, deLogro, event, usar, apagar }
    invItems() {
        const en = uiLang() === "en";
        const out = [];
        for (const kind in KINDS) {
            const K = KINDS[kind];
            K.list.forEach(it => {
                if (!this.owns(kind, it.id)) return;
                const offable = kind === "extra" || kind === "fx";
                out.push({
                    tipo: kind, id: it.id,
                    nombre: en ? it.en : it.es,
                    icono: it.icon || K.icon,
                    // Con el Modo Veyon, los fondos vetados enseñan la imagen
                    // de repuesto, igual que en la tienda y en el selector
                    img: kind === "bg" && this.veyonHiddenBg(it.id) ? VEYON_PLACEHOLDER : (it.img || ""),
                    previewFont: it.font, cls: it.cls, art: it.art,
                    enUso: this.itemOn(kind, it.id),
                    deLogro: !!it.ach, event: it.event || false,
                    usar: () => this.useItem(kind, it.id),
                    apagar: offable ? () => this.offItem(kind, it.id) : null
                });
            });
        }
        return out;
    }
}

export const eco = new EconomyService();
