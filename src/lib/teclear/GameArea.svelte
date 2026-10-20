<script>
	import { G } from './game.svelte.js';
	const bv = $derived(G.boardView);
	const mv = $derived(G.missesView);
	const res = $derived(G.res);
	const supTop = it => `calc(${it.y * 100}% - ${it.y * 4}px)`;
	const supTf = it => `translateY(${-it.y * 100}%)`;
	const supDanger = it => (1 - it.y) * it.span <= 4;
	const blastDelay = (bv, it) =>
		((it.typed - 1 - (it.shotFrom || 0)) * bv.shotGap + bv.shotMs) + 'ms';
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
                         onclick={() => G.a.supAim(it.n)}>
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
                    {#if !G.picErr && bv.src}
                        <img src={bv.src} alt="" onerror={() => G.a.picError()}>
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
            <span class="sup-lives">{G.t('kLives')}</span
            >{#each { length: G.supMax } as _, i}{i < mv.n ? '❤️' : '🖤'}{/each}
        {:else if mv.kind === 'guess'}
            {#each { length: G.maxMisses } as _, i}{i < mv.n ? '🖤' : '❤️'}{/each}
            {#if mv.wrong.length > 0}
                <span class="wrong">✕ {mv.wrong.join(' · ')}</span>
            {/if}
        {/if}
    </div>

    <!-- Modo Aventura: efectos activos de las ventajas elegidas -->
    <div class="adv-bar" class:is-off={G.advChips.length === 0} id="advBar">
        {#each G.advChips as c}
            <span class="adv-chip" class:on={c.on}>{c.txt}</span>
        {/each}
    </div>

    <!-- Modo Aventura: elección de ventaja (mientras tanto el reloj no corre) -->
    <div class="perk-veil" class:hidden={!G.perkOpen} id="perkVeil">
        <div class="perk-box" role="dialog" aria-modal="true" aria-labelledby="perkTitle">
            <h2 id="perkTitle">{G.t('perkTitle')}</h2>
            <p class="perk-hint" id="perkHint">{G.t('perkHint')}</p>
            <div class="perk-grid" id="perkGrid">
                {#each G.perkOpts as p}
                    <button type="button" class="perk-opt" onclick={() => G.a.choosePerk(p)}>
                        <span class="perk-icon">{p.icon}</span>
                        <strong>{G.uiEn ? p.en : p.es}</strong>
                        <span>{G.uiEn ? p.descEn : p.descEs}</span>
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="controls">
        <input id="typing" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
               placeholder={G.t('placeholder')} disabled={G.typingDis}>

        <p id="status">{G.statusTxt}</p>

        <button class="main-btn" id="startBtn" onclick={() => G.a.startGame()}>{G.startTxt}</button>
    </div>

    <div class="results" class:hidden={!G.resOpen} id="results">
        <h2>{G.mode === 'supervivencia' ? G.t('rTitleLives') : G.t('rTitle')}</h2>
        <ul>
            <li><span>{G.t('rkScore')}</span><strong>{res.score ?? 0}</strong></li>
            <li><span>{G.t('rkWords')}</span><strong>{res.words ?? 0}</strong></li>
            <li><span>{G.t('rkAcc')}</span><strong>{res.acc ?? 0}%</strong></li>
            <li><span>{G.t('rkPpm')}</span><strong>{res.ppm ?? 0}</strong></li>
            <li><span>{G.t('rkCoins')}</span><strong>{res.coins ?? 0}</strong></li>
            {#if G.halloween}
                <li><span>{G.t('rkCandy')}</span><strong>{res.candy ?? 0}</strong></li>
            {/if}
            <li><span>{G.t('rkXp')}</span><strong>{res.xp ?? 0}</strong></li>
            <li><span>{G.t('rkBestWords')}</span><strong>{res.best ?? 0}</strong></li>
        </ul>
        <p class:record={!!res.record}>{res.msg ?? ''}</p>

        {#if (res.score ?? 0) > 0}
            <div class="rank-form">
                <p class="rank-who">{G.rankWhoTxt}</p>
                <div class="verify-row">
                    <label for="verifyInput">{G.t('verifyLabel')}</label>
                    <span class="verify-code" aria-hidden="true">{G.verifyCode || '----'}</span>
                    <input id="verifyInput" type="text" maxlength="8" autocomplete="off"
                           spellcheck="false" autocapitalize="characters" placeholder="código"
                           onkeydown={e => G.a.verifyKey(e)}
                           oninput={e => G.a.verifyInput(e)}
                           onpaste={e => G.a.verifyPaste(e)}>
                </div>
                <button class="chip-btn" id="saveScoreBtn" disabled={G.rankBusy}
                        onclick={() => G.a.saveScore()}>{G.t('rankSave')}</button>
            </div>
        {/if}
        <p class="rank-saved" class:off={G.rankMsgOff}>{G.rankMsgTxt}</p>
    </div>
