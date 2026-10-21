<script>
	// Estilos globales del sitio (src/app.css): al estar en el layout raíz
	// se cargan una solo vez y valen para todas las páginas. Ahí están la
	// base común (.hidden) y los estilos de Teclea, estos últimos acotados a
	// su página con «body:has(.logo-wrap)». Odyssey y Café siguen teniendo
	// su propia hoja, importada por su página.
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
