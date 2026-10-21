// Modo Imágenes: se teclea la palabra que nombra el emoji de la
// imagen (Twemoji; si no carga, se muestra el emoji tal cual).
// La entrada es la misma que en Tecleo (la del motor por defecto).
import { S } from '../state.svelte.js';
import { uiLang } from '../services/i18n.js';
import { IMAGENES, emojiSrc } from '../data/images.js';
import { GameMode } from './mode.js';

export class ImageMode extends GameMode {
    id = "imagen";

    // Palabra que nombra la imagen, según el idioma elegido
    imageWord(im) {
        return uiLang() === "en" ? im.en : im.es;
    }

    // Elige una imagen cuya palabra encaje con el nivel actual
    pickWord() {
        const lvl = this.engine.level();
        const cabe = w => {
            if (lvl <= 1) return w.length <= 5;
            if (lvl <= 3) return w.length <= 7;
            if (lvl <= 6) return w.length >= 5;
            return w.length >= 6;
        };
        let pool = IMAGENES.filter(im => cabe(this.imageWord(im)));
        if (pool.length === 0) pool = IMAGENES;

        let im;
        do {
            im = pool[Math.floor(Math.random() * pool.length)];
        } while (im === S.currentImg && pool.length > 1);
        S.currentImg = im;
        S.picErr = false;   // imagen nueva: de momento se confía en que cargue
        return this.imageWord(im);
    }

    // ---------- Vista ----------
    boardView() {
        return { kind: "img", em: S.currentImg ? S.currentImg.em : "🖼️",
                 src: S.currentImg ? emojiSrc(S.currentImg.em) : "" };
    }
}
