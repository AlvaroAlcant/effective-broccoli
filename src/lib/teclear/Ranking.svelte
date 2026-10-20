<script>
	import { G } from './game.svelte.js';
</script>

    <section class="ranking" id="ranking" class:hidden={!G.rankOpen}>
        <div class="rank-tab" id="rankTabNormal">
            <h2 id="rankTitle">🏆 Ranking global</h2>
            <p class="rank-hint" id="rankHint">Las mejores puntuaciones de todos los jugadores (Top 10).</p>
            <ol class="rank-list" id="rankList"></ol>
            <p class="rank-empty" id="rankEmpty">Todavía no hay puntuaciones en el ranking. ¡Sé el primero! 🚀</p>
            <p class="rank-status" id="rankStatus"></p>
        </div>
        <div class="rank-tab" id="rankTabAventura">
            <h2 id="rankTitleAdv">🗺️ Ranking de Aventura</h2>
            <p class="rank-hint" id="rankHintAdv">Las mejores puntuaciones de la aventura: aquí solo cuenta el modo Aventura (Top 10).</p>
            <ol class="rank-list" id="rankListAdv"></ol>
            <p class="rank-empty" id="rankEmptyAdv">Todavía no hay puntuaciones en la aventura. ¡Sé el primero! 🚀</p>
            <p class="rank-status" id="rankStatusAdv"></p>
        </div>
    </section>
