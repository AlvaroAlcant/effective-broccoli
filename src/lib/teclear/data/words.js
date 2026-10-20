// ---------- Listas de palabras por modo e idioma ----------
export const WORDS = {
    es: [
        "casa", "perro", "gato", "árbol", "mar", "sol", "luna", "flor",
        "pan", "rápido", "teclado", "juego", "escribir", "velocidad",
        "programa", "javascript", "ratón", "pantalla", "ventana",
        "ciudad", "playa", "montaña", "fuego", "agua", "viento",
        "estrella", "viaje", "música", "libro", "escuela", "amigo",
        "familia", "comida", "ciencia", "naturaleza", "aventura",
        "memoria", "cursor", "archivo", "carpeta", "sistema", "código",
        "página", "número", "tecla", "pulso", "reto", "nivel",
        "puntuación", "increíble", "desafío", "concentración",
        "tecnología", "creatividad", "inteligencia", "experimento",
        // Añadidas: día a día, escuela, campo y naturaleza
        "ola", "nube", "cine", "mesa", "silla", "cama", "vino",
        "queso", "taza", "reloj", "sopa", "barco", "tren", "metro",
        "isla", "nieve", "lluvia", "rayo", "niebla", "bosque",
        "valle", "cielo", "planeta", "cometa", "monitor", "usuario",
        "servidor", "algoritmo", "proyecto", "examen", "libreta",
        "pizarra", "profesor", "colegio", "deberes", "mercado",
        "tienda", "trabajo", "bicicleta", "caminar", "correr",
        "nadar", "volar", "saltar", "pastel", "cerveza", "jirafa",
        "tiburón", "ballena", "ciempiés", "mandarina", "chocolate"
    ],
    en: [
        "cat", "dog", "sun", "run", "key", "box", "day", "map",
        "sky", "tree", "book", "game", "type", "fast", "code",
        "word", "time", "home", "name", "hand", "mouse", "screen",
        "window", "city", "beach", "fire", "water", "wind", "star",
        "travel", "music", "school", "friend", "family", "food",
        "science", "nature", "adventure", "memory", "cursor",
        "file", "folder", "system", "page", "number", "level",
        "challenge", "incredible", "focus", "keyboard", "speed",
        "typing", "program", "javascript", "technology", "creative",
        "intelligence", "experiment", "mountain", "evening",
        // Added: everyday life, school, animals and nature
        "rain", "snow", "leaf", "bird", "fish", "frog", "bear",
        "wolf", "lion", "milk", "bread", "cake", "rice", "soup",
        "desk", "chair", "floor", "house", "paper", "pencil",
        "teacher", "student", "garden", "river", "ocean", "island",
        "cloud", "storm", "winter", "summer", "spring", "autumn",
        "monkey", "tiger", "horse", "sheep", "orange", "yellow",
        "purple", "guitar", "doctor", "market", "ticket", "jacket",
        "pocket", "rocket", "planet", "robot", "laptop", "server",
        "browser", "project", "homework", "weekend", "holiday",
        "dolphin", "volcano", "blanket", "kitchen", "birthday"
    ]
};

// ---------- Palabras del modo Murciano ----------
// Se escriben tal y como aparecen en pantalla (giros y voz de la Huerta)
export const MURCIANO_WORDS = [
    // Giros del habla murciana
    "muxo", "mu", "na", "to", "ta", "amo", "jarta", "ejtar",
    "hotro", "pueta", "lexos", "tene", "queré", "usté", "ñana",
    "gracius", "arreglau", "ganes", "debé", "talega", "agermiao",
    "germear", "amostazá", "parecé", "manoja", "altramuces",
    "pataca", "albérchigo", "huertano",
    // Sabores y paisaje de la Huerta
    "zarangollo", "caldero", "marinera", "escabeche", "atún",
    "melón", "sandía", "pimentón", "azafrán", "azahar", "segura",
    "huerta", "torta", "migas", "almejas", "arroz", "azúcar",
    "cencerro", "vendimia", "esparto", "tapas",
    // Más del Huerto, del Malecón y de la mesa murciana
    "ná", "vamoh", "empaná", "paparote", "quesada",
    "bienmesabe", "marfagón", "bondosita", "pargo", "gamba",
    "cazón", "atunero", "lebrillo", "almirez", "almazara",
    "potaje", "puchero", "garbanzos", "morcilla", "ferrás"
];

// ---------- Modo picante (+18) ----------
// Palabras subidas de tono: solo aparecen en la partida cuando el
// extra "Modo picante" está comprado y activado por el jugador.
export const PICANTE = {
    es: [
        "joder", "jodida", "jodido", "mierda", "puto", "puta",
        "gilipollas", "capullo", "cabrón", "cabrona", "coño", "carajo",
        "polla", "pene", "vagina", "culo", "nalgas", "teta", "chichis",
        "trasero", "pedo", "follar", "caliente", "desnudo", "desnuda",
        "erótico", "erótica", "sexo", "orgasmo", "tetona", "sucio",
        "sucia", "zorra", "pajero", "guarra", "guarro", "hostia",
        "malnacido", "lamida", "pornografía"
    ],
    en: [
        "damn", "crap", "hell", "ass", "arse", "butt", "boobs", "tits",
        "dick", "cock", "pussy", "fuck", "shit", "bastard", "prick",
        "knob", "wanker", "slut", "whore", "naked", "nude", "sexy",
        "horny", "kinky", "erotic", "orgasm", "screw", "bloody",
        "bollocks", "bugger", "shaft", "moan", "booty", "boner",
        "willy", "balls", "hump", "thong"
    ]
};

// ---------- Palabras del modo Php ----------
// Con el extra "Modo Php" comprado y activado, la partida se juega
// con palabras y funciones típicas de PHP: formularios, funciones
// del lenguaje y programación orientada a objetos.
// Solo letras minúsculas y guiones bajos: así se pueden teclear
// tanto en el modo Tecleo como en el modo Adivinar.
export const PHP_WORDS = [
    // Palabras clave y estructura del lenguaje
    "echo", "print", "php", "function", "return", "class", "public",
    "private", "protected", "static", "extends", "implements",
    "interface", "abstract", "final", "instanceof", "namespace",
    "require", "require_once", "include", "include_once", "isset",
    "unset", "empty", "define", "defined", "const",
    "global", "declare", "strict_types", "match", "fn", "yield",
    "foreach", "while", "break", "continue", "switch", "default",
    "throw", "try", "catch", "finally", "trait", "enum", "clone",
    "array", "string", "integer", "boolean", "float", "callable",
    "object", "null", "true", "false", "var", "exit", "die", "eval",
    "list", "as", "do", "for", "if", "else", "elseif", "use", "new",
    // Programación orientada a objetos
    "constructor", "destructor", "method", "property", "attribute",
    "getter", "setter", "inheritance", "polymorphism",
    "encapsulation", "abstraction", "override", "singleton",
    "factory", "adapter", "strategy", "observer", "autoload",
    "composer", "reflection", "anonymous", "closure", "abstracto",
    "instance", "subclass", "superclass", "overriding", "magic",
    "autoload_register", "to_string", "clone_object", "dynamic",
    // Formularios y peticiones web
    "form", "method", "action", "get", "post", "request", "response",
    "session", "session_start", "session_destroy", "cookie",
    "header", "headers", "input", "submit", "button", "name",
    "value", "type", "placeholder", "required", "textarea", "select",
    "option", "options", "checkbox", "radio", "label", "fieldset",
    "enctype", "multipart", "upload", "file", "files",
    "move_uploaded_file", "is_uploaded_file", "htmlspecialchars",
    "htmlentities", "strip_tags", "filter_var", "filter_input",
    "urlencode", "urldecode", "http_build_query", "parse_str",
    "setcookie", "token", "csrf", "validation", "sanitizing",
    // Funciones típicas
    "strlen", "strpos", "substr", "str_replace", "str_repeat",
    "strtoupper", "strtolower", "ucfirst", "ucwords", "trim",
    "explode", "implode", "count", "array_map", "array_filter",
    "array_reduce", "array_merge", "array_keys", "array_values",
    "array_slice", "array_sort", "in_array", "usort", "preg_match",
    "preg_replace", "date", "time", "rand", "max", "min", "abs",
    "round", "floor", "ceil", "number_format", "md5", "sha1",
    "password_hash", "password_verify", "getenv", "gettype",
    "is_array", "is_string", "is_numeric", "var_dump", "print_r",
    "error_log", "sleep", "file_get_contents", "file_put_contents",
    "fopen", "fwrite", "fclose", "curl_init", "json_encode",
    "json_decode", "serialize", "unserialize", "base64_encode",
    "base64_decode", "addslashes", "stripslashes", "nl2br",
    "similar_text", "levenshtein", "mysqli_connect", "prepare",
    "execute", "fetch", "bind_param", "query", "database", "mysql",
    "pdo", "sql", "select_from", "insert_into", "prepared"
];

// ---------- Palabras del modo Andaluz ----------
// Vocabulario y giros típicos del dialecto andaluz, tecleados tal
// y como se escriben (sin espacios, para que quepan en el tablero)
export const ANDALUZ_WORDS = [
    "jarta", "quillo", "illo", "usté", "vaina", "chiquero", "paje",
    "morapio", "alelí", "caló", "fainá", "tirilla", "peirón",
    "manco", "arreo", "majo", "ché", "ñaño", "choco", "gazpacho",
    "porrón", "pincho", "tapá", "caña", "merendú", "fritillanga",
    "tortas", "chorizo", "jamón", "migas", "zarangollo", "pipirrana",
    "caldero", "pimentón", "atún", "mojama", "salazón", "huerta",
    "sequía", "azeite", "vinagre", "pimiento", "sandía", "almejas",
    "gambas", "pulpo", "sepia", "chopos", "palmeras", "carretero",
    "venera", "alhucema", "azahar", "jara", "esparto", "almagra",
    "rejura", "chirigüela", "jipio", "cacharro", "madrugá",
    "sobremesa", "puchero", "berenjena", "almóndiga", "fritán"
];

// ---------- Palabras del modo Cúbico (Minecraft) ----------
// Mobes, bloques, objetos y dimensiones del juego de Mojang
export const MINECRAFT_WORDS = [
    "minecraft", "creeper", "enderman", "esqueleto", "zombi",
    "araña", "blaze", "ghast", "wither", "enderdragon", "dragón",
    "nether", "overworld", "slime", "piedra", "madera", "tierra",
    "arena", "obsidiana", "diamante", "esmeralda", "hierro",
    "carbón", "redstone", "cuarzo", "cobre", "granito", "bloque",
    "espada", "pico", "pala", "hacha", "arco", "flecha",
    "armadura", "yunque", "fragua", "horno", "baúl", "siembra",
    "cosecha", "granja", "aldea", "mina", "túnel", "antorcha",
    "lava", "bedrock", "bioma", "desierto", "taiga", "selva",
    "nieve", "océano", "isla", "montaña", "torre", "mazmorra",
    "templo", "encantamiento", "poción", "mena", "cantera",
    "crafting", "receta", "trigo", "zanahoria", "sandía",
    "calabaza", "melón", "luminas", "colocar", "romper",
    "construir", "explorar", "supervivencia", "creativo",
    "dificultad", "espantajo", "strider", "phantom", "hoglin",
    "axolotl", "abeja", "lobo", "gato", "pollo", "vaca", "cerdo",
    "oveja", "cabra", "conejo", "zorro", "oso", "llama", "tortuga"
];

// ---------- Palabras del modo Truco o trato (evento de Halloween) ----------
// Vocabulario terrorífico del evento de Halloween: calabazas,
// fantasmas y criaturas de la noche. Se escribe sin acentos para
// que las palabras se puedan teclear en todos los teclados.
export const HALLOWEEN_WORDS = {
    es: [
        "calabaza", "fantasma", "esqueleto", "vampiro", "bruja",
        "calavera", "telaraña", "araña", "monstruo", "zombi",
        "cementerio", "luna", "noche", "sombra", "miedo", "terror",
        "hechizo", "pocion", "disfraz", "caramelo", "truco", "trato",
        "hueso", "murcielago", "espantajo", "embrujado", "mausoleo",
        "ataud", "fantasmal", "demonio", "cripta", "osario", "sangre",
        "colmillo", "garras", "mascara", "medianoche", "trueno",
        "relampago", "embrujo", "maleficio", "nigromante", "halloween",
        "silueta", "vendaval", "calabobos"
    ],
    en: [
        "halloween", "ghost", "skeleton", "vampire", "witch",
        "pumpkin", "spider", "web", "monster", "zombie", "cemetery",
        "moon", "night", "shadow", "fear", "terror", "spell",
        "potion", "costume", "candy", "trick", "treat", "bone",
        "bat", "scarecrow", "haunted", "tomb", "crypt", "blood",
        "fang", "claw", "mask", "midnight", "thunder", "lightning",
        "ghoul", "demon", "scream", "coffin", "broomstick",
        "cauldron", "graveyard", "spooky", "creepy", "nightmare"
    ]
};
