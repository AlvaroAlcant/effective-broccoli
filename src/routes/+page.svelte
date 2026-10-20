<script>
	import { onMount } from 'svelte';
	import logo from '#lib/img/estesoTeclea.png';
	import { initTeclear } from '#lib/teclear/game.js';
	import Decor from '#lib/teclear/Decor.svelte';
	import Header from '#lib/teclear/Header.svelte';
	import Selectors from '#lib/teclear/Selectors.svelte';
	import Stats from '#lib/teclear/Stats.svelte';
	import Shop from '#lib/teclear/Shop.svelte';
	import Perfil from '#lib/teclear/Perfil.svelte';
	import GameArea from '#lib/teclear/GameArea.svelte';
	import Ranking from '#lib/teclear/Ranking.svelte';
	import Logros from '#lib/teclear/Logros.svelte';
	import Footer from '#lib/teclear/Footer.svelte';
	import './index.css';

	onMount(() => initTeclear());
</script>

<svelte:head>
	<title>Minijuego: Teclea a la Velocidad</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pacifico&family=Poppins:wght@600&family=Orbitron:wght@700;900&display=swap"
		rel="stylesheet"
	/>
	<link rel="icon" type="image/png" href={logo} />
	<link rel="apple-touch-icon" href={logo} />
</svelte:head>

<Decor />
<Header {logo} />
<Selectors />
<Stats />
<Shop />
<Perfil />
<GameArea />
<Ranking />
<Logros />
<Footer />
