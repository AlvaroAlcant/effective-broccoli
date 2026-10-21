    <!-- ===================== Menú principal =====================
         Ordenado de lo más importante a lo auxiliar:
         1· Modo de juego · 2· Idioma · 3· Progreso
         4· Controles · 5· Cuenta
         El fondo de pantalla se elige en el Inventario (y se desbloquea
         comprándolo en la tienda o ganándolo con un logro). -->
    <div class="selectors">
        <!-- 1 · Cómo se juega (con sus variantes al lado) -->
        <div class="sel-row">
            <span class="sel-label" id="modeLabel">🎮 Modo de juego</span>
            <button class="chip-btn active" id="btnType">⌨️ Tecleo</button>
            <select id="modeSelect" class="chip-select" aria-label="Variante del modo Tecleo"></select>
            <button class="chip-btn" id="btnGuess">🧩 Adivinar</button>
            <button class="chip-btn" id="btnImagen">🖼️ Imágenes</button>
            <button class="chip-btn" id="btnAventura">🗺️ Aventura</button>
            <button class="chip-btn" id="btnSup">🛡️ Supervivencia</button>
            <!-- Variante de Supervivencia: Clásico / Encantado (solo en Halloween) -->
            <select id="supSelect" class="chip-select" aria-label="Variante de Supervivencia"></select>
        </div>
        <!-- 2 · Idioma de la interfaz y de las palabras -->
        <div class="sel-row">
            <span class="sel-label" id="langLabel">🌐 Idioma / Language</span>
            <button class="chip-btn active" id="btnEs">🇪🇸 Español</button>
            <button class="chip-btn" id="btnEn">🇬🇧 English</button>
            <button class="chip-btn" id="btnMurciano">🗣️ Murciano</button>
        </div>
        <!-- 3 · Dónde mirar tu progreso y qué desbloquear -->
        <div class="sel-row sel-row-divider">
            <span class="sel-label" id="progLabel">🏆 Progreso</span>
            <button class="chip-btn" id="btnShop">🛒 Tienda</button>
            <button class="chip-btn" id="btnInv">🎒 Inventario</button>
            <button class="chip-btn" id="btnRanking">🏆 Ranking</button>
            <button class="chip-btn" id="btnLogros">🏅 Logros</button>
        </div>
        <!-- 4 · Controles: la tecla reservada de la habilidad del fondo -->
        <div class="sel-row">
            <span class="sel-label" id="ctrlLabel">🎮 Controles</span>
            <button class="chip-btn" id="btnAbilityKey" type="button">⚡ Habilidad: F1</button>
            <span class="sel-hint" id="ctrlHint">Púlsala durante la partida para activar el poder del fondo que lleves puesto.</span>
        </div>
        <!-- 5 · Cuenta de jugador y herramientas del profe -->
        <div class="sel-row">
            <span class="sel-label" id="userLabel">👤 Cuenta y ajustes</span>
            <button class="chip-btn" id="btnRegister">👤 Registrar</button>
            <button class="chip-btn" id="btnLogin">🔑 Iniciar sesión</button>
            <button class="chip-btn" id="btnVeyon">🖥️ Modo Veyon</button>
        </div>
    </div>
