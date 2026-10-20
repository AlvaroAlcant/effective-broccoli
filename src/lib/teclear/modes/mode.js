// Base de los modos de juego. El motor llama a los mismos ganchos en
// cada modo: enter/exit en los bordes de la partida, tick en cada
// pulso del reloj, input cuando llega texto y keydown para las teclas
// propias del modo. Lo que un modo no sobreescribe no hace nada.
export class GameMode {
    id = "base";
    // Referencia al motor (se inyecta al registrar el modo): permite a
    // los modos pedir palabras, cerrar partidas o tocar el contador de
    // aciertos/fallos sin conocer los entresijos del engine.
    engine = null;

    // Al empezar la partida: reinicia lo suyo
    enter() {}
    // Al terminar: limpia lo suyo
    exit() {}

    // Pulso del reloj (cada ~100 ms). Devuelve true cuando el modo se ha
    // ocupado del pulso por completo (reloj, tablero…) y el motor no
    // debe seguir con su cuenta atrás normal.
    tick(now, dt) { return false; }

    // Texto nuevo en el campo de escritura: por defecto lo procesa el
    // motor con su lógica de Tecleo (la comparten Tecleo, Imágenes,
    // Adivinar en parte y Aventura); los modos con entrada propia la
    // sobreescriben
    input() { this.engine.typeInput(); }

    // Teclas propias del modo (Tab para cambiar de objetivo…)
    keydown(e) {}

    // Toca sacar palabra (o lo que el modo ponga en el tablero)
    onNewWord() {}

    // Palabra completada: el modo puede reaccionar (paradas de ventaja…)
    onWordComplete() {}

    // Datos del tablero para la vista (null = el motor usa el suyo)
    boardView() { return null; }

    // Nivel de dificultad del modo (null = fórmula estándar)
    level() { return null; }

    // Cronómetro con el que arranca la partida (null = el de siempre)
    timerStart() { return null; }
}
