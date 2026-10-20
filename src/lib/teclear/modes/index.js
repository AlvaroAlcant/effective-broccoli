// Registro de modos: el motor despacha por S.mode y cada modo responde
// a los ganchos de GameMode. Los modos se crean una vez y reciben la
// interfaz del motor (DOM, palabras, reloj…) al arrancar.
import { SurvivalMode } from './survival.js';
import { GameMode } from './mode.js';

// Modo por defecto: no intercepta nada — Tecleo, Adivinar, Imágenes y
// Aventura todavía viven dentro del motor (siguiente fase del refactor)
export const modes = {
    type: new GameMode(),
    guess: new GameMode(),
    imagen: new GameMode(),
    aventura: new GameMode(),
    supervivencia: new SurvivalMode()
};
