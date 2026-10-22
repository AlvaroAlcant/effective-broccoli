<script>
	import { onMount } from 'svelte';
	import logo from '#lib/img/estesoTeclea.png';
	import { engine } from '#lib/teclear/engine.svelte.js';
	import Decor from '#lib/teclear/Decor.svelte';
	import Header from '#lib/teclear/Header.svelte';
	import Selectors from '#lib/teclear/Selectors.svelte';
	import Stats from '#lib/teclear/Stats.svelte';
	import Shop from '#lib/teclear/Shop.svelte';
	import Perfil from '#lib/teclear/Perfil.svelte';
	import GameArea from '#lib/teclear/GameArea.svelte';
	import Ranking from '#lib/teclear/Ranking.svelte';
	import Logros from '#lib/teclear/Logros.svelte';
	import Diccionario from '#lib/teclear/Diccionario.svelte';
	import Inventario from '#lib/teclear/Inventario.svelte';
	import Debug from '#lib/teclear/Debug.svelte';
	import Footer from '#lib/teclear/Footer.svelte';
	// Los estilos de Teclea viven ya en src/app.css (hoja global del sitio),
	// solo se aplican dentro de esta página: ver «body:has(.logo-wrap)».

	onMount(() => engine.mount());
</script>

<svelte:head>
	<title>Minijuego: Teclea a la Velocidad</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pacifico&family=Poppins:wght@600&family=Orbitron:wght@700;900&family=Creepster&family=Nosifer&family=Butcherman&display=swap"
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
<Diccionario />
<Inventario />
<Debug />
<Footer />
