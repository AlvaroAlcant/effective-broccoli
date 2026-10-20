<script>
	import { engine } from './engine.svelte.js';
	let { logo } = $props();
</script>

    <header>
        <div class="logo-wrap">
            <button type="button" class="logo-btn" id="logoBtn"
                    aria-label="Toca el logo y saldrá una frase distinta"
                    onclick={() => engine.actions.showLogoPhrase()}>
                <img class="game-logo" src={logo} alt="Logo de Teclear">
            </button>
            <span class="logo-phrase" class:show={engine.state.logoShow} aria-live="polite">{engine.state.logoPhraseTxt}</span>
        </div>
        <h1 id="title">{engine.t('title')}</h1>
        <p id="subtitle">{engine.subtitle}</p>
        <!-- Evento de Halloween: barra con la cuenta atrás hasta el final del evento -->
        <p class="event-bar" class:hidden={!engine.state.halloween}>
            🎃 <span>{engine.t('eventBar')}</span>
            <strong>{engine.state.eventCountTxt}</strong>
        </p>
    </header>
