<script>
	import { G } from './game.svelte.js';
</script>

    <!-- Logros: retos que al completarse desbloquean una recompensa -->
    <section class="logros" id="logros" class:hidden={!G.logrosOpen}>
        <div class="shop-head">
            <h2>{G.t('achTitle')}</h2>
            <span class="shop-coins">🏅 {G.achCountTxt}</span>
        </div>
        <p class="shop-hint">{G.t('achHint')}</p>
        <div class="ach-grid">
            {#each G.achCards as a (a.id)}
                <div class="ach-card" class:done={a.done}>
                    <div class="ach-head">
                        <span class="ach-icon">{a.icon}</span>
                        <strong class="ach-name">{a.name}</strong>
                    </div>
                    <p class="ach-desc">{a.desc}</p>
                    <div class="ach-bar"><i style:width={a.pct + '%'}></i></div>
                    <div class="ach-num">{a.p} / {a.goal}</div>
                    <div class="ach-reward">🎁 {G.t('achReward')}: {a.reward}</div>
                    <div class="ach-state">{a.done ? G.t('achDone') : G.t('achDoing')}</div>
                </div>
            {/each}
        </div>
    </section>
