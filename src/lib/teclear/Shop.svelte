<script>
	import { engine } from './engine.svelte.js';

	const priceTxt = it => it.own ? '✓ ' + engine.t('shopOwned')
		: (it.ach ? engine.t('shopAchPrice') : '🪙 ' + it.price);
	const btnTxt = it => it.equipped || it.on ? engine.t('shopEquipped')
		: it.own ? engine.t('shopInInv')
		: it.ach ? engine.t('achNeed') : engine.t('shopBuy');
	const btnDis = it => !!(it.equipped || it.on || it.own || it.ach);
	const btnCant = it => !it.own && (it.ach || it.cant);
	const btnTitle = it => it.own && !it.equipped && !it.on ? engine.t('shopInInvHint') : null;
</script>

    <section class="shop" id="shop" class:hidden={!engine.state.shopOpen}>
        <div class="shop-head">
            <h2>{engine.t('shopTitle')}</h2>
            <span class="shop-coins">🪙 {engine.coinsTxt}</span>
        </div>
        <p class="shop-hint">{engine.t('shopHint')}</p>

        <!-- Tienda de evento: arriba del todo mientras dura Halloween -->
        {#if engine.state.halloween}
            <h3 class="shop-sub event-sub">{engine.t('shopEventTitle')}</h3>
            <!-- Saldo de la moneda del evento: los artículos de arriba se pagan en caramelos -->
            <p class="shop-hint event-cash">{engine.t('eventCashTxt')} <strong>{engine.candyTxt}</strong></p>
            <div class="shop-grid event-grid">
                {#each engine.shopEvents as it (it.id)}
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
                        <div class="shop-price">{it.own ? '✓ ' + engine.t('shopOwned') : '🍬 ' + it.price}</div>
                        <div class="shop-desc">{it.desc}</div>
                        <button class="chip-btn shop-btn" disabled={it.own}
                                class:cant={!it.own && it.cant}
                                title={it.own ? engine.t('shopInInvHint') : null}
                                onclick={() => engine.actions.buyItem(it.kind, it.id)}>
                            {it.own ? engine.t('shopInInv') : engine.t('shopBuy')}
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <h3 class="shop-sub">{engine.t('shopFontsTitle')}</h3>
        <div class="shop-grid">
            {#each engine.shopFonts as st (st.id)}
                <div class="shop-card {st.cls}" class:equipped={st.equipped}>
                    <div class="shop-preview font-preview" style:font-family={st.font}>Aa</div>
                    <div class="shop-name">{st.name}</div>
                    <div class="shop-price">{priceTxt(st)}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(st)}
                            class:cant={btnCant(st)} title={btnTitle(st)}
                            onclick={() => engine.actions.buyItem('font', st.id)}>{btnTxt(st)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{engine.t('shopBgsTitle')}{engine.state.mode === 'aventura' ? ' · ' + engine.t('bgOffAventura') : ''}</h3>
        <div class="shop-grid">
            {#each engine.shopBgs as b (b.id)}
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
                            onclick={() => engine.actions.buyItem('bg', b.id)}>{btnTxt(b)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{engine.t('shopExtrasTitle')}</h3>
        <div class="shop-grid">
            {#each engine.shopExtras as x (x.id)}
                <div class="shop-card card-{x.id}" class:extra-on={x.on}>
                    <div class="shop-preview extra">{x.icon}</div>
                    <div class="shop-name">{x.name}</div>
                    <div class="shop-price">{x.own ? '✓ ' + engine.t('shopOwned') : '🪙 ' + x.price}</div>
                    <div class="shop-desc">{x.desc}</div>
                    <button class="chip-btn shop-btn" disabled={btnDis(x)}
                            class:cant={!x.own && x.cant} title={btnTitle(x)}
                            onclick={() => engine.actions.buyItem('extra', x.id)}>{btnTxt(x)}</button>
                </div>
            {/each}
        </div>

        <h3 class="shop-sub">{engine.t('shopFxTitle')}</h3>
        <div class="shop-grid">
            {#each engine.shopFxs as f (f.id)}
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
                            onclick={() => engine.actions.buyItem('fx', f.id)}>{btnTxt(f)}</button>
                </div>
            {/each}
        </div>

        <p class="shop-msg">{engine.state.shopMsgTxt}</p>
    </section>
