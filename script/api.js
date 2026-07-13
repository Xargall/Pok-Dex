// ============================================
// API – PokéAPI Kommunikation
// Abhängigkeiten: safeFetch (utils.js), imageCache (script.js)
// ============================================

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SPRITES_ARTWORK = `${SPRITES_BASE}/other/official-artwork`;

const loadPokemonInfo = (id) => safeFetch(`${POKEAPI_BASE}/pokemon/${id}/`);
const getPkmDescription = (id) => safeFetch(`${POKEAPI_BASE}/pokemon-species/${id}`);
const getPkmDescriptionByUrl = (url) => safeFetch(url);

async function fetchAllPokemonNames() {
    const data = await safeFetch(`${POKEAPI_BASE}/pokemon?limit=100000`);
    allPokemonList = data?.results || [];
    return !!data; // true = erfolgreich, false = aus Cache oder fehlgeschlagen
}

function getFrontPicture(pokeID) {
    return new Promise((resolve) => {
        const url = `${SPRITES_ARTWORK}/${pokeID}.png`;

        if (imageCache[pokeID]) {
            const img = new Image();
            img.src = imageCache[pokeID];
            resolve(img);
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache[pokeID] = url;
            resolve(img);
        };
        img.onerror = () => {
            // Fallback auf den kleinen Default-Sprite
            const fallbackUrl = `${SPRITES_BASE}/${pokeID}.png`;
            imageCache[pokeID] = fallbackUrl;
            const fallback = new Image();
            fallback.src = fallbackUrl;
            resolve(fallback);
        };
    });
}

async function fetchEvoChain(pokeId) {
    if (pokeId > 10000) return null;
    const species = await safeFetch(`${POKEAPI_BASE}/pokemon-species/${pokeId}`);
    if (!species?.evolution_chain?.url) return null;
    const evoData = await safeFetch(species.evolution_chain.url);
    return evoData?.chain || null;
}