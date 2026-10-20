<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Perfil: registro e inicio de sesión (guarda dinero, experiencia, récords…) -->
    <section class="perfil" id="perfil" class:hidden={!G.accOpen}>
        <div class="shop-head">
            <h2 id="accTitle">{G.t('accTitle')}</h2>
            <span class="shop-coins">🪙 <span id="accCoins">{G.coinsTxt}</span></span>
        </div>
        <p class="shop-hint" id="accHint">{G.accHintTxt}</p>

        <!-- Rol del jugador: visible solo para el Administrador (Alvaro) -->
        <p class="shop-hint hidden" id="accRole">{G.t('accRole')}</p>

        <form class="perfil-form hidden" id="accForm" novalidate>
            <div class="pf-field">
                <label for="accName" id="accNameLabel">{G.t('accNameLabel')}</label>
                <input id="accName" type="text" maxlength="20" autocomplete="username"
                       placeholder="Anónimo" spellcheck="false">
            </div>
            <div class="pf-field">
                <label for="accPass" id="accPassLabel">{G.t('accPassLabel')}</label>
                <input id="accPass" type="password" maxlength="64" autocomplete="current-password"
                       placeholder="••••••">
            </div>
            <div class="pf-field hidden" id="accPass2Box">
                <label for="accPass2" id="accPass2Label">{G.t('accPass2Label')}</label>
                <input id="accPass2" type="password" maxlength="64" autocomplete="new-password"
                       placeholder="••••••">
            </div>
            <div class="perfil-actions">
                <button type="submit" class="chip-btn" id="accSubmit">Crear perfil</button>
                <button type="button" class="chip-btn" id="accSwitch">🔑 Ya tengo cuenta</button>
                <button type="button" class="chip-btn" id="accClose">{G.t('accClose')}</button>
            </div>
        </form>

        <div class="perfil-data hidden" id="accData">
            <div class="perfil-who"><span class="perfil-avatar">👤</span><strong id="accWho">-</strong></div>
            <div class="perfil-grid">
                <div class="perfil-cell"><span id="accKCoins">{G.t('kCoins')}</span><strong id="accVCoins">0</strong></div>
                <div class="perfil-cell"><span id="accKXp">{G.t('accXp')}</span><strong id="accVXp">0</strong></div>
                <div class="perfil-cell"><span id="accKLevel">{G.t('kLevel')}</span><strong id="accVLevel">1</strong></div>
                <div class="perfil-cell"><span id="accKGames">{G.t('accGames')}</span><strong id="accVGames">0</strong></div>
                <div class="perfil-cell"><span id="accKWords">{G.t('accWords')}</span><strong id="accVWords">0</strong></div>
                <div class="perfil-cell"><span id="accKBest">{G.t('kBest')}</span><strong id="accVBest">0</strong></div>
            </div>
            <div class="perfil-actions">
                <button type="button" class="chip-btn" id="accSave">{G.t('accSave')}</button>
                <button type="button" class="chip-btn" id="accOut">{G.t('accOut')}</button>
                <button type="button" class="chip-btn" id="accClose2">{G.t('accClose')}</button>
            </div>
        </div>

        <p class="shop-msg" id="accMsg"></p>
    </section>
