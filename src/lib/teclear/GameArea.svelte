<script>
	import { G } from './game.svelte.js';
</script>

    <div class="stage" id="stage">
        <div class="board" id="board">
            <em class="hint">Pulsa "Jugar" o la barra espaciadora para empezar</em>
        </div>
    </div>

    <div class="misses is-off" id="misses"></div>

    <!-- Modo Aventura: efectos activos de las ventajas elegidas -->
    <div class="adv-bar is-off" id="advBar"></div>

    <!-- Modo Aventura: elección de ventaja (mientras tanto el reloj no corre) -->
    <div class="perk-veil hidden" id="perkVeil">
        <div class="perk-box" role="dialog" aria-modal="true" aria-labelledby="perkTitle">
            <h2 id="perkTitle">🎁 ¡Elige tu ventaja!</h2>
            <p class="perk-hint" id="perkHint">Has llegado a una parada de la aventura: el cronómetro queda en pausa mientras eliges.</p>
            <div class="perk-grid" id="perkGrid"></div>
        </div>
    </div>

    <div class="controls">
        <input id="typing" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
               placeholder={G.t('placeholder')} disabled>

        <p id="status">Modo relájado: sin presión, teclea a tu ritma… ¡hasta que empiezas!</p>

        <button class="main-btn" id="startBtn">Jugar</button>
    </div>

    <div class="results hidden" id="results">
        <h2 id="rTitle">¡Tiempo agotado! ⏱️</h2>
        <ul>
            <li><span id="rkScore">Puntos</span><strong id="rScore">0</strong></li>
            <li><span id="rkWords">Palabras</span><strong id="rWords">0</strong></li>
            <li><span id="rkAcc">Precisión</span><strong id="rAcc">0%</strong></li>
            <li><span id="rkPpm">Palabras/min</span><strong id="rPpm">0</strong></li>
            <li><span id="rkCoins">Monedas</span><strong id="rCoins">0</strong></li>
            <li class="hidden" id="rCandyRow"><span id="rkCandy">Caramelos</span><strong id="rCandy">0</strong></li>
            <li><span id="rkXp">Experiencia</span><strong id="rXp">0</strong></li>
            <li><span id="rkBestWords">Récord palabras</span><strong id="rBestWords">0</strong></li>
        </ul>
        <p id="rMsg"></p>

        <div class="rank-form hidden" id="rankForm">
            <p class="rank-who" id="rankWho">Se guardará con tu perfil</p>
            <div class="verify-row">
                <label for="verifyInput" id="verifyLabel">Comprueba que eres una persona: teclea</label>
                <span class="verify-code" id="verifyCode" aria-hidden="true">----</span>
                <input id="verifyInput" type="text" maxlength="8" autocomplete="off"
                       spellcheck="false" autocapitalize="characters" placeholder="código">
            </div>
            <button class="chip-btn" id="saveScoreBtn">🏆 Guardar puntuación</button>
        </div>
        <p class="rank-saved" id="rankSaved"></p>
    </div>
