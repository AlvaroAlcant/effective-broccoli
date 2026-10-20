<script>
	import { G } from './game.svelte.js';
</script>

    <section class="shop" id="shop" class:hidden={!G.shopOpen}>
        <div class="shop-head">
            <h2 id="shopTitle">{G.t('shopTitle')}</h2>
            <span class="shop-coins">🪙 <span id="shopCoins">{G.coinsTxt}</span></span>
        </div>
        <p class="shop-hint" id="shopHint">{G.t('shopHint')}</p>

        <!-- Tienda de evento: arriba del todo mientras dura Halloween -->
        <h3 class="shop-sub event-sub hidden" id="shopEventTitle">{G.t('shopEventTitle')}</h3>
        <!-- Saldo de la moneda del evento: los artículos de arriba se pagan en caramelos -->
        <p class="shop-hint event-cash hidden" id="eventCash"><span id="eventCashTxt">🍬 Tus caramelos:</span> <strong id="shopCandy">{G.candyTxt}</strong></p>
        <div class="shop-grid event-grid hidden" id="shopEventGrid"></div>

        <h3 class="shop-sub" id="shopFontsTitle">{G.t('shopFontsTitle')}</h3>
        <div class="shop-grid" id="shopGrid"></div>

        <h3 class="shop-sub" id="shopBgsTitle">{G.t('shopBgsTitle')}{G.mode === 'aventura' ? ' · ' + G.t('bgOffAventura') : ''}</h3>
        <div class="shop-grid" id="shopBgGrid"></div>

        <h3 class="shop-sub" id="shopExtrasTitle">{G.t('shopExtrasTitle')}</h3>
        <div class="shop-grid" id="shopExtraGrid"></div>

        <h3 class="shop-sub" id="shopFxTitle">{G.t('shopFxTitle')}</h3>
        <div class="shop-grid" id="shopFxGrid"></div>

        <p class="shop-msg" id="shopMsg"></p>
    </section>
