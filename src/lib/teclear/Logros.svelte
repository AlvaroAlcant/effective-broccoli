<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Logros: retos que al completarse desbloquean una recompensa -->
    <section class="logros" id="logros" class:hidden={!G.logrosOpen}>
        <div class="shop-head">
            <h2 id="achTitle">{G.t('achTitle')}</h2>
            <span class="shop-coins">🏅 <span id="achCount">{G.achCountTxt}</span></span>
        </div>
        <p class="shop-hint" id="achHint">{G.t('achHint')}</p>
        <div class="ach-grid" id="achGrid"></div>
    </section>
