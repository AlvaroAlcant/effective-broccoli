<script>
	import { engine } from './engine.svelte.js';
</script>

    <!-- ===================== Menú principal =====================
         Ordenado de lo más importante a lo auxiliar:
         1· Modo de juego · 2· Idioma · 3· Progreso
         4· Controles · 5· Cuenta
         El fondo de pantalla se elige en el Inventario (y se desbloquea
         comprándolo en la tienda o ganándolo con un logro). -->
    <div class="selectors">
        <!-- 1 · Cómo se juega (con sus variantes al lado) -->
        <div class="sel-row">
            <span class="sel-label">{engine.t('modeLabel')}</span>
            <button class="chip-btn" class:active={engine.state.mode === 'type'}
                    onclick={() => engine.actions.setMode('type')}>{engine.t('btnType')}</button>
            <select id="modeSelect" name="mode" class="chip-select" aria-label={engine.t('modeSelectAria')}
                    value={engine.modeSel} disabled={engine.modeSelDis} title={engine.modeSelTitle}
                    onchange={e => engine.actions.chooseExtra(e.currentTarget.value)}>
                {#each engine.modeOptions as o (o.v)}
                    <option value={o.v}>{o.txt}</option>
                {/each}
            </select>
            <button class="chip-btn" class:active={engine.state.mode === 'guess'}
                    onclick={() => engine.actions.setMode('guess')}>{engine.t('btnGuess')}</button>
            <button class="chip-btn" class:active={engine.state.mode === 'imagen'}
                    onclick={() => engine.actions.setMode('imagen')}>{engine.t('btnImagen')}</button>
            <button class="chip-btn" class:active={engine.state.mode === 'aventura'}
                    onclick={() => engine.actions.setMode('aventura')}>{engine.t('btnAventura')}</button>
            <button class="chip-btn" class:active={engine.state.mode === 'supervivencia'}
                    onclick={() => engine.actions.setMode('supervivencia')}>{engine.t('btnSup')}</button>
            <!-- Variante de Supervivencia: Clásico / Encantado (solo en Halloween) -->
            <select id="supSelect" name="supVariant" class="chip-select" aria-label={engine.t('supVarHint')}
                    value={engine.state.supVariant} disabled={engine.supSelDis} title={engine.supSelTitle}
                    onchange={e => engine.actions.setSupVariant(e.currentTarget.value)}>
                {#each engine.supOptions as o (o.v)}
                    <option value={o.v}>{o.txt}</option>
                {/each}
            </select>
        </div>
        <!-- 2 · Idioma de la interfaz y de las palabras -->
        <div class="sel-row">
            <span class="sel-label">{engine.t('langLabel')}</span>
            <button class="chip-btn" class:active={engine.state.lang === 'es'}
                    onclick={() => engine.actions.setLang('es')}>🇪🇸 Español</button>
            <button class="chip-btn" class:active={engine.state.lang === 'en'}
                    onclick={() => engine.actions.setLang('en')}>🇬🇧 English</button>
            <button class="chip-btn" class:active={engine.state.lang === 'mur'}
                    onclick={() => engine.actions.setLang('mur')}>🗣️ Murciano</button>
        </div>
        <!-- 3 · Dónde mirar tu progreso y qué desbloquear -->
        <div class="sel-row sel-row-divider">
            <span class="sel-label">{engine.t('progLabel')}</span>
            <button class="chip-btn" class:active={engine.state.shopOpen}
                    onclick={() => engine.actions.toggleShop()}>{engine.t('btnShop')}</button>
            <button class="chip-btn" class:active={engine.state.invOpen}
                    onclick={() => engine.actions.toggleInv()}>{engine.t('btnInv')}</button>
            <button class="chip-btn" class:active={engine.state.rankOpen}
                    onclick={() => engine.actions.toggleRanking()}>{engine.t('btnRanking')}</button>
            <button class="chip-btn" class:active={engine.state.logrosOpen}
                    onclick={() => engine.actions.toggleLogros()}>{engine.t('btnLogros')}</button>
            <button class="chip-btn" class:active={engine.state.dicOpen}
                    onclick={() => engine.actions.toggleDic()}>{engine.t('btnDic')}</button>
        </div>
        <!-- 4 · Controles: la tecla reservada de la habilidad del fondo -->
        <div class="sel-row">
            <span class="sel-label">{engine.t('ctrlLabel')}</span>
            <button class="chip-btn" class:active={engine.state.bindingKey} type="button"
                    onclick={() => engine.actions.bindAbilityKey()}>{engine.ctrlKeyTxt}</button>
            <span class="sel-hint">{engine.t('ctrlHint')}</span>
        </div>
        <!-- 5 · Cuenta de jugador y herramientas del profe -->
        <div class="sel-row">
            <span class="sel-label">{engine.t('userLabel')}</span>
            <button class="chip-btn" class:active={engine.state.accOpen && !engine.state.accSession && engine.state.accMode === 'reg'}
                    onclick={() => engine.state.accSession ? engine.actions.toggleAccount() : engine.actions.toggleAccount('reg')}>{engine.btnRegTxt}</button>
            <button class="chip-btn" class:active={engine.state.accOpen && !engine.state.accSession && engine.state.accMode === 'login'}
                    class:hidden={!!engine.state.accSession}
                    onclick={() => engine.actions.toggleAccount('login')}>{engine.t('btnLogin')}</button>
            <button class="chip-btn" class:active={engine.state.veyon} aria-pressed={engine.state.veyon}
                    onclick={() => engine.actions.toggleVeyon()}>{engine.t('veyon')}</button>
        </div>
    </div>
