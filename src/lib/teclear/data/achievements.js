// ---------- Definiciones de logros ----------
// ---------- Logros ----------
// Retos que se completan jugando: cada uno otorga una recompensa
// (un estilo de letra, un fondo de pantalla o un efecto de tecleo
// exclusivo que no está en la tienda).
// id: se guarda en localStorage · goal: veces que hay que lograrlo
// reward: { type: "fx" | "font" | "bg", id: … } → recompensa desbloqueada
export const ACHIEVEMENTS = [
    {
        id: "polvo",
        icon: "💥",
        goal: 100,
        es: "Un poco de pólvora",
        en: "A bit of gunpowder",
        descEs: "Escribe la palabra «creeper» 100 veces en total en el modo Tecleo con el Modo Cúbico activo.",
        descEn: "Type the word “creeper” 100 times in total in Typing mode with Cubic mode turned on.",
        reward: { type: "fx", id: "explosion" },
        rewardEs: "Efecto de tecleo «Explosión»",
        rewardEn: "Typing effect “Explosion”"
    },
    {
        // Progreso = monedas ganadas en TOTAL (se acumula con cada
        // palabra, ventaja o premio, sin gastar lo comprado)
        id: "shinyy",
        icon: "💎",
        goal: 1000000,
        es: "Shinyy",
        en: "Shinyy",
        descEs: "Gana un millón de monedas en total (suma de todas las monedas que hayas ganado jugando).",
        descEn: "Earn one million coins in total (the sum of every coin you have ever won).",
        reward: { type: "font", id: "shinyy" },
        rewardEs: "Estilo de letra «Shinyy» (diamante que brilla)",
        rewardEn: "“Shinyy” font style (a shining diamond)"
    },
    {
        // Progreso = más palabras escritas en una misma ventana de
        // 8 segundos (la marca se guarda aunque no llegues a 10)
        id: "speed",
        icon: "🏁",
        goal: 10,
        es: "Speedrunner",
        en: "Speedrunner",
        descEs: "Escribe 10 palabras en menos de 8 segundos, seguidas en la misma ventana de tiempo.",
        descEn: "Type 10 words in under 8 seconds in a row.",
        reward: { type: "bg", id: "carreras" },
        rewardEs: "Fondo de pantalla «Circuito» (coches a toda velocidad)",
        rewardEn: "“Race Track” background (cars at full speed)"
    },
    {
        // Progreso = mejor puntuación conseguida en una sola partida
        id: "hacker",
        icon: "💻",
        goal: 10000,
        es: "Hacker",
        en: "Hacker",
        descEs: "Consigue 10.000 puntos en una sola partida.",
        descEn: "Score 10,000 points in a single game.",
        reward: { type: "bg", id: "hacker" },
        rewardEs: "Fondo de pantalla «Hacker» (binario verde sobre negro)",
        rewardEn: "“Hacker” background (green binary on black)"
    }
];
