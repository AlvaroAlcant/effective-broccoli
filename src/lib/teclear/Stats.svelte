<script>
	import { engine } from './engine.svelte.js';
</script>

    <div class="stats">
        <div class="stat"><span id="kScore">{engine.t('kScore')}</span><strong id="score">{engine.state.score}</strong></div>
        <div class="stat coins"><span id="kCoins">{engine.t('kCoins')}</span><strong id="coins">{engine.coinsTxt}</strong></div>
        <div class="stat candy" class:hidden={!engine.state.halloween}><span id="kCandy">{engine.t('kCandy')}</span><strong id="candy">{engine.candyTxt}</strong></div>
        <div class="stat" id="timeBox" class:hidden={engine.pizRun} class:low={engine.timeLow}><span id="kTime">{engine.state.mode === 'supervivencia' ? engine.t('kTimeWord') : engine.t('kTime')}</span><strong id="time">{engine.timeTxt}</strong></div>
        <div class="stat"><span id="kStreak">{engine.t('kStreak')}</span><strong id="streak">{engine.streakTxt}</strong></div>
        <div class="stat"><span id="kLevel">{engine.t('kLevel')}</span><strong id="level">{engine.level()}</strong></div>
        <div class="stat"><span id="kBest">{engine.t('kBest')}</span><strong id="best">{engine.state.best}</strong></div>
        <div class="stat words"><span id="kBestWords">{engine.t('kBestWords')}</span><strong id="bestWords">{engine.state.bestWords}</strong></div>
    </div>
