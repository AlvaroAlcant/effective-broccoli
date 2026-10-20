<script>
	import { G } from './game.svelte.js';
	const tabs = [
		{ key: 'normal', title: 'rankTitle', hint: 'rankHint', empty: 'rankEmpty' },
		{ key: 'aventura', title: 'rankTitleAdv', hint: 'rankHintAdv', empty: 'rankEmptyAdv' }
	];
	const rankStatus = d => {
		if (!d.loaded) return '';
		// 🔒 datos verificados con su huella · ⚠️ el JSON venía alterado
		return d.online ? G.t('rankSync') + (d.tampered ? ' ⚠️' : ' 🔒') : G.t('rankLocal');
	};
</script>

    <section class="ranking" id="ranking" class:hidden={!G.rankOpen}>
        {#each tabs as tab (tab.key)}
            {@const d = G.rank[tab.key]}
            <div class="rank-tab" class:rank-focus={G.rankFocus === tab.key}>
                <h2>{G.t(tab.title)}</h2>
                <p class="rank-hint">{G.t(tab.hint)}</p>
                <ol class="rank-list">
                    {#each d.entries as e, i (e.id + '-' + i)}
                        <li class:me={e.id === G.myId}>
                            <span class="rank-pos">{G.uiEn ? '#' + (i + 1) : (i + 1) + 'º'}</span>
                            <span class="rank-name">{e.n}</span>
                            <span class="rank-score">{e.s}</span>
                            <span class="rank-words">� {e.w}</span>
                            <span class="rank-date">{G.rankDate(e.d)}</span>
                        </li>
                    {/each}
                </ol>
                <p class="rank-empty" class:hidden={d.entries.length > 0}>{G.t(tab.empty)}</p>
                <p class="rank-status">{rankStatus(d)}</p>
            </div>
        {/each}
    </section>
