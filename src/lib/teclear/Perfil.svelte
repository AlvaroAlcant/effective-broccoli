<script>
	import { engine } from './engine.svelte.js';
</script>

    <!-- Perfil: registro e inicio de sesión (guarda dinero, experiencia, récords…) -->
    <section class="perfil" id="perfil" class:hidden={!engine.state.accOpen}>
        <div class="shop-head">
            <h2>{engine.t('accTitle')}</h2>
            <span class="shop-coins">🪙 {engine.coinsTxt}</span>
        </div>
        <p class="shop-hint">{engine.accHintTxt}</p>

        <!-- Rol del jugador: visible solo para el Administrador (Alvaro) -->
        <p class="shop-hint" class:hidden={!engine.esAdmin}>{engine.t('accRole')}</p>

        {#if !engine.state.accSession}
            <form class="perfil-form" novalidate
                  onsubmit={e => { e.preventDefault(); engine.actions.submitAccount(); }}>
                <div class="pf-field">
                    <label for="accName">{engine.t('accNameLabel')}</label>
                    <input id="accName" type="text" maxlength="20" autocomplete="username"
                           placeholder="Anónimo" spellcheck="false">
                </div>
                <div class="pf-field">
                    <label for="accPass">{engine.t('accPassLabel')}</label>
                    <input id="accPass" type="password" maxlength="64" autocomplete="current-password"
                           placeholder="••••••">
                </div>
                <div class="pf-field" class:hidden={engine.state.accMode !== 'reg'}>
                    <label for="accPass2">{engine.t('accPass2Label')}</label>
                    <input id="accPass2" type="password" maxlength="64" autocomplete="new-password"
                           placeholder="••••••">
                </div>
                <div class="perfil-actions">
                    <button type="submit" class="chip-btn" disabled={engine.state.accBusy}>{engine.accSubmitTxt}</button>
                    <button type="button" class="chip-btn" onclick={() => engine.actions.accSwitchMode()}>{engine.accSwitchTxt}</button>
                    <button type="button" class="chip-btn" onclick={() => engine.actions.closeAccount()}>{engine.t('accClose')}</button>
                </div>
            </form>
        {:else}
            <div class="perfil-data">
                <div class="perfil-who"><span class="perfil-avatar">👤</span><strong>{engine.accWhoTxt}</strong></div>
                <div class="perfil-grid">
                    <div class="perfil-cell"><span>{engine.t('kCoins')}</span><strong>{engine.coinsTxt}</strong></div>
                    <div class="perfil-cell"><span>{engine.t('accXp')}</span><strong>{engine.state.xp}</strong></div>
                    <div class="perfil-cell"><span>{engine.t('kLevel')}</span><strong>{engine.level()}</strong></div>
                    <div class="perfil-cell"><span>{engine.t('accGames')}</span><strong>{engine.state.gamesPlayed}</strong></div>
                    <div class="perfil-cell"><span>{engine.t('accWords')}</span><strong>{engine.state.wordsTotal}</strong></div>
                    <div class="perfil-cell"><span>{engine.t('kBest')}</span><strong>{engine.state.best}</strong></div>
                </div>
                <div class="perfil-actions">
                    <button type="button" class="chip-btn" onclick={() => engine.actions.accSave()}>{engine.t('accSave')}</button>
                    <button type="button" class="chip-btn" onclick={() => engine.actions.accOut()}>{engine.t('accOut')}</button>
                    <button type="button" class="chip-btn" onclick={() => engine.actions.closeAccount()}>{engine.t('accClose')}</button>
                </div>
            </div>
        {/if}

        <p class="shop-msg" class:warn={engine.state.accMsgWarn}>{engine.state.accMsgTxt}</p>
    </section>
