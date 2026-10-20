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
            <span class="sel-label">{G.t('modeLabel')}</span>
            <button class="chip-btn" class:active={G.mode === 'type'}
                    onclick={() => G.a.setMode('type')}>{G.t('btnType')}</button>
            <select id="modeSelect" name="mode" class="chip-select" aria-label={G.t('modeSelectAria')}
                    value={G.modeSel} disabled={G.modeSelDis} title={G.modeSelTitle}
                    onchange={e => G.a.chooseExtra(e.currentTarget.value)}>
                {#each G.modeOptions as o (o.v)}
                    <option value={o.v}>{o.txt}</option>
                {/each}
            </select>
            <button class="chip-btn" class:active={G.mode === 'guess'}
                    onclick={() => G.a.setMode('guess')}>{G.t('btnGuess')}</button>
            <button class="chip-btn" class:active={G.mode === 'imagen'}
                    onclick={() => G.a.setMode('imagen')}>{G.t('btnImagen')}</button>
            <button class="chip-btn" class:active={G.mode === 'aventura'}
                    onclick={() => G.a.setMode('aventura')}>{G.t('btnAventura')}</button>
            <button class="chip-btn" class:active={G.mode === 'supervivencia'}
                    onclick={() => G.a.setMode('supervivencia')}>{G.t('btnSup')}</button>
            <!-- Variante de Supervivencia: Clásico / Encantado (solo en Halloween) -->
            <select id="supSelect" name="supVariant" class="chip-select" aria-label={G.t('supVarHint')}
                    value={G.supVariant} disabled={G.supSelDis} title={G.supSelTitle}
                    onchange={e => G.a.setSupVariant(e.currentTarget.value)}>
                {#each G.supOptions as o (o.v)}
                    <option value={o.v}>{o.txt}</option>
                {/each}
            </select>
        </div>
        <!-- 2 · Idioma de la interfaz y de las palabras -->
        <div class="sel-row">
            <span class="sel-label">{G.t('langLabel')}</span>
            <button class="chip-btn" class:active={G.lang === 'es'}
                    onclick={() => G.a.setLang('es')}>🇪🇸 Español</button>
            <button class="chip-btn" class:active={G.lang === 'en'}
                    onclick={() => G.a.setLang('en')}>🇬🇧 English</button>
            <button class="chip-btn" class:active={G.lang === 'mur'}
                    onclick={() => G.a.setLang('mur')}>🗣️ Murciano</button>
        </div>
        <!-- 3 · Apariencia (los fondos comprados se añaden como chips extra) -->
        <div class="sel-row">
            <span class="sel-label">{G.t('bgLabel')}{sinFondos ? ' · ' + G.t('bgOffAventura') : ''}</span>
            <button class="chip-btn" disabled={sinFondos}
                    class:active={!sinFondos && G.bg === 'dark'}
                    onclick={() => G.a.setBg('dark')}>{G.t('bgDark')}</button>
            <button class="chip-btn" disabled={sinFondos}
                    class:active={!sinFondos && G.bg === 'franco'}
                    hidden={!hasFranco || G.francoHidden}
                    onclick={() => G.a.setBg('franco')}>🖼️ General</button>
            {#each G.bgChips as c (c.id)}
                <button class="chip-btn" class:active={!sinFondos && c.active}
                        disabled={sinFondos} hidden={c.hidden}
                        onclick={() => G.a.setBg(c.id)}>{c.label}</button>
            {/each}
        </div>
        <!-- 4 · Dónde mirar tu progreso y qué desbloquear -->
        <div class="sel-row sel-row-divider">
            <span class="sel-label">{G.t('progLabel')}</span>
            <button class="chip-btn" class:active={G.shopOpen}
                    onclick={() => G.a.toggleShop()}>{G.t('btnShop')}</button>
            <button class="chip-btn" class:active={G.invOpen}
                    onclick={() => G.a.toggleInv()}>{G.t('btnInv')}</button>
            <button class="chip-btn" class:active={G.rankOpen}
                    onclick={() => G.a.toggleRanking()}>{G.t('btnRanking')}</button>
            <button class="chip-btn" class:active={G.logrosOpen}
                    onclick={() => G.a.toggleLogros()}>{G.t('btnLogros')}</button>
        </div>
        <!-- 5 · Cuenta de jugador y herramientas del profe -->
        <div class="sel-row">
            <span class="sel-label">{G.t('userLabel')}</span>
            <button class="chip-btn" class:active={G.accOpen && !G.accSession && G.accMode === 'reg'}
                    onclick={() => G.accSession ? G.a.toggleAccount() : G.a.toggleAccount('reg')}>{G.btnRegTxt}</button>
            <button class="chip-btn" class:active={G.accOpen && !G.accSession && G.accMode === 'login'}
                    class:hidden={!!G.accSession}
                    onclick={() => G.a.toggleAccount('login')}>{G.t('btnLogin')}</button>
            <button class="chip-btn" class:active={G.veyon} aria-pressed={G.veyon}
                    onclick={() => G.a.toggleVeyon()}>{G.t('veyon')}</button>
        </div>
    </div>
