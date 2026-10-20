<script>
	import { G } from './game.svelte.js';
	const sinFondos = $derived(G.mode === 'aventura');
	const hasFranco = $derived(G.ownedBgs.includes('franco'));
</script>

    <!-- ===================== Menú principal =====================
         Ordenado de lo más importante a lo auxiliar:
         1· Modo de juego · 2· Idioma · 3· Fondo · 4· Progreso · 5· Cuenta -->
    <div class="selectors">
        <!-- 1 · Cómo se juega (con sus variantes al lado) -->
        <div class="sel-row">
            <span class="sel-label" id="modeLabel">{G.t('modeLabel')}</span>
            <button class="chip-btn" id="btnType" class:active={G.mode === 'type'}>{G.t('btnType')}</button>
            <select id="modeSelect" class="chip-select" aria-label="Variante del modo Tecleo"></select>
            <button class="chip-btn" id="btnGuess" class:active={G.mode === 'guess'}>{G.t('btnGuess')}</button>
            <button class="chip-btn" id="btnImagen" class:active={G.mode === 'imagen'}>{G.t('btnImagen')}</button>
            <button class="chip-btn" id="btnAventura" class:active={G.mode === 'aventura'}>{G.t('btnAventura')}</button>
            <button class="chip-btn" id="btnSup" class:active={G.mode === 'supervivencia'}>{G.t('btnSup')}</button>
            <!-- Variante de Supervivencia: Clásico / Encantado (solo en Halloween) -->
            <select id="supSelect" class="chip-select" aria-label="Variante de Supervivencia"></select>
        </div>
        <!-- 2 · Idioma de la interfaz y de las palabras -->
        <div class="sel-row">
            <span class="sel-label" id="langLabel">{G.t('langLabel')}</span>
            <button class="chip-btn" id="btnEs" class:active={G.lang === 'es'}>🇪🇸 Español</button>
            <button class="chip-btn" id="btnEn" class:active={G.lang === 'en'}>🇬🇧 English</button>
            <button class="chip-btn" id="btnMurciano" class:active={G.lang === 'mur'}>🗣️ Murciano</button>
        </div>
        <!-- 3 · Apariencia (los fondos comprados se añaden en #bgExtra) -->
        <div class="sel-row">
            <span class="sel-label" id="bgLabel">{G.t('bgLabel')}{sinFondos ? ' · ' + G.t('bgOffAventura') : ''}</span>
            <button class="chip-btn" id="btnBgDark" disabled={sinFondos} class:active={!sinFondos && G.bg === 'dark'}>{G.t('bgDark')}</button>
            <button class="chip-btn" id="btnBgFranco" disabled={sinFondos} class:active={!sinFondos && G.bg === 'franco'} style:display={hasFranco ? '' : 'none'}>🖼️ General</button>
            <span id="bgExtra"></span>
        </div>
        <!-- 4 · Dónde mirar tu progreso y qué desbloquear -->
        <div class="sel-row sel-row-divider">
            <span class="sel-label" id="progLabel">{G.t('progLabel')}</span>
            <button class="chip-btn" id="btnShop" class:active={G.shopOpen}>{G.t('btnShop')}</button>
            <button class="chip-btn" id="btnInv" class:active={G.invOpen}>{G.t('btnInv')}</button>
            <button class="chip-btn" id="btnRanking" class:active={G.rankOpen}>{G.t('btnRanking')}</button>
            <button class="chip-btn" id="btnLogros" class:active={G.logrosOpen}>{G.t('btnLogros')}</button>
        </div>
        <!-- 5 · Cuenta de jugador y herramientas del profe -->
        <div class="sel-row">
            <span class="sel-label" id="userLabel">{G.t('userLabel')}</span>
            <button class="chip-btn" id="btnRegister" class:active={G.accOpen && !G.accSession && G.accMode === 'reg'}>{G.btnRegTxt}</button>
            <button class="chip-btn" id="btnLogin" class:active={G.accOpen && !G.accSession && G.accMode === 'login'} class:hidden={!!G.accSession}>{G.t('btnLogin')}</button>
            <button class="chip-btn" id="btnVeyon" class:active={G.veyon} aria-pressed={G.veyon}>{G.t('veyon')}</button>
        </div>
    </div>
