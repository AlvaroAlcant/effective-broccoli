<script>
	import { engine } from './engine.svelte.js';

	// Colección de ventajas de aventura (agrupadas por rareza) y cuántas
	// llevas de todas las que hay
	const coleccion = $derived(engine.dicPerks);
	const perksHave = $derived(coleccion.reduce((n, r) => n + r.perks.filter(p => p.tenida).length, 0));
	const perksAll = $derived(coleccion.reduce((n, r) => n + r.perks.length, 0));
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

        <!-- Ventajas de aventura: colección por rareza. No dan dinero ni
             recompensa, sirven para ver las que hay y coleccionarlas todas -->
        <div class="dic-grupo">
            <div class="dic-grupo-head">
                <strong>🎁 {engine.t('dicPerksTitle')}</strong>
                <span class="dic-grupo-num">{perksHave} / {perksAll}</span>
            </div>
            <p class="shop-hint">{engine.t('dicPerksHint')}</p>
            {#each coleccion as r (r.id)}
                <div class="dic-rar">
                    <span class="dic-rar-label dic-rar-{r.clase}">{r.nombre}</span>
                    <div class="dic-words">
                        {#each r.perks as p (p.id)}
                            <!-- La ventaja ya elegida recupera el color de su rareza;
                                 la que falta queda apagada -->
                            <span class="dic-perk {p.tenida ? 'tenida dic-rar-' + r.clase : 'falta'}"
                                  title={p.desc}>{p.icon} {p.nombre}</span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </section>
