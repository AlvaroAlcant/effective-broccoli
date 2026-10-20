<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Inventario: todos los artículos comprados en la tienda y todos los
         ganados con logros, ORDENADO EN SECCIONES igual que la tienda.
         Aquí se SELECCIONA lo que se lleva puesto (la tienda solo compra):
         cada tarjeta lleva su botón «Usar» / «Apagar» / «✓ En uso». -->
    <section class="inventario" id="inventario" class:hidden={!G.invOpen}>
        <div class="shop-head">
            <h2>{G.t('invTitle')}</h2>
            <span class="shop-coins">🎒 {G.invCountTxt}</span>
        </div>
        <p class="shop-hint">{G.t('invHint')}</p>

        {#each G.invSections as sec (sec.key)}
            {#if sec.items.length > 0}
                <h3 class="shop-sub inv-sub" class:event-sub={sec.key === 'event'}>{sec.title}</h3>
                <div class="shop-grid inv-grid">
                    {#each sec.items as it (it.tipo + '-' + it.id)}
                        <div class="inv-card" class:in-use={it.enUso}>
                            <!-- Miniatura: la foto del fondo, la «Aa» del estilo o su arte -->
                            <div class="inv-thumb {it.cls || ''}"
                                 class:font-preview={it.tipo === 'font'}
                                 style:font-family={it.tipo === 'font' ? it.previewFont : null}
                                 style:background-image={it.tipo === 'bg' && it.img ? `url('${it.img}')` : null}>
                                {#if it.tipo === 'font'}Aa
                                {:else if it.art === 'flame'}<i class="flame-art" aria-hidden="true"></i>
                                {:else if !(it.tipo === 'bg' && it.img)}{it.icono}{/if}
                            </div>
                            <div class="inv-name">{it.nombre}</div>
                            <!-- De dónde salió: comprado en la tienda o ganado jugando -->
                            <div class="inv-src" class:src-ach={it.deLogro} class:src-shop={!it.deLogro}>
                                {it.deLogro ? G.t('invFromAch') : G.t('invFromShop')}
                            </div>
                            <!-- Aquí (y solo aquí) se elige qué se lleva puesto -->
                            {#if it.enUso && !it.apagar}
                                <button class="chip-btn shop-btn" disabled>{G.t('shopEquipped')}</button>
                            {:else if it.enUso}
                                <button class="chip-btn shop-btn" onclick={it.apagar}>{G.t('invOff')}</button>
                            {:else}
                                <button class="chip-btn shop-btn" onclick={it.usar}>{G.t('shopEquip')}</button>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        {/each}

        <p class="shop-msg">{G.invMsgTxt}</p>
        <p class="inv-empty" class:hidden={G.invSections.some(s => s.items.length > 0)}>{G.t('invEmpty')}</p>
    </section>
