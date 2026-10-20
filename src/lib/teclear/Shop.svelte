<script>
	import { G } from './game.svelte.js';

	const priceTxt = it => it.own ? '✓ ' + G.t('shopOwned')
		: (it.ach ? G.t('shopAchPrice') : '🪙 ' + it.price);
	const btnTxt = it => it.equipped || it.on ? G.t('shopEquipped')
		: it.own ? G.t('shopInInv')
		: it.ach ? G.t('achNeed') : G.t('shopBuy');
	const btnDis = it => !!(it.equipped || it.on || it.own || it.ach);
	const btnCant = it => !it.own && (it.ach || it.cant);
	const btnTitle = it => it.own && !it.equipped && !it.on ? G.t('shopInInvHint') : null;
</script>

    <section class="shop" id="shop" class:hidden={!G.shopOpen}>
        <div class="shop-head">
            <h2>{G.t('shopTitle')}</h2>
            <span class="shop-coins">🪙 {G.coinsTxt}</span>
        </div>
        <p class="shop-hint">{G.t('shopHint')}</p>

        <!-- Tienda de evento: arriba del todo mientras dura Halloween -->
        {#if G.halloween}
            <h3 class="shop-sub event-sub">{G.t('shopEventTitle')}</h3>
            <!-- Saldo de la moneda del evento: los artículos de arriba se pagan en caramelos -->
            <p class="shop-hint event-cash">{G.t('eventCashTxt')} <strong>{G.candyTxt}</strong></p>
            <div class="shop-grid event-grid">
                {#each G.shopEvents as it (it.id)}
                    <div class="shop-card event-card"
                         class:card-fx={it.kind === 'fx'}
                         class:card-truco={it.kind === 'extra'}
                         class:equipped={it.equipped}
                         class:fx-on={it.kind === 'fx' && it.on}
                         class:extra-on={it.kind === 'extra' && it.on}
                         class:card-fx-sangre={it.kind === 'fx' && it.id === 'sangre'}
                         style:--fx-c={it.kind === 'fx' ? it.color : null}>
                        {#if it.kind === 'bg'}
                            <div class="shop-preview event-thumb"
                                 style:background-image="url('{it.img}')"></div>
                        {:else}
                            <div class="shop-preview">{it.icon}</div>
                        {/if}
                        <div class="shop-name">{it.name}</div>
                        <div class="shop-price">{it.own ? '✓ ' + G.t('shopOwned') : '🍬 ' + it.price}</div>
                        <div class="shop-desc">{it.desc}</div>
                        <button class="chip-btn shop-btn" disabled={it.own}
                                class:cant={!it.own && it.cant}
                                title={it.own ? G.t('shopInInvHint') : null}
                                onclick={() => it.kind === 'bg' ? G.a.buyBg(it.id)
                                    : it.kind === 'fx' ? G.a.buyFx(it.id)
                                    : G.a.buyExtra(it.id)}>
                            {it.own ? G.t('shopInInv') : G.t('shopBuy')}
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <h3 class="shop-sub">{G.t('shopFontsTitle')}</h3>
        <div class="shop-grid">
            {#each G.shopFonts as st (st.id)}
                <div class="shop-card {st.cls}" class:equipped={st.equipped}>
                    <div class="shop-preview font-preview" style:font-family={st.font}>Aa</div>
                    <div class="shop-name">{st.name}</div>
                    <div class="shop-price">{priceTxt(st)}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(st)}
                            class:cant={btnCant(st)} title={btnTitle(st)}
                            onclick={() => G.a.buyStyle(st.id)}>{btnTxt(st)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{G.t('shopBgsTitle')}{G.mode === 'aventura' ? ' · ' + G.t('bgOffAventura') : ''}</h3>
        <div class="shop-grid">
            {#each G.shopBgs as b (b.id)}
                <div class="shop-card" class:equipped={b.equipped}>
                    {#if b.img}
                        <div class="shop-thumb" style:background-image="url('{b.img}')"></div>
                    {:else}
                        <div class="shop-thumb">{b.icon}</div>
                    {/if}
                    <div class="shop-name">{b.name}</div>
                    <div class="shop-price">{priceTxt(b)}</div>
                    <div class="shop-desc">{b.desc}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(b)}
                            class:cant={btnCant(b)} title={btnTitle(b)}
                            onclick={() => G.a.buyBg(b.id)}>{btnTxt(b)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{G.t('shopExtrasTitle')}</h3>
        <div class="shop-grid">
            {#each G.shopExtras as x (x.id)}
                <div class="shop-card card-{x.id}" class:extra-on={x.on}>
                    <div class="shop-preview extra">{x.icon}</div>
                    <div class="shop-name">{x.name}</div>
                    <div class="shop-price">{x.own ? '✓ ' + G.t('shopOwned') : '🪙 ' + x.price}</div>
                    <div class="shop-desc">{x.desc}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(x)}
                            class:cant={!x.own && x.cant} title={btnTitle(x)}
                            onclick={() => G.a.buyExtra(x.id)}>{btnTxt(x)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{G.t('shopFxTitle')}</h3>
        <div class="shop-grid">
            {#each G.shopFxs as f (f.id)}
                <div class="shop-card card-fx card-fx-{f.id}" class:fx-on={f.on}
                     style:--fx-c={f.color}>
                    <div class="shop-preview fx-preview">
                        {#if f.art === 'flame'}<i class="flame-art" aria-hidden="true"></i>{:else}{f.icon}{/if}
                    </div>
                    <div class="shop-name">{f.name}</div>
                    <div class="shop-price">{priceTxt(f)}</div>
                    <div class="shop-desc">{f.desc}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(f)}
                            class:cant={btnCant(f)} title={btnTitle(f)}
                            onclick={() => G.a.buyFx(f.id)}>{btnTxt(f)}</button>
                </div>
            {/each}
        </div>

        <p class="shop-msg">{G.shopMsgTxt}</p>
    </section>
