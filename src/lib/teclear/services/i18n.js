// Textos de la interfaz: traducción de claves según el idioma activo.
// El murciano es un dialecto: los textos, récords y fechas se guardan
// igual que en español, pero las palabras salen del diccionario murciano.
import { S } from '../state.svelte.js';
import { I18N } from '../data/i18n.js';

export const uiLang = () => (S.lang === "mur" ? "es" : S.lang);

export const t = k => I18N[uiLang()][k];
