<script>
	import { engine } from './engine.svelte.js';
	const bv = $derived(engine.boardView);
	const mv = $derived(engine.missesView);
	const res = $derived(engine.state.res);
	const supTop = it => `calc(${it.y * 100}% - ${it.y * 4}px)`;
	const supTf = it => `translateY(${-it.y * 100}%)`;
	const supDanger = it => (1 - it.y) * it.span <= 4;
	const blastDelay = (bv, it) =>
		((it.typed - 1 - (it.shotFrom || 0)) * bv.shotGap + bv.shotMs) + 'ms';
	// Nombre traducido de la rareza de una ventaja: "comun" → "rarComun"
	const rarTxt = r => engine.t('rar' + (r ? r[0].toUpperCase() + r.slice(1) : 'Comun'));
</script>

    <div class="stage" id="stage">
        <div class="board" id="board">
            {#if bv.kind === 'sup'}
                {#each bv.items as it (it.n)}
                    <!-- svelte-ignore a11y_no_static_element_interactions
                         (el foco no puede salir del input: con Tab se apunta igual) -->
                    <div class="sup-word" data-n={it.n}
                         class:target={bv.targetN === it.n}
                         class:ghost={bv.enc}
                         class:fresh={it.fresh}
                         class:danger={supDanger(it)}
                         role="button" tabindex="-1"
                         style:left={it.lane}
                         style:top={supTop(it)}
                         style:transform={supTf(it)}
                         onmousedown={e => e.preventDefault()}
                         onclick={() => engine.actions.supAim(it.n)}>
                        <div class="sup-letters">
                            {#each it.w.split('') as ch, i}
                                <span class:shot={i < it.typed}
                                      class:blast={i === it.typed - 1 && it.typed > 0}
                                      class:cursor={i === it.typed}
                                      style:animation-delay={i === it.typed - 1 && it.typed > 0
                                          ? blastDelay(bv, it) : null}>{ch}</span>
                            {/each}
                        </div>
                        <div class="sup-bar"><i class="sup-fill" class:low={supDanger(it)}
                            style:width={Math.max(0, (1 - it.y) * 100) + '%'}></i></div>
                    </div>
                {/each}
            {:else if bv.kind === 'img'}
                <div class="pic">
                    {#if !engine.state.picErr && bv.src}
                        <img src={bv.src} alt="" onerror={() => engine.actions.picError()}>
                    {:else}
                        <div class="pic-fallback">{bv.em}</div>
                    {/if}
                </div>
            {:else if bv.kind === 'letters'}
                {#each bv.letters as l}
                    <span class={l.cls || undefined}>{l.ch}</span>
                {/each}
            {:else}
                <em class="hint">{bv.txt}</em>
            {/if}
        </div>
    </div>

    <div class="misses" class:is-off={mv.kind === 'off'} id="misses">
        {#if mv.kind === 'lives'}
            <span class="sup-lives">{engine.t('kLives')}</span
            >{#each { length: engine.supMax } as _, i}{i < mv.n ? '❤️' : '🖤'}{/each}
        {:else if mv.kind === 'guess'}
            {#each { length: engine.maxMisses } as _, i}{i < mv.n ? '🖤' : '❤️'}{/each}
            {#if mv.wrong.length > 0}
                <span class="wrong">✕ {mv.wrong.join(' · ')}</span>
            {/if}
        {/if}
    </div>

    <!-- Modo Aventura: efectos activos de las ventajas elegidas -->
    <div class="adv-bar" class:is-off={engine.advChips.length === 0} id="advBar">
        {#each engine.advChips as c}
            <span class="adv-chip" class:on={c.on}>{c.txt}</span>
        {/each}
    </div>

    <!-- Modo Aventura: elección de ventaja (mientras tanto el reloj no corre) -->
    <div class="perk-veil" class:hidden={!engine.state.perkOpen} id="perkVeil">
        <div class="perk-box" role="dialog" aria-modal="true" aria-labelledby="perkTitle">
            <h2 id="perkTitle">{engine.t('perkTitle')}</h2>
            <p class="perk-hint" id="perkHint">{engine.t('perkHint')}</p>
            <div class="perk-grid" id="perkGrid">
                {#each engine.state.perkOpts as p}
                    <button type="button" class="perk-opt" class:rarity-c={p.rarity === 'comun'}
                            class:rarity-pc={p.rarity === 'pocoComun'} class:rarity-r={p.rarity === 'rara'}
                            class:rarity-e={p.rarity === 'epica'} class:rarity-l={p.rarity === 'legendaria'}
                            onclick={() => engine.actions.choosePerk(p)}>
                        <span class="perk-icon">{p.icon}</span>
                        <strong>{engine.uiEn ? p.en : p.es}</strong>
                        <span>{engine.uiEn ? p.descEn : p.descEs}</span>
                        <!-- Etiqueta de rareza: dice cuántas veces puede salir -->
                        <em class="perk-rarity">{rarTxt(p.rarity)}</em>
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="controls">
        <input id="typing" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
               placeholder={engine.t('placeholder')} disabled={engine.typingDis}>

        <p id="status">{engine.state.statusTxt}</p>

        <!-- Habilidad del fondo equipado: se dispara con la tecla
             reservada de «Controles» (o con este botón, para el táctil) -->
        <button class="ability-btn" class:hidden={!engine.abilityView.show}
                class:on={engine.abilityView.on} class:used={engine.abilityView.used}
                disabled={!engine.abilityView.ready} id="abilityBtn" type="button"
                onclick={() => engine.actions.useAbility()}>{engine.abilityView.txt}</button>

        <button class="main-btn" id="startBtn" onclick={() => engine.actions.startGame()}>{engine.state.startTxt}</button>

        <!-- Salir de la partida en curso: termina como si se agotara el tiempo -->
        <button class="chip-btn" id="quitBtn" type="button"
                class:hidden={engine.state.state !== 'playing'}
                onclick={() => engine.actions.quitGame()}>{engine.t('btnQuit')}</button>
    </div>

    <div class="results" class:hidden={!engine.state.resOpen} id="results">
        <h2>{engine.state.mode === 'supervivencia' ? engine.t('rTitleLives') : engine.t('rTitle')}</h2>
        <ul>
            <li><span>{engine.t('rkScore')}</span><strong>{res.score ?? 0}</strong></li>
            <li><span>{engine.t('rkWords')}</span><strong>{res.words ?? 0}</strong></li>
            <li><span>{engine.t('rkAcc')}</span><strong>{res.acc ?? 0}%</strong></li>
            <li><span>{engine.t('rkPpm')}</span><strong>{res.ppm ?? 0}</strong></li>
            <li><span>{engine.t('rkCoins')}</span><strong>{res.coins ?? 0}</strong></li>
            {#if engine.state.halloween}
                <li><span>{engine.t('rkCandy')}</span><strong>{res.candy ?? 0}</strong></li>
            {/if}
            <li><span>{engine.t('rkXp')}</span><strong>{res.xp ?? 0}</strong></li>
            <li><span>{engine.t('rkBestWords')}</span><strong>{res.best ?? 0}</strong></li>
        </ul>
        <p class:record={!!res.record}>{res.msg ?? ''}</p>

        {#if (res.score ?? 0) > 0}
            <div class="rank-form">
                <p class="rank-who">{engine.rankWhoTxt}</p>
                <div class="verify-row">
                    <label for="verifyInput">{engine.t('verifyLabel')}</label>
                    <span class="verify-code" aria-hidden="true">{engine.state.verifyCode || '----'}</span>
                    <input id="verifyInput" type="text" maxlength="8" autocomplete="off"
                           spellcheck="false" autocapitalize="characters" placeholder="código"
                           onkeydown={e => engine.actions.verifyKey(e)}
                           oninput={e => engine.actions.verifyInput(e)}
                           onpaste={e => engine.actions.verifyPaste(e)}>
                </div>
                <button class="chip-btn" id="saveScoreBtn" disabled={engine.state.rankBusy}
                        onclick={() => engine.actions.saveScore()}>{engine.t('rankSave')}</button>
            </div>
        {/if}
        <p class="rank-saved" class:off={engine.state.rankMsgOff}>{engine.state.rankMsgTxt}</p>
    </div>
