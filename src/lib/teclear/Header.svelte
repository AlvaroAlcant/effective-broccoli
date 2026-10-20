<script>
	import { G } from './game.svelte.js';
	let { logo } = $props();
</script>

    <header>
        <div class="logo-wrap">
            <button type="button" class="logo-btn" id="logoBtn"
                    aria-label="Toca el logo y saldrá una frase distinta"
                    onclick={() => G.a.showLogoPhrase()}>
                <img class="game-logo" src={logo} alt="Logo de Teclear">
            </button>
            <span class="logo-phrase" class:show={G.logoShow} aria-live="polite">{G.logoPhraseTxt}</span>
        </div>
        <h1 id="title">{G.t('title')}</h1>
        <p id="subtitle">{G.subtitle}</p>
        <!-- Evento de Halloween: barra con la cuenta atrás hasta el final del evento -->
        <p class="event-bar" class:hidden={!G.halloween}>
            🎃 <span>{G.t('eventBar')}</span>
            <strong>{G.eventCountTxt}</strong>
        </p>
    </header>
