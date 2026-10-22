<script>
	import { engine } from './engine.svelte.js';
</script>

    <!-- Diccionario: todas las palabras que has escrito, agrupadas por la
         lista de la que salieron. Las secciones nuevas aparecen al
         desbloquear modos y fondos, y cada palabra nueva se cobra
         pulsándola (5 monedas, solo la primera vez) -->
    <section class="diccionario" id="diccionario" class:hidden={!engine.state.dicOpen}>
        <div class="shop-head">
            <h2>{engine.t('dicTitle')}</h2>
            <span class="shop-coins">📖 {engine.dicTotal}</span>
        </div>
        <p class="shop-hint">{engine.t('dicHint')}</p>
        {#if engine.dicPending > 0}
            <p class="shop-hint dic-pending">🎁 {engine.t('dicPendingTxt')} <strong>{engine.dicPending}</strong></p>
        {/if}
        {#if engine.state.dicMsgTxt}
            <p class="shop-hint dic-msg">{engine.state.dicMsgTxt}</p>
        {/if}
        {#if engine.dicTotal === 0}
            <p class="shop-hint dic-vacio">{engine.t('dicEmpty')}</p>
        {/if}
        {#each engine.dicSections as s (s.id)}
            <div class="dic-grupo">
                <div class="dic-grupo-head">
                    <strong>{s.icono} {s.nombre}</strong>
                    <span class="dic-grupo-num">{s.palabras.length} / {s.total}</span>
                </div>
                {#if s.palabras.length === 0}
                    <p class="shop-hint dic-vacio">{engine.t('dicGroupEmpty')}</p>
                {:else}
                    <div class="dic-words">
                        {#each s.palabras as p (p.w)}
                            {#if p.nueva}
                                <!-- Palabra nueva: al pulsarla se cobran sus 5 monedas -->
                                <button type="button" class="dic-word dic-new"
                                        onclick={() => engine.actions.dicClaim(s.id, p.w)}>{p.w}</button>
                            {:else}
                                <span class="dic-word">{p.w}</span>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </section>
