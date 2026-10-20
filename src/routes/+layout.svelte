<script>
	// Estilos globales del sitio (src/app.css): al estar en el layout raíz
	// se cargan una sola vez y valen para todas las páginas. Los estilos
	// propios de cada minijuego siguen en su hoja, importada por su página.
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
