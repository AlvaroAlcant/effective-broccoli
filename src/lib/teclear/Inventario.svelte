<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Inventario: todos los artículos comprados en la tienda y todos los
         ganados con logros, ORDENADO EN SECCIONES igual que la tienda.
         Aquí se SELECCIONA lo que se lleva puesto (la tienda solo compra):
         cada tarjeta lleva su botón «Usar» / «Apagar» / «✓ En uso». -->
    <section class="inventario" id="inventario" class:hidden={!G.invOpen}>
        <div class="shop-head">
            <h2 id="invTitle">{G.t('invTitle')}</h2>
            <span class="shop-coins">🎒 <span id="invCount">{G.invCountTxt}</span></span>
        </div>
        <p class="shop-hint" id="invHint">{G.t('invHint')}</p>

        <!-- Artículos del EVENTO de Halloween: su propia sección mientras
             dura el evento (igual que en la tienda) -->
        <h3 class="shop-sub inv-sub event-sub hidden" id="invEventTitle">{G.t('invEventTitle')}</h3>
        <div class="shop-grid inv-grid hidden" id="invEventGrid"></div>

        <h3 class="shop-sub inv-sub" id="invFontsTitle">{G.t('invFontsTitle')}</h3>
        <div class="shop-grid inv-grid" id="invFontGrid"></div>

        <h3 class="shop-sub inv-sub" id="invBgsTitle">{G.t('invBgsTitle')}</h3>
        <div class="shop-grid inv-grid" id="invBgGrid"></div>

        <h3 class="shop-sub inv-sub" id="invExtrasTitle">{G.t('invExtrasTitle')}</h3>
        <div class="shop-grid inv-grid" id="invExtraGrid"></div>

        <h3 class="shop-sub inv-sub" id="invFxTitle">{G.t('invFxTitle')}</h3>
        <div class="shop-grid inv-grid" id="invFxGrid"></div>

        <p class="shop-msg" id="invMsg"></p>
        <p class="inv-empty hidden" id="invEmpty">{G.t('invEmpty')}</p>
    </section>
