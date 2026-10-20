<script>
	import { G } from './game.svelte.js';
	let { logo } = $props();
</script>

    <header>
        <div class="logo-wrap">
            <button type="button" class="logo-btn" id="logoBtn"
                    aria-label="Toca el logo y saldrá una frase distinta">
                <img class="game-logo" src={logo} alt="Logo de Teclear">
            </button>
            <span class="logo-phrase" id="logoPhrase" aria-live="polite"></span>
        </div>
        <h1 id="title">{G.t('title')}</h1>
        <p id="subtitle">{G.subtitle}</p>
        <!-- Evento de Halloween: barra con la cuenta atrás hasta el final del evento -->
        <p class="event-bar hidden" id="eventBar">
            🎃 <span id="eventText">Evento de Halloween: la tienda de evento está abierta hasta el 3 de noviembre a las 12:00</span>
            <strong id="eventCount"></strong>
        </p>
    </header>
