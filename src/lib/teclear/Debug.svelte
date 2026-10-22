<script>
	import { engine } from './engine.svelte.js';
	import { events } from './services/events.svelte.js';
	import { eco } from './services/economy.js';
	import { EVENTS } from './data/events.js';

	const st = () => engine.state;
	const dbg = engine.actions;

	// Campos numéricos editables del panel: qué se ve y qué clave toca
	const NUM_FIELDS = [
		{ key: 'coins', label: '🪙 Monedas' },
		{ key: 'caramelos', label: '🍬 Caramelos' },
		{ key: 'xp', label: '⭐ XP' },
		{ key: 'score', label: '🎯 Puntos' },
		{ key: 'streak', label: '🔥 Racha' },
		{ key: 'completed', label: '✅ Palabras' },
		{ key: 'timeLeft', label: '⏱️ Tiempo' },
		{ key: 'supLives', label: '❤️ Vidas' },
		{ key: 'errors', label: '❌ Fallos' },
		{ key: 'hits', label: '⌨️ Aciertos' },
	];

	// Los toggles de extras se gobiernan con el setter normal tras
	// concederlos, para que el estado de variantes quede consistente
	function setExtra(id, on) {
		dbg.dbgSet('extra.' + id, !!on);
	}
</script>

{#if engine.esAdmin}
	<button class="dbg-toggle" title="Panel de depuración"
		class:on={st().debugOpen}
		onclick={() => dbg.dbgToggle()}>🐞</button>

	{#if st().debugOpen}
		<aside class="dbg-panel">
			<header class="dbg-head">
				<strong>🐞 Depuración</strong>
				<button class="dbg-x" onclick={() => dbg.dbgToggle()}>✕</button>
			</header>

			<section>
				<h4>Recursos y partida</h4>
				{#each NUM_FIELDS as f (f.key)}
					<label class="dbg-row">
						<span>{f.label}</span>
						<input type="number" value={st()[f.key]}
							onchange={e => dbg.dbgSet(f.key, +e.currentTarget.value)} />
						<button onclick={() => dbg.dbgAdd(f.key, -100)}>−100</button>
						<button onclick={() => dbg.dbgAdd(f.key, +100)}>+100</button>
					</label>
				{/each}
			</section>

			<section>
				<h4>Tema</h4>
				<label class="dbg-row">
					<span>📹 Veyon</span>
					<input type="checkbox" checked={st().veyon}
						onchange={e => dbg.dbgSet('veyon', e.currentTarget.checked)} />
				</label>
				<label class="dbg-row">
					<span>🔤 Fuente</span>
					<select value={st().equipped}
						onchange={e => dbg.dbgSet('equipped', e.currentTarget.value)}>
						{#each eco.all('font') as s (s.id)}<option value={s.id}>{s.es}</option>{/each}
					</select>
				</label>
				<label class="dbg-row">
					<span>🖼️ Fondo</span>
					<select value={st().bg}
						onchange={e => dbg.dbgSet('bg', e.currentTarget.value)}>
						{#each eco.all('bg') as b (b.id)}<option value={b.id}>{b.es}</option>{/each}
					</select>
				</label>
				<label class="dbg-row">
					<span>✨ Efecto</span>
					<select value={st().fxEquipped}
						onchange={e => dbg.dbgSet('fxEquipped', e.currentTarget.value)}>
						<option value="">—</option>
						{#each eco.all('fx') as f (f.id)}<option value={f.id}>{f.es}</option>{/each}
					</select>
				</label>
			</section>

			<section>
				<h4>Extras</h4>
				{#each eco.all('extra') as x (x.id)}
					<label class="dbg-row">
						<span>{x.icon} {x.es}</span>
						<input type="checkbox" checked={!!st().extraOn[x.id]}
							onchange={e => setExtra(x.id, e.currentTarget.checked)} />
					</label>
				{/each}
			</section>

			<section>
				<h4>Evento</h4>
				<label class="dbg-row">
					<span>🎃 Forzar</span>
					<select value={events.testId || ''}
						onchange={e => dbg.dbgEvent(e.currentTarget.value || null)}>
						<option value="">calendario</option>
						<option value="none">normal (sin evento)</option>
						{#each Object.keys(EVENTS) as id (id)}
							<option value={id}>{id}</option>
						{/each}
					</select>
				</label>
			</section>

			<section>
				<h4>Acciones</h4>
				<div class="dbg-btns">
					<button onclick={() => dbg.dbgSet('state', 'playing')}>▶ Empezar</button>
					<button onclick={() => dbg.dbgSet('state', 'idle')}>⏹ Terminar</button>
					<button onclick={() => dbg.dbgFunds()} title="Saldo suficiente para comprar todo">💸 Fondos</button>
					<button onclick={() => dbg.dbgBuyAll()} title="Compra todo por el camino real">🛒 Comprar todo</button>
					<button onclick={() => dbg.dbgGrantAll()} title="Regala todo sin pasar por caja">🎁 Regalar</button>
					<button onclick={() => dbg.dbgPerks()} title="Abre una parada de la aventura para ver ventajas y rarezas">🎲 Ventajas</button>
				</div>
			</section>
		</aside>
	{/if}
{/if}
