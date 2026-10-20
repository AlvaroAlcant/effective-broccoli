<script>
    import { onMount } from 'svelte';
    import { initSpiders } from './spiders.js';
    // Las arañas de los hilos se pueden agarrar y tensar; al soltarlas
    // oscilan con físicas reales hasta volver a su sitio
    onMount(() => initSpiders(document.getElementById('hwnDecor')));
</script>
    <!-- Decoración de Halloween: telarañas en las esquinas, arañas
         colgando de un hilo y calabazas en la parte inferior. Oculta por
         defecto: solo la muestra body.halloween. Va fija y POR DETRÁS de
         todo el contenido (z-index -1, sin clics), así que el fondo de
         pantalla se ve sin problemas y nada estorba al juego. -->
    <div id="hwnDecor" aria-hidden="true">
        <!-- Telarañas de las esquinas superiores (la de la derecha es la
             misma dibujada, girada con CSS) -->
        <svg class="hwn-web hwn-web-tl" viewBox="0 0 100 100">
            <g fill="none" stroke="rgba(226,232,240,.55)" stroke-width="1.2" stroke-linecap="round">
                <path d="M0 0 L100 0"/>
                <path d="M0 0 L92.4 38.3"/>
                <path d="M0 0 L70.7 70.7"/>
                <path d="M0 0 L38.3 92.4"/>
                <path d="M0 0 L0 100"/>
                <path d="M30 0 Q24.1 4.8 27.7 11.5"/>
                <path d="M27.7 11.5 Q20.5 13.7 21.2 21.2"/>
                <path d="M21.2 21.2 Q13.7 20.5 11.5 27.7"/>
                <path d="M11.5 27.7 Q4.8 24.1 0 30"/>
                <path d="M55 0 Q44.2 8.8 50.8 21"/>
                <path d="M50.8 21 Q37.5 25.1 38.9 38.9"/>
                <path d="M38.9 38.9 Q25.1 37.5 21 50.8"/>
                <path d="M21 50.8 Q8.8 44.2 0 55"/>
                <path d="M80 0 Q64.3 12.8 73.9 30.6"/>
                <path d="M73.9 30.6 Q54.5 36.4 56.6 56.6"/>
                <path d="M56.6 56.6 Q36.4 54.5 30.6 73.9"/>
                <path d="M30.6 73.9 Q12.8 64.3 0 80"/>
                <path d="M100 0 Q80.4 16 92.4 38.3"/>
                <path d="M92.4 38.3 Q68.2 45.6 70.7 70.7"/>
                <path d="M70.7 70.7 Q45.6 68.2 38.3 92.4"/>
                <path d="M38.3 92.4 Q16 80.4 0 100"/>
            </g>
        </svg>
        <svg class="hwn-web hwn-web-tr" viewBox="0 0 100 100">
            <g fill="none" stroke="rgba(226,232,240,.55)" stroke-width="1.2" stroke-linecap="round">
                <path d="M0 0 L100 0"/>
                <path d="M0 0 L92.4 38.3"/>
                <path d="M0 0 L70.7 70.7"/>
                <path d="M0 0 L38.3 92.4"/>
                <path d="M0 0 L0 100"/>
                <path d="M30 0 Q24.1 4.8 27.7 11.5"/>
                <path d="M27.7 11.5 Q20.5 13.7 21.2 21.2"/>
                <path d="M21.2 21.2 Q13.7 20.5 11.5 27.7"/>
                <path d="M11.5 27.7 Q4.8 24.1 0 30"/>
                <path d="M55 0 Q44.2 8.8 50.8 21"/>
                <path d="M50.8 21 Q37.5 25.1 38.9 38.9"/>
                <path d="M38.9 38.9 Q25.1 37.5 21 50.8"/>
                <path d="M21 50.8 Q8.8 44.2 0 55"/>
                <path d="M80 0 Q64.3 12.8 73.9 30.6"/>
                <path d="M73.9 30.6 Q54.5 36.4 56.6 56.6"/>
                <path d="M56.6 56.6 Q36.4 54.5 30.6 73.9"/>
                <path d="M30.6 73.9 Q12.8 64.3 0 80"/>
                <path d="M100 0 Q80.4 16 92.4 38.3"/>
                <path d="M92.4 38.3 Q68.2 45.6 70.7 70.7"/>
                <path d="M70.7 70.7 Q45.6 68.2 38.3 92.4"/>
                <path d="M38.3 92.4 Q16 80.4 0 100"/>
            </g>
        </svg>

        <!-- Arañas pequeñas posadas sobre cada telaraña -->
        <span class="hwn-webbug b1">🕷️</span>
        <span class="hwn-webbug b2">🕷️</span>

        <!-- Arañas colgando de un hilo, meciéndose despacio -->
        <span class="hwn-thread hwn-thread-1"><i>🕷️</i></span>
        <span class="hwn-thread hwn-thread-2"><i>🕷️</i></span>
        <span class="hwn-thread hwn-thread-3"><i>🕷️</i></span>

        <!-- Calabazas de la esquina inferior, con su brillo encendido -->
        <span class="hwn-pump p1">🎃</span>
        <span class="hwn-pump p2">🎃</span>
        <span class="hwn-pump p3">🎃</span>
        <span class="hwn-pump p4">🎃</span>
    </div>
    <!-- Fondo "Circuito" (logro Speedrunner): coches que pasan a toda velocidad.
         Oculto por defecto: solo lo muestra body.bg-carreras. -->
    <div id="raceTrack" aria-hidden="true">
        <div class="lane" style="top:12%">
            <span class="race-car to-right" style="--dur:1.5s;--delay:0s">🏎️</span>
            <span class="race-car to-left" style="--dur:2.1s;--delay:.6s">🚗</span>
        </div>
        <div class="lane" style="top:50%">
            <span class="race-car to-right" style="--dur:1.2s;--delay:.35s">🚕</span>
            <span class="race-car to-left" style="--dur:1.8s;--delay:1.05s">🏎️</span>
        </div>
        <div class="lane" style="top:78%">
            <span class="race-car to-right" style="--dur:1.7s;--delay:.8s">🏍️</span>
            <span class="race-car to-left" style="--dur:1.35s;--delay:.2s">🚙</span>
        </div>
    </div>
