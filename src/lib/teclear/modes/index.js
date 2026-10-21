// Registro de modos: el motor despacha por S.mode y cada modo responde
// a los ganchos de GameMode. Los modos se crean una vez y reciben la
// interfaz del motor (DOM, palabras, reloj…) al arrancar.
import { SurvivalMode } from './survival.js';
import { AdventureMode } from './adventure.js';
import { GuessMode } from './guess.js';
import { ImageMode } from './image.js';
import { GameMode } from './mode.js';

// Tecleo es el modo por defecto: su entrada es la del motor (typeInput)
export const modes = {
    type: new GameMode(),
    guess: new GuessMode(),
    imagen: new ImageMode(),
    aventura: new AdventureMode(),
    supervivencia: new SurvivalMode()
};
