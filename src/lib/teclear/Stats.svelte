<script>
	import { G } from './game.svelte.js';
</script>

    <div class="stats">
        <div class="stat"><span id="kScore">{G.t('kScore')}</span><strong id="score">{G.score}</strong></div>
        <div class="stat coins"><span id="kCoins">{G.t('kCoins')}</span><strong id="coins">{G.coinsTxt}</strong></div>
        <div class="stat candy hidden" id="candyStat"><span id="kCandy">{G.t('kCandy')}</span><strong id="candy">{G.candyTxt}</strong></div>
        <div class="stat" id="timeBox" class:low={G.timeLow}><span id="kTime">{G.mode === 'supervivencia' ? G.t('kTimeWord') : G.t('kTime')}</span><strong id="time">{G.timeTxt}</strong></div>
        <div class="stat"><span id="kStreak">{G.t('kStreak')}</span><strong id="streak">{G.streakTxt}</strong></div>
        <div class="stat"><span id="kLevel">{G.t('kLevel')}</span><strong id="level">{G.level}</strong></div>
        <div class="stat"><span id="kBest">{G.t('kBest')}</span><strong id="best">{G.best}</strong></div>
        <div class="stat words"><span id="kBestWords">{G.t('kBestWords')}</span><strong id="bestWords">{G.bestWords}</strong></div>
    </div>
