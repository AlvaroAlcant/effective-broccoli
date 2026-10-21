// ---------- Constantes del juego y del ranking ----------
// ---------- Configuración ----------
export const GAME_TIME = 60;  // segundos
export const MAX_MISSES = 5;  // fallos permitidos por palabra (modo adivinar)
// Ventana de tiempo del logro «Speedrunner»: hay que escribir 10
// palabras en menos de este número de milisegundos
export const SPEEDRUN_MS = 8000;
// Segundos extra que regala la habilidad del fondo Elprico
export const BONUS_TIME_ELPRICO = 15;
// Letras que la habilidad del fondo Sopa de Letras deja ya puestas
export const SOUP_GIVEN = 2;

// ---------- Habilidades ACTIVAS de los fondos ----------
// Se disparan con la tecla reservada del apartado «Controles» (o con
// el botón de la habilidad). Turbo (Circuito) y Chica Rush (Five
// Nigths) solo se pueden usar UNA VEZ por partida; Hacker es pasiva
// y no se activa: se aplica sola con cada palabra escrita.
export const TURBO_MS = 10000;     // duración del modo Turbo (milisegundos)
export const TURBO_MAX = 4;        // letras de las palabras durante el Turbo
export const CHICA_MS = 20000;     // duración del Chica Rush
export const CHICA_SPAWN = 650;    // ms entre un cupcake y el siguiente
export const CHICA_LIFE = 2600;    // ms que espera cada cupcake a ser tocado
export const CHICA_MAX = 9;        // cupcakes vivos a la vez (no saturar la capa)
export const CHICA_CHANCE = 0.25;  // probabilidad de que el cupcake dé +1 s
// Baile calaca (fondo Calaca, tienda de evento de Halloween): mientras
// dura, salen esqueletos bailando y las N siguientes palabras son de
// HUESOS y partes del cuerpo, con DOBLE de puntos, monedas y caramelos.
export const BAIL_WORDS = 15;      // palabras con bonus de huesos
export const BAIL_BURST = 7;       // esqueletos del primer golpe
export const BAIL_SPAWN = 1400;    // ms entre un esqueleto y el siguiente
export const BAIL_MAX = 10;        // esqueletos bailando a la vez (tope)
export const BAIL_LIFE = 6500;     // ms que baila cada esqueleto
// Chatarra (fondo Company, tienda de evento): trozos de chatarra que
// aparecen durante la partida y que, al tocarlos, dan experiencia extra
export const SCRAP_SPAWN = 2600;   // ms entre un trozo y el siguiente
export const SCRAP_MAX = 4;        // trozos en pantalla a la vez (tope)
export const SCRAP_LIFE = 5000;    // ms que espera cada trozo a ser tocado
export const SCRAP_XP = 6;         // experiencia que regala cada trozo

// ---------- Modo Aventura ----------
// Segundos con los que se empieza: cada palabra escrita suma más
export const ADV_TIME = 50;
// Palabras escritas entre parada y parada para elegir una ventaja.
// Cada parada celebrada alarga el hueco siguiente una palabra más
// (hasta ADV_EVERY_MAX): las ventajas van saliendo cada vez menos
export const ADV_EVERY = 5;
export const ADV_EVERY_MAX = 14;
// El reloj de Aventura se acelera con el nivel: por cada nivel pasa
// un ADV_SPEED_STEP más deprisa, hasta doble velocidad (solo allí)
export const ADV_SPEED_STEP = 0.05;
export const ADV_SPEED_MAX = 2;
// Margen extra que admite el ranking por la ventaja "puntos x2"
export const ADV_SCORE_SLACK = 8000;

// ---------- Modo Supervivencia ----------
// El tablero se agranda y las palabras NACEN ARRIBA DEL TODO y van
// BAJANDO por su columna hasta llegar al fondo de la pantalla. Si una
// palabra llega hasta abajo, se pierde una de las SUP_LIVES vidas; sin
// vidas se acaba la partida. Hay que disparar todas sus letras antes
// de que toque el fondo. Se empieza con una sola palabra en pantalla
// y van apareciendo más según se escribe.
export const SUP_LIVES = 5;        // vidas con las que se empieza
export const SUP_TIME = 22;        // segundos que tarda la primera palabra en bajar
export const SUP_TIME_MIN = 5;     // mínimo de segundos de bajada por palabra
export const SUP_TIME_STEP = 0.8;  // segundos que se restan por nivel
export const SUP_SPEED_STEP = 0.08;// aceleración del reloj por nivel
export const SUP_SPEED_MAX = 2;    // el reloj nunca pasa de doble velocidad
export const SUP_XP_WORD = 10;     // experiencia fija de cada palabra disparada
export const SUP_MAX_WORDS = 6;    // palabras en pantalla a la vez (tope)
// La dificultad sube con el TIEMPO jugado, no con lo que se escribe:
// los primeros SUP_GRACE segundos todo va muuuuy despacio (nivel 1) y
// a partir de ahí toca un nivel nuevo cada SUP_RAMP segundos, así que
// las palabras caen cada vez más deprisa y caben más a la vez.
export const SUP_GRACE = 18;       // segundos de calma al empezar
export const SUP_RAMP = 16;        // segundos que pasan entre nivel y nivel
// Disparo de las letras (modo Supervivencia): cada letra aceptada sale
// volando desde el campo de escritura hasta su casilla de la palabra
export const SHOT_MS = 260;        // duración del vuelo de una letra
export const SHOT_GAP = 70;        // desfase entre varias letras de golpe
// Columnas por las que bajan las palabras (porcentajes de la
// izquierda): en pantallas estrechas solo caben dos
export const SUP_LANES_WIDE = ["4%", "37%", "70%"];
export const SUP_LANES_NARROW = ["4%", "51%"];

// ---------- Evento de Halloween: caramelos y modo Encantado ----------
// Los caramelos son la MONEDA DEL EVENTO: se ganan jugando a cualquier
// modo (la misma cantidad que darían las monedas) y solo se gastan en
// la tienda de evento mientras dura Halloween (8 oct – 3 nov, 12:00).
export const ENC_ALFABETO = "abcdefghijklmnñopqrstuvwxyz";  // letras con fantasma
export const ENC_CANDY_HIT = 1;    // caramelos de cada letra acertada
export const ENC_CANDY_FAIL = 2;   // caramelos que resta cada tecla fallada
export const ENC_MAX_GHOSTS = 6;   // fantasmas en pantalla a la vez (tope)
export const ENC_MIN_TIME = 8;     // segundos mínimos de bajada de una letra
export const ENC_GHOST_STEP = 4;   // letras acertadas por cada fantasma más
export const ENC_TIME_STEP = 0.7;  // segundos que se restan por letra acertada
export const ENC_SPEED_STEP = 0.05;// aceleración del descenso por letra acertada

// Ranking global: JSON público compartido por todos los visitantes.
// Si no hay internet se usa la copia guardada en este dispositivo.
export const RANK_URL = "https://mantledb.sh/v2/teclear-ranking/ranking";
// Ranking del modo Aventura: documento aparte, MISMO formato que el
// global (mismas columnas, mismos límites, mismas huellas y Top 10).
export const RANK_ADV_URL = "https://mantledb.sh/v2/teclear-ranking/aventura";
export const NAMES_URL = "https://mantledb.sh/v2/teclear-ranking/nombres"; // nombres ya reservados
export const RESETS_URL = "https://mantledb.sh/v2/teclear-ranking/resetos"; // reinicios de puntuación
export const RANK_MAX = 10;       // puntuaciones que se guardan/muestran
export const NAMES_MAX = 500;     // nombres que admite la lista de reservas
export const RANK_TIMEOUT = 8000; // ms de espera antes de dar por perdida una petición
export const NAME_MAX = 20;       // longitud máxima del nombre del jugador
// Límites de seguridad: una fila que los supera es imposible de lograr
// jugando, así que se descarta (protege el JSON frente a ediciones manuales)
export const MAX_SCORE = 50000000;   // puntos absolutos admisibles
export const MAX_WORDS = 50000;      // palabras absolutas admisibles
export const PTS_PER_WORD = 600;     // puntos máximos alcanzables por palabra
// Mayor multiplicador que puede alcanzar una palabra al escribirla:
// la habilidad del fondo Ia triplica puntos y monedas en las largas
export const SCORE_BOOST = 3;
export const SEAL_SALT = "teclear.v1"; // sal del sello de integridad

// Perfiles de usuario: mismo almacén que el ranking, documento aparte.
// La contraseña JAMÁS se guarda: solo su resumen con sal y con varias
// iteraciones, de modo que quien descargue el JSON no puede leerla.
export const PROFILES_URL = "https://mantledb.sh/v2/teclear-ranking/perfiles";
export const PASS_MIN = 6;          // longitud mínima de la contraseña
export const KDF_ROUNDS = 20000;    // iteraciones al resumir la contraseña
