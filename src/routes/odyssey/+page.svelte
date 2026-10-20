<script>
	import { onMount } from 'svelte';
	import { initOdyssey } from '#lib/odyssey/game.js';
	import './odyssey.css';

	onMount(() => initOdyssey());
</script>

<svelte:head>
	<title>EstesIA Odyssey</title>
</svelte:head>

    <header>
        <h1>EstesIA Odyssey</h1>
        <div class="subtitle">--- ODISEA GALÁCTICA EN 2D ---</div>
    </header>

    <div id="wrap">
        <canvas id="game" width="1100" height="700"></canvas>

        <div id="hud">
            <span>PUNTOS: <b id="score">0</b></span>
            <span>OLEADA: <b id="wave">1</b></span>
            <span>ENEMIGAS: <b id="remaining">0</b></span>
            <span>DIFICULTAD: <b id="diff">NORMAL</b></span>
            <span>VIDAS: <b id="lives">♥♥♥</b></span>
            <span><b id="abName">TURBO</b>: <b id="turbo">LISTO</b></span>
        </div>

        <div id="overlay">
            <h2 id="ovTitle">EstesIA Odyssey</h2>
            <p id="ovText">Pilota tu nave por el sector EstesIA y destruye a todas las naves enemigas: solo pasas de oleada cuando no queda ninguna en pie. ¡Las que se escapan por la parte inferior vuelven a entrar por arriba, así que no hay perdón por escaparse! Cada 5 oleadas aparece un jefe con mucha vida, y cada uno es más duro que el anterior. La única forma de perder la partida es quedarte sin vidas.</p>

            <div class="diff-block" id="diffBlock">
                <div class="diff-label">Dificultad</div>
                <div class="diff-btns" id="diffBtns">
                    <button class="diffBtn" data-diff="facil">Fácil</button>
                    <button class="diffBtn active" data-diff="normal">Normal</button>
                    <button class="diffBtn" data-diff="dificil">Difícil</button>
                </div>
            </div>

            <div class="diff-block" id="shipBlock">
                <div class="diff-label">Nave</div>
                <div class="diff-btns" id="shipBtns">
                    <button class="shipBtn active" data-ship="caza">Cazador</button>
                    <button class="shipBtn" data-ship="rayo">Haz</button>
                    <button class="shipBtn" data-ship="campo">Defensor</button>
                </div>
                <div class="ship-desc" id="shipDesc"></div>
            </div>

            <div class="diff-block hidden" id="ctrlBlock">
                <div class="diff-label">Controles</div>
                <div class="ctrl-grid" id="ctrlGrid">
                    <div class="ctrl-row"><span class="act">Disparar</span><button class="keyBtn" data-act="shoot" type="button">—</button></div>
                    <div class="ctrl-row"><span class="act">Habilidad</span><button class="keyBtn" data-act="ability" type="button">—</button></div>
                    <div class="ctrl-row"><span class="act">Mover arriba</span><button class="keyBtn" data-act="up" type="button">—</button></div>
                    <div class="ctrl-row"><span class="act">Mover abajo</span><button class="keyBtn" data-act="down" type="button">—</button></div>
                    <div class="ctrl-row"><span class="act">Mover izquierda</span><button class="keyBtn" data-act="left" type="button">—</button></div>
                    <div class="ctrl-row"><span class="act">Mover derecha</span><button class="keyBtn" data-act="right" type="button">—</button></div>
                </div>
                <div class="ctrl-hint" id="ctrlHint">Haz clic en una tecla y pulsa la nueva tecla para asignarla (ESC cancela). WASD y el clic izquierdo siguen disponibles.</div>
                <button class="smallBtn" id="resetKeysBtn" type="button">Restablecer teclas</button>
            </div>

            <div class="keys" id="ovKeys">
                ← → &nbsp;o&nbsp; A / D — mover lateralmente<br>
                ↑ ↓ &nbsp;o&nbsp; W / S — avanzar / retroceder<br>
                CLICK IZQUIERDO — disparar un proyectil por clic<br>
                MAYÚS (SHIFT) — turbo con 3 s de recarga<br>
                P — pausar
            </div>
            <div class="btn-row">
                <button id="startBtn">Jugar</button>
                <button id="ctrlBtn" class="ghostBtn" type="button">Controles</button>
            </div>
        </div>
    </div>

    <footer>&copy; 2026 EstesIA Odyssey — un shooter arcade 2D</footer>

