// Acceso centralizado a la persistencia local del navegador.
// Todas las lecturas/escrituras pasan por aquí: si el almacenamiento no
// está disponible (SSR, incógnito, cuotas), el juego sigue funcionando
// con valores por defecto en vez de romperse.
export class StorageService {
    get(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    getJSON(key, fallback = null) {
        const raw = this.get(key);
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    setJSON(key, value) {
        try {
            this.set(key, JSON.stringify(value));
        } catch (e) { /* valor no serializable */ }
    }

    getInt(key, fallback = 0) {
        const n = parseInt(this.get(key) || "", 10);
        return Number.isNaN(n) ? fallback : n;
    }
}

export const storage = new StorageService();
