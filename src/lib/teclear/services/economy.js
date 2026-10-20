// Economía del juego: monedas, caramelos de evento, tienda (estilos de
// fuente, fondos, extras de Tecleo y efectos de tecleo) e inventario.
// La persistencia va por StorageService; lo que se ve lo pinta Svelte
// desde S; las consultas ajenas (admin, logros, al azar, applyLang) se
// inyectan con bind().
import { S } from '../state.svelte.js';
import { storage } from '../storage.js';
import { uiLang, t } from './i18n.js';
import { FONT_STYLES, BACKGROUNDS, EXTRAS, TYPE_EFFECTS } from '../data/catalog.js';
import { VEYON_BGS, VEYON_PLACEHOLDER } from '../data/veyon.js';

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
        // Solo se admiten extras conocidos y comprados: nada de marcas raras
        S.ownedExtras = S.ownedExtras.filter(id => EXTRAS.some(x => x.id === id));
        EXTRAS.forEach(x => {
            if (!S.ownedExtras.includes(x.id)) S.extraOn[x.id] = false;
            S.extraOn[x.id] = !!S.extraOn[x.id];
        });
        // Mismo criterio para los efectos de tecleo: solo los comprados
        S.ownedFx = S.ownedFx.filter(id => TYPE_EFFECTS.some(f => f.id === id));
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

    // Cómo se pintan las cantidades en pantalla: los administradores ven ∞
    // porque pueden comprar lo que quieran sin gastar. Su saldo real no se
    // toca: solo se oculta el número.
    fmtCoins(n) {
        return this.isAdmin() ? "∞" : String(n);
    }

    fmtCandy(n) {
        return this.isAdmin() ? "∞" : String(n);
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
    // monedas); el resto, en monedas. El Administrador no gasta.
    cobra(item) {
        const ev = !!item.event;
        const saldo = ev ? S.caramelos : S.coins;
        if (!this.isAdmin() && saldo < item.price) {
            S.shopMsgTxt = ev ? t("shopNoCandy") : t("shopNoMoney");
            return false;
        }
        if (this.isAdmin()) return true;
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

    // ---------- Estilos de fuente ----------
    styleById(id) {
        return FONT_STYLES.find(s => s.id === id) || FONT_STYLES[0];
    }

    // Aplica el estilo equipado al tablero y a la entrada
    applyStyle() {
        const st = this.styleById(S.equipped);
        FONT_STYLES.forEach(s => document.body.classList.remove(s.cls));
        document.body.classList.add(st.cls);
    }

    setEquipped(id) {
        if (!S.owned.includes(id)) return;
        S.equipped = id;
        this.saveShop();
        this.applyStyle();
        this.invSay(t("shopEquippedMsg"));
    }

    buyStyle(st) {
        if (S.owned.includes(st.id)) return;   // ya está en el Inventario
        // Los estilos ganados con un logro no se compran con monedas
        if (st.ach) {
            S.shopMsgTxt = t("achNeed");
            return;
        }
        if (!this.isAdmin() && S.coins < st.price) {
            S.shopMsgTxt = t("shopNoMoney");
            return;
        }
        if (!this.isAdmin()) S.coins -= st.price;   // el Administrador no gasta
        S.owned.push(st.id);
        // La compra solo DESBLOQUEA: quién se pone se elige en el Inventario
        this.saveShop();
        S.shopMsgTxt = t("shopBought");
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
        const x = EXTRAS.find(e => this.ownsExtra(e.id) && S.extraOn[e.id]);
        return x ? x.id : "";
    }

    // Marca en el body qué extras actúan ahora (ilumina el tablero)
    applyExtras() {
        EXTRAS.forEach(x => {
            document.body.classList.toggle(x.id + "-on", this.extraActive(x.id));
        });
    }

    setExtra(id, on) {
        if (!this.ownsExtra(id) || S.state === "playing") return;
        // Solo una variante activa: usar una apaga las demás
        if (on) {
            EXTRAS.forEach(x => S.extraOn[x.id] = (x.id === id));
        } else {
            S.extraOn[id] = false;
        }
        this.saveShop();
        this.applyExtras();
        const x = EXTRAS.find(e => e.id === id);
        if (x) this.invSay(t(on ? x.msgOn : x.msgOff));
    }

    // Solo puede haber una variante de Tecleo activa a la vez: al elegir
    // una en el menú se apagan las demás
    chooseExtra(id) {
        if (S.state === "playing") return;
        EXTRAS.forEach(x => S.extraOn[x.id] = (x.id === id));
        this.saveShop();
        this.applyExtras();
        const x = EXTRAS.find(e => e.id === id);
        S.shopMsgTxt = x ? t(x.msgOn) : t("modeClassicMsg");
    }

    buyExtra(x) {
        if (this.ownsExtra(x.id)) return;   // ya está en el Inventario
        if (!this.cobra(x)) return;
        S.ownedExtras.push(x.id);
        // La compra solo DESBLOQUEA: activarla se hace en el Inventario
        this.saveShop();
        this.applyExtras();     // el nuevo extra entra en el menú de variantes
        S.shopMsgTxt = t(x.msgBuy);
    }

    // ---------- Efectos de tecleo (chispas con cada letra) ----------
    fxById(id) {
        return TYPE_EFFECTS.find(f => f.id === id) || null;
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
        TYPE_EFFECTS.forEach(f => {
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

    buyFx(f) {
        // Los efectos ganados con un logro no se compran con monedas
        if (f.ach || this.ownsFx(f.id)) return;   // ya está en el Inventario
        if (!this.cobra(f)) return;
        S.ownedFx.push(f.id);
        // La compra solo DESBLOQUEA: ponerlo en uso se hace en el Inventario
        this.saveShop();
        S.shopMsgTxt = t("shopBoughtFx");
    }

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

    buyBg(b) {
        if (S.ownedBgs.includes(b.id)) return;   // ya está en el Inventario
        // Los fondos ganados con un logro no se compran con monedas
        if (b.ach) {
            S.shopMsgTxt = t("achNeed");
            return;
        }
        if (!this.cobra(b)) return;
        S.ownedBgs.push(b.id);
        // La compra solo DESBLOQUEA: usarse se hace en el Inventario
        this.saveShop();
        S.shopMsgTxt = t("shopBoughtBg");
    }

    bgPower(id) {
        // En el modo Aventura no actúa ningún fondo: el modo lleva el suyo
        if (S.mode === "aventura") return false;
        return S.bg === id && S.ownedBgs.includes(id);
    }

    // Texto de la habilidad del fondo equipado (vacío si no tiene ninguna)
    bgPowerDesc() {
        const b = BACKGROUNDS.find(x => x.id === S.bg);
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

    // Devuelve la lista completa de artículos con su estado:
    // { tipo, id, nombre, icono, img, enUso, deLogro, event, usar, apagar }
    invItems() {
        const en = uiLang() === "en";
        const out = [];

        FONT_STYLES.forEach(s => {
            if (!S.owned.includes(s.id)) return;
            out.push({
                tipo: "font", id: s.id,
                nombre: en ? s.en : s.es,
                icono: "🔤", img: "", previewFont: s.font, cls: s.cls,
                enUso: S.equipped === s.id,
                deLogro: !!s.ach, event: false,
                // Un estilo nunca se apaga: siempre hay alguno puesto
                usar: () => this.setEquipped(s.id), apagar: null
            });
        });

        BACKGROUNDS.forEach(b => {
            if (!S.ownedBgs.includes(b.id)) return;
            out.push({
                tipo: "bg", id: b.id,
                nombre: en ? b.en : b.es,
                icono: b.icon || "🖼️",
                // Con el Modo Veyon, «General» e «Ia» enseñan la imagen de
                // repuesto, igual que en la tienda y en el selector
                img: this.veyonHiddenBg(b.id) ? VEYON_PLACEHOLDER : b.img,
                enUso: S.bg === b.id,
                deLogro: !!b.ach, event: b.event || false,
                // Igual que los estilos: siempre hay un fondo puesto
                usar: () => this.setBgEquipped(b.id), apagar: null
            });
        });

        EXTRAS.forEach(x => {
            if (!S.ownedExtras.includes(x.id)) return;
            out.push({
                tipo: "extra", id: x.id,
                nombre: en ? x.en : x.es,
                icono: x.icon, img: "",
                enUso: !!S.extraOn[x.id],
                deLogro: !!x.ach, event: x.event || false,
                // Un extra sí se apaga: vuelve el Tecleo clásico
                usar: () => this.setExtra(x.id, true),
                apagar: () => this.setExtra(x.id, false)
            });
        });

        TYPE_EFFECTS.forEach(f => {
            if (!S.ownedFx.includes(f.id)) return;
            out.push({
                tipo: "fx", id: f.id,
                nombre: en ? f.en : f.es,
                icono: f.icon, img: "", art: f.art,
                enUso: S.fxEquipped === f.id,
                deLogro: !!f.ach, event: f.event || false,
                // Un efecto también se apaga: sin chispas al teclear
                usar: () => this.setFx(f.id),
                apagar: () => this.setFx("")
            });
        });

        return out;
    }
}

export const eco = new EconomyService();
