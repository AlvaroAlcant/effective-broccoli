// ---------- Registro de eventos ----------
// Cada evento es un dato: ventana de fechas, clase del <body>, la
// variante de Supervivencia que habilita y los artículos exclusivos de
// su tienda de evento. Arrancar/cerrar un evento = tocar SOLO esta tabla;
// el EventService la recorre sola.
import imgFredi from '#lib/img/fredi.gif';
import imgKeleto from '#lib/img/keleto.gif';
import imgCompany from '#lib/img/company.gif';
import imgGranny from '#lib/img/granny-dance.gif';

export const EVENTS = {
    // El evento de Halloween empieza el 8 de octubre y termina el 3 de
    // noviembre a las 12:00 (todos los años). Mientras dure, el logo y el
    // menú se visten de Halloween y se abre la TIENDA DE EVENTO, con
    // artículos exclusivos que se pagan en CARAMELOS: los fondos Five
    // Nigths (1987), Calaca (666), Company (1200) y ViejaEnLaGolden
    // (500), el efecto de tecleo Sangre (666) y el modo de juego Truco o
    // trato (2040). Cuando el evento termina, la tienda de evento se
    // cierra, pero lo comprado se queda para siempre.
    // Cada fondo trae su habilidad: Chica Rush, Baile calaca, Chatarra
    // (pasiva) y Tiempo congelado (pasiva).
    //
    // Los items se declaran AQUÍ, completos — la propiedad `event` se
    // estampa sola al componerlos en economy.js. Añadir un artículo de
    // evento = una entrada en esta lista, sin tocar catalog.js.
    halloween: {
        id: "halloween",
        bodyClass: "halloween",          // clase que viste el <body>
        supVariant: "encantado",         // variante que ofrece el selector
        items: [
            {   // Fondo Five Nigths con el GIF de Fredi mirando fijamente.
                // Solo está a la venta mientras dura el evento; una vez
                // comprado se queda para siempre. Su habilidad es el Chica Rush.
                kind: "bg",
                id: "fivenights", price: 1987,
                es: "Five Nigths", en: "Five Nigths",
                descEs: "Habilidad «Chica Rush»: el tiempo se congela durante 20 segundos sin poder escribir y aparecen cupcakes sin parar; toca uno y tienes un 25 % de ganar 1 segundo y un 75 % de ganarte un caramelo (una sola vez por partida). ¡Fredi te mira desde la oscuridad! Solo durante el evento de Halloween.",
                descEn: "“Chica Rush” ability: time freezes for 20 seconds while you cannot type and cupcakes keep popping up; tap one for a 25% chance of +1 second or a 75% chance of a candy (once per match). Freddy is staring at you from the dark! Halloween event only.",
                powEs: "«Chica Rush»: 20 s con el tiempo congelado cazando cupcakes (+1 s o un caramelo).",
                powEn: "“Chica Rush”: 20 s of frozen time catching cupcakes (+1 s or a candy).",
                img: imgFredi, icon: "📼"
            },
            {   // Fondo Calaca (keleto.gif): una calaca bailarina. Su
                // habilidad es el «Baile calaca»: al dispararla salen
                // esqueletos bailando por la pantalla y las siguientes
                // 15 palabras son de HUESOS con DOBLE de puntos, monedas
                // y caramelos (una sola vez por partida).
                kind: "bg",
                id: "calaca", price: 666,
                es: "Calaca", en: "Skull",
                descEs: "Habilidad «Baile calaca»: aparecen esqueletos bailando por toda la pantalla y las siguientes 15 palabras son de huesos y partes del cuerpo, con DOBLE de puntos, monedas y caramelos (una sola vez por partida). Solo durante el evento de Halloween.",
                descEn: "“Bone dance” ability: skeletons start dancing all over the screen and the next 15 words are bones and body parts, with DOUBLE points, coins and candies (once per match). Halloween event only.",
                powEs: "«Baile calaca»: 15 palabras de huesos con DOBLE de puntos, monedas y caramelos y esqueletos bailando (1 vez por partida).",
                powEn: "“Bone dance”: 15 bone words with DOUBLE points, coins and candies while skeletons dance (once per match).",
                img: imgKeleto, icon: "💀"
            },
            {   // Fondo Company (company.gif): Lethal Company. No tiene
                // tecla: es pasiva —durante la partida van apareciendo
                // trozos de chatarra y, al tocarlos, dan experiencia extra.
                kind: "bg",
                id: "company", price: 1200,
                es: "Company", en: "Company",
                descEs: "Habilidad pasiva «Chatarra»: durante la partida van apareciendo trozos de chatarra de Lethal Company por la pantalla; al tocarlos te dan experiencia extra. Solo durante el evento de Halloween.",
                descEn: "Passive “Scrap” ability: pieces of Lethal Company scrap keep popping up during the match and tapping them grants you extra experience. Halloween event only.",
                powEs: "«Chatarra»: trozos de chatarra por la pantalla que dan experiencia extra al tocarlos.",
                powEn: "“Scrap”: Lethal Company pieces on screen give you extra experience when tapped.",
                img: imgCompany, icon: "🔧"
            },
            {   // Fondo ViejaEnLaGolden (granny-dance.gif): la abuela
                // bailando. Pasiva: el cronómetro está CONGELADO hasta
                // que empiezas a teclear la palabra; al terminarla se
                // vuelve a congelar hasta que empieces con la siguiente.
                kind: "bg",
                id: "viejaenlagolden", price: 500,
                es: "ViejaEnLaGolden", en: "Golden Granny",
                descEs: "Habilidad pasiva «Tiempo congelado»: el cronómetro no avanza mientras no tecleas; cada vez que sale una palabra se queda parado hasta que la empiezas, y al escribirla entera se vuelve a congelar hasta la siguiente. Solo durante el evento de Halloween.",
                descEn: "Passive “Frozen time” ability: the clock does not run while you are not typing; every time a word appears it stops until you start typing it, and once it is completed it freezes again until the next one. Halloween event only.",
                powEs: "«Tiempo congelado»: el reloj espera a que teclees y se para entre palabras.",
                powEn: "“Frozen time”: the clock waits for your typing and pauses between words.",
                img: imgGranny, icon: "🧓"
            },
            {   // Efecto Sangre: gotas que salpican y gotean con cada letra
                kind: "fx",
                id: "sangre", price: 666,
                icon: "🩸", color: "#e11d48",
                es: "Sangre", en: "Blood",
                descEs: "Gotas de sangre que salpican y gotean con cada letra que tecleas.",
                descEn: "Blood drops splashing and dripping with every letter you type.",
                colors: ["#e11d48", "#b00020", "#ff2d55", "#7f0d1a"],
                glyph: "🩸", glyphEvery: 5, count: 9, power: 65, rise: 110,
                size: 15, life: 950, shape: "drop"
            },
            {   // Extra Truco o trato: palabras terroríficas, doble de
                // monedas y castigo doble por tecla fallada
                kind: "extra",
                id: "truco", price: 2040,
                icon: "🍬",
                es: "Modo Truco o trato", en: "Trick or treat mode",
                descEs: "Evento de Halloween: palabras de Halloween y DOBLE de monedas, pero cada tecla fallada cuesta el doble: pierdes 2 segundos y 2 de experiencia.",
                descEn: "Halloween event: Halloween words and DOUBLE coins, but every wrong key costs double: you lose 2 seconds and 2 experience.",
                msgBuy: "shopBoughtTruco",
                msgOn: "shopEquippedTrucoMsg",
                msgOff: "shopDeactivatedTrucoMsg"
            },
            // ---------- Letras de Halloween ----------
            // Estilos de letra exclusivos del evento, que se pagan en
            // caramelos. Se compran aquí (a diferencia de la tienda
            // normal, que solo compra) y quedan guardados para siempre:
            // después se equipan desde el Inventario, como el resto.
            {   // Letras pixeladas de 8 bits, como una arcade de feria
                kind: "font",
                id: "pixelhwn", price: 240,
                cls: "ff-pixelhwn",
                font: '"Press Start 2P", Consolas, "Courier New", monospace',
                es: "Pixel", en: "Pixel",
                descEs: "Letras pixeladas de 8 bits con brillo de neón naranja y violeta, como una recreativa de feria embrujada.",
                descEn: "8-bit pixel letters with orange and violet neon glow, like a haunted fairground arcade."
            },
            {   // Letras de huesos rotos: blancas y agrietadas
                kind: "font",
                id: "huesos", price: 360,
                cls: "ff-huesos",
                font: '"Creepster", "Impact", cursive',
                es: "Huesos", en: "Bones",
                descEs: "Letras hechas de huesos rotos: blancas como la cal, agrietadas y con sombra de fosa.",
                descEn: "Letters carved from broken bones: chalk-white, cracked, with a grave shadow."
            },
            {   // Ink Machine: tinta negra que gotea de cada letra
                kind: "font",
                id: "inkmachine", price: 460,
                cls: "ff-inkmachine",
                font: '"Nosifer", "Impact", cursive',
                es: "Ink Machine", en: "Ink Machine",
                descEs: "Letras de tinta negra que gotean sin parar, con un contorno claro para que sigan asomando en la oscuridad.",
                descEn: "Black ink letters that never stop dripping, with a pale outline so they still show in the dark."
            },
            {   // Maldito: carne con ojos que se mueven y cicatrices
                kind: "font",
                id: "maldito", price: 666,
                cls: "ff-maldito",
                font: '"Butcherman", "Impact", cursive',
                es: "Maldito", en: "Cursed",
                descEs: "Letras de carne viva con ojos que te siguen mirando y cicatrices cosidas. No parpadean: tú sí.",
                descEn: "Letters of living flesh with eyes that follow you and stitched scars. They don't blink: you do."
            },
        ],
        start: { month: 9, day: 8 },     // octubre (meses de 0 a 11)
        end:   { month: 10, day: 3, hour: 12 },  // 3 de noviembre, 12:00
    },
};

// Castigo de cada tecla fallada en el modo Truco o trato: se pierde
// el DOBLE de tiempo y de experiencia (2 segundos y 2 XP)
export const TT_TIME_PENALTY = 2;
export const TT_XP_PENALTY = 2;

export function eventStartDate(def, year) {
    return new Date(year, def.start.month, def.start.day, 0, 0, 0, 0);
}

export function eventEndDate(def, year) {
    return new Date(year, def.end.month, def.end.day, def.end.hour || 0, 0, 0);
}

// ¿Está activo el evento en esta fecha?
export function eventOn(def, now) {
    const d = now || new Date();
    return d >= eventStartDate(def, d.getFullYear()) &&
           d < eventEndDate(def, d.getFullYear());
}

// Texto de la cuenta atrás hasta el final del evento ("⏳ 3d 4h 12m 8s").
// Lo comparten el estado inicial (para que la barra nazca ya con texto)
// y el tick del EventService.
export function eventCountTxt(def, now) {
    const d = now || new Date();
    const ms = eventEndDate(def, d.getFullYear()) - d;
    const dd = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return "⏳ " + dd + "d " + h + "h " + m + "m " + s + "s";
}

// Evento activo al arrancar: el override de admin (si lo hay) o el
// primero del registro que toque por fecha. Espejo del script inline de
// app.html y del EventService — mismo criterio en los tres sitios.
export function initialEventId(testId) {
    if (testId && EVENTS[testId]) return testId;
    for (const id in EVENTS) {
        if (eventOn(EVENTS[id])) return id;
    }
    return null;
}
