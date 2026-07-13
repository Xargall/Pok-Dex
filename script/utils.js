// ============================================
// UTILS – Reine Hilfsfunktionen
// ============================================

const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 Tag in ms

// -- localStorage Cache --

function cacheSet(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
        console.warn("[cache] setItem fehlgeschlagen:", e);
    }
}

function cacheGet(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
}

// Nur relevante Felder für den Cache extrahieren
function slimPokemon(data) {
    if (!data) return null;
    return {
        id: data.id,
        name: data.name,
        types: data.types,
    };
}

// -- safeFetch mit Retry (kein Cache hier – Cache nur gezielt in api.js) --

async function safeFetch(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            const isLastAttempt = attempt === retries;
            if (!isLastAttempt) {
                await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
                continue;
            }
            console.error(`[fetch failed nach ${retries + 1} Versuchen]:`, url, e);
            return null;
        }
    }
}

// -- Name Helpers --

function formatPokemonName(name) {
    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    return name.split("-").map(capitalizeFirst).join(" ");
}

function applyNameSizing(ref, word) {
    ref.classList.remove("name_md", "name_sm");
    if (word.length > 14) ref.classList.add("name_sm");
    else if (word.length > 9) ref.classList.add("name_md");
}