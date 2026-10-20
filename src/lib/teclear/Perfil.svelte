<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Perfil: registro e inicio de sesión (guarda dinero, experiencia, récords…) -->
    <section class="perfil" id="perfil" class:hidden={!G.accOpen}>
        <div class="shop-head">
            <h2>{G.t('accTitle')}</h2>
            <span class="shop-coins">🪙 {G.coinsTxt}</span>
        </div>
        <p class="shop-hint">{G.accHintTxt}</p>

        <!-- Rol del jugador: visible solo para el Administrador (Alvaro) -->
        <p class="shop-hint" class:hidden={!G.esAdmin}>{G.t('accRole')}</p>

        {#if !G.accSession}
            <form class="perfil-form" novalidate
                  onsubmit={e => { e.preventDefault(); G.a.submitAccount(); }}>
                <div class="pf-field">
                    <label for="accName">{G.t('accNameLabel')}</label>
                    <input id="accName" type="text" maxlength="20" autocomplete="username"
                           placeholder="Anónimo" spellcheck="false">
                </div>
                <div class="pf-field">
                    <label for="accPass">{G.t('accPassLabel')}</label>
                    <input id="accPass" type="password" maxlength="64" autocomplete="current-password"
                           placeholder="••••••">
                </div>
                <div class="pf-field" class:hidden={G.accMode !== 'reg'}>
                    <label for="accPass2">{G.t('accPass2Label')}</label>
                    <input id="accPass2" type="password" maxlength="64" autocomplete="new-password"
                           placeholder="••••••">
                </div>
                <div class="perfil-actions">
                    <button type="submit" class="chip-btn" disabled={G.accBusy}>{G.accSubmitTxt}</button>
                    <button type="button" class="chip-btn" onclick={() => G.a.accSwitchMode()}>{G.accSwitchTxt}</button>
                    <button type="button" class="chip-btn" onclick={() => G.a.closeAccount()}>{G.t('accClose')}</button>
                </div>
            </form>
        {:else}
            <div class="perfil-data">
                <div class="perfil-who"><span class="perfil-avatar">👤</span><strong>{G.accWhoTxt}</strong></div>
                <div class="perfil-grid">
                    <div class="perfil-cell"><span>{G.t('kCoins')}</span><strong>{G.coinsTxt}</strong></div>
                    <div class="perfil-cell"><span>{G.t('accXp')}</span><strong>{G.xp}</strong></div>
                    <div class="perfil-cell"><span>{G.t('kLevel')}</span><strong>{G.level}</strong></div>
                    <div class="perfil-cell"><span>{G.t('accGames')}</span><strong>{G.gamesPlayed}</strong></div>
                    <div class="perfil-cell"><span>{G.t('accWords')}</span><strong>{G.wordsTotal}</strong></div>
                    <div class="perfil-cell"><span>{G.t('kBest')}</span><strong>{G.best}</strong></div>
                </div>
                <div class="perfil-actions">
                    <button type="button" class="chip-btn" onclick={() => G.a.accSave()}>{G.t('accSave')}</button>
                    <button type="button" class="chip-btn" onclick={() => G.a.accOut()}>{G.t('accOut')}</button>
                    <button type="button" class="chip-btn" onclick={() => G.a.closeAccount()}>{G.t('accClose')}</button>
                </div>
            </div>
        {/if}

        <p class="shop-msg" class:warn={G.accMsgWarn}>{G.accMsgTxt}</p>
    </section>
