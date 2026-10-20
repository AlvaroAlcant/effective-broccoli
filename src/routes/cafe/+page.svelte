<script>
	import './cafe.css';

	let state = $state('idle'); // 'idle' | 'brewing' | 'done'

	let status = $derived(
		state === 'brewing'
			? 'Preparando café...'
			: state === 'done'
				? '¡Tu café está listo! ☕'
				: 'Pulsa el botón para preparar tu café'
	);

	function brewCoffee() {
		if (state === 'brewing') return;
		state = 'brewing';
		setTimeout(() => (state = 'done'), 2000);
	}
</script>

<svelte:head>
	<title>Máquina de Café</title>
</svelte:head>

<header>
	<h1>☕ Máquina de Café</h1>
</header>

<div class="machine">
	<div class="steam" class:visible={state === 'done'}>💨</div>
	<div class="cup">
		<div class="coffee" class:full={state === 'done'}></div>
	</div>
	<button onclick={brewCoffee} disabled={state === 'brewing'}>
		{state === 'done' ? 'Preparar otro' : 'Preparar Café'}
	</button>
	<p id="status">{status}</p>
</div>

<footer>
	<p>&copy; 2026 Mi Máquina de Café</p>
</footer>
