    <!-- Perfil: registro e inicio de sesión (guarda dinero, experiencia, récords…) -->
    <section class="perfil hidden" id="perfil">
        <div class="shop-head">
            <h2 id="accTitle">👤 Tu perfil</h2>
            <span class="shop-coins">🪙 <span id="accCoins">0</span></span>
        </div>
        <p class="shop-hint" id="accHint">Crea una cuenta con tu nombre y una contraseña para guardar tu dinero, tu experiencia y tus récords. Se guarda solo al terminar cada partida.</p>

        <!-- Rol del jugador: visible solo para el Administrador (Alvaro) -->
        <p class="shop-hint hidden" id="accRole">👑 Rol: Administrador · dinero infinito para probarlo todo</p>

        <form class="perfil-form hidden" id="accForm" novalidate>
            <div class="pf-field">
                <label for="accName" id="accNameLabel">Tu nombre</label>
                <input id="accName" type="text" maxlength="20" autocomplete="username"
                       placeholder="Anónimo" spellcheck="false">
            </div>
            <div class="pf-field">
                <label for="accPass" id="accPassLabel">Contraseña</label>
                <input id="accPass" type="password" maxlength="64" autocomplete="current-password"
                       placeholder="••••••">
            </div>
            <div class="pf-field hidden" id="accPass2Box">
                <label for="accPass2" id="accPass2Label">Repite la contraseña</label>
                <input id="accPass2" type="password" maxlength="64" autocomplete="new-password"
                       placeholder="••••••">
            </div>
            <div class="perfil-actions">
                <button type="submit" class="chip-btn" id="accSubmit">Crear perfil</button>
                <button type="button" class="chip-btn" id="accSwitch">🔑 Ya tengo cuenta</button>
                <button type="button" class="chip-btn" id="accClose">✖ Cerrar</button>
            </div>
        </form>

        <div class="perfil-data hidden" id="accData">
            <div class="perfil-who"><span class="perfil-avatar">👤</span><strong id="accWho">-</strong></div>
            <div class="perfil-grid">
                <div class="perfil-cell"><span id="accKCoins">Monedas</span><strong id="accVCoins">0</strong></div>
                <div class="perfil-cell"><span id="accKXp">Experiencia</span><strong id="accVXp">0</strong></div>
                <div class="perfil-cell"><span id="accKLevel">Nivel</span><strong id="accVLevel">1</strong></div>
                <div class="perfil-cell"><span id="accKGames">Partidas</span><strong id="accVGames">0</strong></div>
                <div class="perfil-cell"><span id="accKWords">Palabras escritas</span><strong id="accVWords">0</strong></div>
                <div class="perfil-cell"><span id="accKBest">Récord</span><strong id="accVBest">0</strong></div>
            </div>
            <div class="perfil-actions">
                <button type="button" class="chip-btn" id="accSave">💾 Guardar ahora</button>
                <button type="button" class="chip-btn" id="accOut">🚪 Cerrar sesión</button>
                <button type="button" class="chip-btn" id="accClose2">✖ Cerrar</button>
            </div>
        </div>

        <p class="shop-msg" id="accMsg"></p>
    </section>
