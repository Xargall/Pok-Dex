// ============================================
// API – PokéAPI Kommunikation
// Abhängigkeiten: safeFetch, cacheGet, cacheSet, slimPokemon (utils.js)
// ============================================

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SPRITES_ARTWORK = `${SPRITES_BASE}/other/official-artwork`;

// allPokemonList cachen – kleine Liste, ändert sich kaum
async function fetchAllPokemonNames() {
    const cached = cacheGet("allPokemonList");
    if (cached) {
        allPokemonList = cached;
        return true;
    }
    const data = await safeFetch(`${POKEAPI_BASE}/pokemon?limit=100000`);
    allPokemonList = data?.results || [];
    if (data) cacheSet("allPokemonList", allPokemonList);
    return !!data;
}

// Pokémon-Info: frisch laden, aber slim-Version cachen
async function loadPokemonInfo(id) {
    const data = await safeFetch(`${POKEAPI_BASE}/pokemon/${id}/`);
    if (data) cacheSet(`pkm:${id}`, slimPokemon(data)); // nur name, id, types
    return data; // volle Daten für die App
}

// Aus Cache wiederherstellen falls API down – nur für Grundanzeige
function loadPokemonInfoFromCache(id) {
    return cacheGet(`pkm:${id}`);
}

const getPkmDescription = (id) => safeFetch(`${POKEAPI_BASE}/pokemon-species/${id}`);
const getPkmDescriptionByUrl = (url) => safeFetch(url);

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